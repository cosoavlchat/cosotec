import crypto from "crypto";
import { adminDb } from "@/lib/firebase/admin";
import { getQuotesTokenSecret } from "@/lib/config/secrets";
import {
  calcularCotizacion,
  CotizacionItemInput,
  ViaticosInput,
  OpcionesCotizacion,
} from "@/lib/pricing";
import { Quote, ItemSnapshot, QuoteCustomer } from "@/types/quote";

const FOLIO_INICIAL = 1124450; // Primer folio emitido será CT-1124451

/**
 * Genera el siguiente folio consecutivo "CT-XXXXXXX" mediante una transacción atómica
 * en Firestore sobre el documento counters/folios.
 */
export async function generarSiguienteFolio(): Promise<string> {
  const counterRef = adminDb.collection("counters").doc("folios");

  const nuevoFolioNumero = await adminDb.runTransaction(async (transaction) => {
    const doc = await transaction.get(counterRef);
    let nextValue = FOLIO_INICIAL + 1;

    if (doc.exists) {
      const data = doc.data();
      const current = typeof data?.current === "number" ? data.current : FOLIO_INICIAL;
      nextValue = current + 1;
    }

    transaction.set(
      counterRef,
      {
        current: nextValue,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return nextValue;
  });

  return `CT-${nuevoFolioNumero}`;
}

/**
 * Genera un token aleatorio criptográficamente seguro (24 bytes, base64url).
 */
export function generarTokenAleatorio(): string {
  return crypto.randomBytes(24).toString("base64url");
}

export const MODELOS_CONFIRMADOS_OFICIALES = ["JC181", "JC450", "Y04g", "Y04G"];

/**
 * Determina si se debe mostrar el modelo del equipo en vista de cliente, PDF, admin y correos.
 * REGLA FASE 4: Solo se muestra si modeloConfirmado === true.
 * Para cotizaciones históricas o sin esa bandera, aplica la lista oficial de confirmados.
 */
export function debeMostrarModelo(item?: { modelo?: string; modeloConfirmado?: boolean }): boolean {
  if (!item || !item.modelo || !item.modelo.trim()) return false;
  const mod = item.modelo.trim();
  if (item.modeloConfirmado === true) return true;
  return MODELOS_CONFIRMADOS_OFICIALES.some((m) => m.toLowerCase() === mod.toLowerCase());
}

/**
 * Genera el hash criptográfico HMAC-SHA256 del token para almacenarlo en Firestore.
 * El token plano jamás se almacena en la base de datos.
 */
export function hashToken(token: string): string {
  const secret = getQuotesTokenSecret();
  return crypto.createHmac("sha256", secret).update(token).digest("hex");
}

/**
 * Valida si un token proporcionado coincide con el hash almacenado en la cotización
 * utilizando comparación en tiempo constante (timingSafeEqual).
 */
export function validarTokenCotizacion(tokenHashEnBd: string, tokenRecibido: string): boolean {
  if (!tokenRecibido || typeof tokenRecibido !== "string" || !tokenHashEnBd) {
    return false;
  }
  const hashCalculado = hashToken(tokenRecibido);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(hashCalculado, "utf8"),
      Buffer.from(tokenHashEnBd, "utf8")
    );
  } catch {
    return false;
  }
}

export interface CrearCotizacionInput {
  cliente: QuoteCustomer;
  items: Array<{
    id: string;
    cantidad: number;
  }>;
  estadoClave?: string; // Ej. "MEX", "CDMX", "VER"
  opciones?: {
    descuentoVendedorPorcentaje?: number;
    topeDescuentoVendedor?: number;
    vigenciaDias?: number;
  };
  origen?: "web_asistente" | "carrito" | "vendedor" | "chatbot";
  vendedorId?: string;
  vendedorNombre?: string;
}

/**
 * Crea una cotización oficial en Firestore:
 * 1. Lee la vigencia dinámica desde settings/pricing.vigenciaDias.
 * 2. Carga los productos y congela el snapshot inmutable de precios.
 * 3. Ejecuta calcularCotizacion() agregando instalaciones si incluyeInstalacion === false.
 * 4. Asigna folio consecutivo CT- en transacción.
 * 5. Genera token aleatorio revocable y persiste su hash.
 */
export async function crearCotizacionServidor(input: CrearCotizacionInput): Promise<Quote> {
  // 1. Cargar configuración de pricing (vigencia, IVA, descuentos)
  const pricingSnap = await adminDb.collection("settings").doc("pricing").get();
  const pricingData = pricingSnap.exists ? pricingSnap.data() : null;

  // REGLA FASE 3: La vigencia se lee de settings/pricing.vigenciaDias (no fija)
  const vigenciaDias = input.opciones?.vigenciaDias ?? pricingData?.vigenciaDias ?? 15;
  const createdAt = new Date().toISOString();
  const venceDate = new Date();
  venceDate.setDate(venceDate.getDate() + vigenciaDias);
  const venceAt = venceDate.toISOString();

  // 2. Cargar productos desde Firestore para congelar precios reales
  const itemsSnapshot: ItemSnapshot[] = [];
  const itemsParaCalculo: CotizacionItemInput[] = [];

  for (const itemReq of input.items) {
    const prodDoc = await adminDb.collection("products").doc(itemReq.id).get();
    if (!prodDoc.exists) {
      throw new Error(`Producto con ID '${itemReq.id}' no existe en el catálogo.`);
    }
    const prodData = prodDoc.data()!;

    if (prodData.activo === false) {
      throw new Error(`El producto "${prodData.nombreComercial}" no está activo.`);
    }
    if (prodData.revisarPrecio === true) {
      throw new Error(
        `El producto "${prodData.nombreComercial}" tiene precio en revisión y no puede cotizarse en línea.`
      );
    }

    const itemSnap: ItemSnapshot = {
      id: prodData.id || itemReq.id,
      nombre: prodData.nombreComercial,
      modelo: prodData.modelo,
      categoria: prodData.categoria,
      precioSinIvaCentavos: prodData.precioSinIvaCentavos,
      cantidad: itemReq.cantidad,
      esEquipoPrincipal: prodData.esEquipoPrincipal,
      incluyeInstalacion: prodData.incluyeInstalacion,
      incluyePlanPrimerAnio: prodData.incluyePlanPrimerAnio,
    };
    itemsSnapshot.push(itemSnap);

    itemsParaCalculo.push({
      id: itemSnap.id,
      nombre: itemSnap.nombre,
      precioSinIvaCentavos: itemSnap.precioSinIvaCentavos,
      cantidad: itemSnap.cantidad,
      esEquipoPrincipal: itemSnap.esEquipoPrincipal,
      categoria: itemSnap.categoria,
      activo: prodData.activo,
      revisarPrecio: prodData.revisarPrecio,
      recurrentes: prodData.recurrentes,
      incluyeInstalacion: prodData.incluyeInstalacion,
    });
  }

  // 3. Cargar viáticos del estado si fue indicado
  let viaticosInput: ViaticosInput | undefined;
  let estadoNombre = "";

  if (input.estadoClave) {
    const feeDoc = await adminDb.collection("travelFees").doc(input.estadoClave).get();
    if (feeDoc.exists) {
      const feeData = feeDoc.data()!;
      estadoNombre = feeData.estadoNombre;
      viaticosInput = {
        estadoId: feeData.id,
        estadoNombre: feeData.estadoNombre,
        sinCosto: feeData.sinCosto,
        montoPorVisitaCentavos: feeData.montoPorVisitaCentavos,
        montoPorUnidadCentavos: feeData.montoPorUnidadCentavos,
      };
    }
  }

  const opcionesCalculo: OpcionesCotizacion = {
    ivaPorcentaje: pricingData?.ivaPorcentaje ?? 16,
    descuentoVolumen: pricingData?.descuentoVolumen,
    descuentoVendedorPorcentaje: input.opciones?.descuentoVendedorPorcentaje,
    topeDescuentoVendedor:
      input.opciones?.topeDescuentoVendedor ?? pricingData?.topeDescuentoVendedor ?? 5,
    planesConfig: {
      msiPlazos: pricingData?.msi ?? [],
    },
  };

  // 4. Calcular cotización en servidor
  const calculo = calcularCotizacion(itemsParaCalculo, viaticosInput, opcionesCalculo);

  // 5. Generar folio atómico en transacción y token aleatorio seguro
  const folio = await generarSiguienteFolio();
  const tokenPlano = generarTokenAleatorio();
  const tokenHash = hashToken(tokenPlano);

  const quote: Quote = {
    id: folio,
    folio,
    tokenHash,
    token: tokenPlano, // Devuelto al solicitante
    cliente: input.cliente,
    items: itemsSnapshot,
    estadoInstalacion: input.estadoClave
      ? { clave: input.estadoClave, nombre: estadoNombre }
      : undefined,
    calculo,
    snapshotPrecios: {
      fecha: createdAt,
      ivaPorcentaje: calculo.ivaPorcentaje,
      descuentoVolumenPorcentaje: calculo.porcentajeDescuentoVolumen,
      items: itemsSnapshot,
    },
    origen: input.origen || "web_asistente",
    vendedorId: input.vendedorId,
    vendedorNombre: input.vendedorNombre,
    estado: "emitida",
    createdAt,
    vigenciaDias,
    venceAt,
    urlPublica: `/c/${folio}?t=${tokenPlano}`,
  };

  // 6. Guardar en Firestore (persistiendo tokenHash, no el token plano)
  const { token: _plano, ...quoteToSave } = quote;
  await adminDb.collection("quotes").doc(folio).set(quoteToSave);

  return quote;
}

/**
 * Regenera el enlace seguro de una cotización (Acción para Admin y Vendedor dueño).
 * Invalida inmediatamente el token anterior sustituyendo su hash en Firestore.
 */
export async function regenerarTokenCotizacion(
  folio: string,
  solicitante: { role: string; uid: string }
): Promise<{ folio: string; token: string; urlPublica: string }> {
  const docRef = adminDb.collection("quotes").doc(folio);
  const docSnap = await docRef.get();
  if (!docSnap.exists) {
    throw new Error(`La cotización '${folio}' no existe.`);
  }
  const quote = docSnap.data() as Quote;

  const esAdmin = solicitante.role === "admin";
  const esVendedorDuenio =
    solicitante.role === "vendedor" && quote.vendedorId === solicitante.uid;

  if (!esAdmin && !esVendedorDuenio) {
    throw new Error(
      "No tienes permisos para regenerar el enlace de esta cotización. Solo administradores o el vendedor responsable pueden realizarlo."
    );
  }

  const nuevoToken = generarTokenAleatorio();
  const nuevoHash = hashToken(nuevoToken);
  const urlPublica = `/c/${folio}?t=${nuevoToken}`;

  await docRef.update({
    tokenHash: nuevoHash,
    tokenRegeneradoAt: new Date().toISOString(),
    urlPublica,
  });

  return {
    folio,
    token: nuevoToken,
    urlPublica,
  };
}

/**
 * Obtiene una cotización por su folio.
 */
export async function obtenerCotizacionPorFolio(folio: string): Promise<Quote | null> {
  const doc = await adminDb.collection("quotes").doc(folio).get();
  if (!doc.exists) return null;
  return doc.data() as Quote;
}
