import { adminDb, FieldValue } from "@/lib/firebase/admin";
import { Cart, CartItem, CartContacto, CartInstalacion, CartUnidadVehiculo, CartFactura, CartPago, CartStep } from "@/types/cart";
import { calcularCotizacion, ViaticosInput, CotizacionItemInput } from "@/lib/pricing";
import { initialTravelFees } from "../../../scripts/seed-data";
import { esMunicipioSinCosto } from "@/lib/pricing/zonas-sin-costo";
import { generarCartId } from "./session";

export { generarCartId };

/**
 * Obtiene la configuración de viáticos para un estado y municipio dados desde Firestore o seed fallback.
 * Aplica viáticos sin costo exclusivamente si el municipio pertenece a la zona metropolitana oficial.
 */
export async function getViaticosPorEstado(estadoClave: string, municipio?: string): Promise<ViaticosInput> {
  const estadosConZona = ["MEX", "CDMX", "NLE", "JAL", "QRO"];

  if (estadosConZona.includes(estadoClave)) {
    const esSinCosto = municipio ? esMunicipioSinCosto(estadoClave, municipio) : false;
    return {
      estadoId: estadoClave,
      sinCosto: esSinCosto,
      montoPorVisitaCentavos: 0,
      montoPorUnidadCentavos: 0,
    };
  }

  try {
    const docRef = adminDb.collection("travelFees").doc(estadoClave);
    const snap = await docRef.get();
    if (snap.exists) {
      const data = snap.data();
      return {
        estadoId: estadoClave,
        estadoNombre: data?.estadoNombre,
        sinCosto: data?.sinCosto ?? false,
        montoPorVisitaCentavos: data?.montoPorVisitaCentavos ?? 0,
        montoPorUnidadCentavos: data?.montoPorUnidadCentavos ?? 0,
      };
    }
  } catch (error) {
    console.warn(`[getViaticosPorEstado] Error leyendo travelFees/${estadoClave}, usando fallback:`, error);
  }

  // Fallback a initialTravelFees
  const found = initialTravelFees.find((t) => t.id === estadoClave || t.claveInegi === estadoClave);
  if (found) {
    return {
      estadoId: found.id,
      estadoNombre: found.estadoNombre,
      sinCosto: found.sinCosto,
      montoPorVisitaCentavos: found.montoPorVisitaCentavos,
      montoPorUnidadCentavos: found.montoPorUnidadCentavos,
    };
  }

  return {
    estadoId: estadoClave,
    sinCosto: false,
    montoPorVisitaCentavos: 0,
    montoPorUnidadCentavos: 0,
  };
}

/**
 * Recalcula la cotización del carrito usando precios de catálogo y reglas centralizadas.
 */
export async function recalcularCarrito(
  items: CartItem[],
  instalacion?: CartInstalacion
) {
  if (!items || items.length === 0) {
    return undefined;
  }

  // Mapear items al input canónico de cotización
  const itemsInput: CotizacionItemInput[] = items.map((it) => ({
    id: it.id,
    nombre: it.nombre,
    precioSinIvaCentavos: it.precioSinIvaCentavos,
    cantidad: it.cantidad,
    esEquipoPrincipal: it.esEquipoPrincipal,
    categoria: it.categoria,
    incluyeInstalacion: it.incluyeInstalacion,
    incluyePlanPrimerAnio: it.incluyePlanPrimerAnio,
  }));

  // Obtener viáticos si hay estado seleccionado
  let viaticosInput: ViaticosInput | undefined = undefined;
  if (instalacion?.estadoClave) {
    viaticosInput = await getViaticosPorEstado(instalacion.estadoClave, instalacion.municipio);
  }

  // Obtener settings de pricing
  let pricingOptions = undefined;
  try {
    const snap = await adminDb.collection("settings").doc("pricing").get();
    if (snap.exists) {
      const data = snap.data();
      pricingOptions = {
        ivaPorcentaje: data?.ivaPorcentaje ?? 16,
        descuentoVolumen: data?.descuentoVolumen || {
          umbralUnidades: data?.descuentoVolumenUmbral ?? 5,
          porcentaje: data?.descuentoVolumenPorcentaje ?? 10,
        },
        topeDescuentoVendedor: data?.topeDescuentoVendedor ?? data?.descuentoVendedorTope ?? 5,
        instalacionAccesorioConEquipo: data?.instalacionAccesorioConEquipo ?? false,
        planesConfig: {
          crediContadoPorcentajeCompra: data?.planesPago?.crediContado?.porcentajeCompra ?? 55,
          enganchePorcentaje: data?.planesPago?.enganche?.porcentajeEnganche ?? 55,
          engancheMensualidadesCount: data?.planesPago?.enganche?.mensualidadesCount ?? 2,
          msiPlazos: data?.msi ?? data?.planesPago?.msi?.plazos ?? [],
        },
      };
    }
  } catch (e) {
    console.warn("[recalcularCarrito] No se pudo leer settings/pricing:", e);
  }

  return calcularCotizacion(itemsInput, viaticosInput, pricingOptions);
}

/**
 * Guarda o actualiza un carrito en Firestore de forma atómica.
 */
export async function saveCartToFirestore(cartData: Partial<Cart> & { id: string }): Promise<Cart> {
  const docRef = adminDb.collection("carts").doc(cartData.id);
  const existingSnap = await docRef.get();
  const now = new Date().toISOString();

  let merged: Cart;

  if (existingSnap.exists) {
    const prev = existingSnap.data() as Cart;
    if ((prev.isQuoteSnapshot || prev.quoteFolio) && cartData.items && JSON.stringify(prev.items) !== JSON.stringify(cartData.items)) {
      throw new Error(`Esta compra corresponde a la cotización ${prev.quoteFolio || ""}; para cambios contacta a tu asesor`);
    }
    merged = {
      ...prev,
      ...cartData,
      estado: cartData.estado || prev.estado || "activo",
      updatedAt: now,
    };
  } else {
    merged = {
      id: cartData.id,
      pasoActual: cartData.pasoActual || 1,
      estado: cartData.estado || "activo",
      items: cartData.items || [],
      contacto: cartData.contacto,
      instalacion: cartData.instalacion,
      unidades: cartData.unidades,
      factura: cartData.factura,
      pago: cartData.pago,
      quoteFolio: cartData.quoteFolio,
      isQuoteSnapshot: cartData.isQuoteSnapshot,
      createdAt: now,
      updatedAt: now,
      userAgent: cartData.userAgent,
    };
  }

  const docData: Record<string, any> = { ...merged };

  // Recalcular montos e IVA si hay items
  if (merged.items && merged.items.length > 0) {
    merged.calculo = await recalcularCarrito(merged.items, merged.instalacion);
    docData.calculo = merged.calculo;
    if (merged.instalacion && merged.calculo) {
      merged.instalacion.viaticosPorConfirmar = merged.calculo.viaticosPorConfirmar;
      merged.instalacion.viaticosCentavos = merged.calculo.viaticosCentavos;
      docData.instalacion = merged.instalacion;
    }
  } else {
    merged.calculo = undefined;
    docData.calculo = FieldValue.delete();
    if (merged.instalacion) {
      merged.instalacion.viaticosCentavos = 0;
      merged.instalacion.viaticosPorConfirmar = false;
      docData.instalacion = merged.instalacion;
    }
  }

  await docRef.set(docData, { merge: true });
  return merged;
}

/**
 * Obtiene un carrito por su ID.
 */
export async function getCartFromFirestore(cartId: string): Promise<Cart | null> {
  if (!cartId) return null;
  const snap = await adminDb.collection("carts").doc(cartId).get();
  if (!snap.exists) return null;
  return snap.data() as Cart;
}

