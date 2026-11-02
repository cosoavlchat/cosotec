import { adminDb, isFirestoreReady, recordAuditLog } from "@/lib/firebase/admin";
import {
  calcularCotizacion,
  CotizacionItemInput,
  ViaticosInput,
  OpcionesCotizacion,
  formatMxn,
} from "@/lib/pricing";
import { Quote, ItemSnapshot, QuoteStatus, QuoteCustomer } from "@/types/quote";
import { UserRole } from "@/types/user";
import { getCustomerById } from "@/lib/services/customer-service";
import { esMunicipioSinCosto } from "@/lib/pricing/zonas-sin-costo";
import {
  generarSiguienteFolio,
  generarTokenAleatorio,
  hashToken,
} from "@/lib/quotes";

export interface ServiceUser {
  uid: string;
  email: string;
  nombre?: string;
  whatsapp?: string;
  role: UserRole;
  topeDescuento?: number;
}

export interface ItemCotizacionInput {
  id: string; // ID en products o paquetes, o ID temporal si es concepto libre
  tipo?: "producto" | "paquete" | "nivel_solucion" | "concepto_libre";
  cantidad: number;
  esConceptoLibre?: boolean;
  nombreLibre?: string;
  descripcionLibre?: string;
  precioLibreSinIvaCentavos?: number;
}

export interface CrearCotizacionVendedorInput {
  clienteId: string;
  items: ItemCotizacionInput[];
  instalacion?: {
    estadoClave: string; // Ej. "MEX"
    municipio: string;
    viaticosManualCentavos?: number; // Para municipios foráneos
  };
  condiciones: {
    planSeleccionado: "contado" | "credi_contado" | "enganche_mensualidades" | "msi";
    msiPlazoSeleccionado?: number;
    descuentoAdicionalPorcentaje: number;
    solicitoExcesoDescuento?: boolean;
    justificacionDescuento?: string;
    vigenciaDias?: number;
    notasCliente?: string;
    notasInternas?: string;
  };
  origen?: "vendedor" | "admin";
}

/**
 * Obtiene la lista de cotizaciones respetando permisos por rol:
 * - Vendedor: ve y edita únicamente sus cotizaciones.
 * - Admin: ve todas y puede filtrar por vendedor.
 */
export async function getQuotes(
  user: ServiceUser,
  filtros?: {
    estado?: QuoteStatus;
    vendedorId?: string;
    clienteId?: string;
    fechaInicio?: string;
    fechaFin?: string;
  }
): Promise<Quote[]> {
  if (!(await isFirestoreReady())) return [];

  let query: FirebaseFirestore.Query = adminDb.collection("quotes");

  if (user.role === "vendedor") {
    query = query.where("vendedorId", "==", user.uid);
  } else if (filtros?.vendedorId) {
    query = query.where("vendedorId", "==", filtros.vendedorId);
  }

  if (filtros?.estado) {
    query = query.where("estado", "==", filtros.estado);
  }

  let snap;
  try {
    snap = await query.orderBy("createdAt", "desc").get();
  } catch {
    // Fallback con ordenamiento en memoria si el índice compuesto de Firestore aún no está listo
    snap = await query.get();
  }
  let quotes = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Quote));
  quotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Filtros adicionales en memoria si aplica
  if (filtros?.clienteId) {
    quotes = quotes.filter((q) => q.cliente.id === filtros.clienteId);
  }
  if (filtros?.fechaInicio) {
    quotes = quotes.filter((q) => q.createdAt >= filtros.fechaInicio!);
  }
  if (filtros?.fechaFin) {
    quotes = quotes.filter((q) => q.createdAt <= filtros.fechaFin!);
  }

  return quotes;
}

/**
 * Obtiene el detalle de una cotización validando permisos de rol.
 */
export async function getQuoteByFolio(
  folio: string,
  user: ServiceUser
): Promise<Quote | null> {
  if (!(await isFirestoreReady())) return null;

  const doc = await adminDb.collection("quotes").doc(folio).get();
  if (!doc.exists) return null;

  const data = { id: doc.id, ...doc.data() } as Quote;

  if (user.role === "vendedor" && data.vendedorId !== user.uid) {
    throw new Error("No tienes permiso para consultar esta cotización.");
  }

  return data;
}

/**
 * Crea una cotización oficial emitida por un vendedor o admin.
 */
export async function crearCotizacionVendedor(
  input: CrearCotizacionVendedorInput,
  user: ServiceUser
): Promise<Quote> {
  if (!input.items || input.items.length === 0) {
    throw new Error("Debes agregar al menos un concepto a la cotización.");
  }

  // 1. Validar Cliente
  const cliente = await getCustomerById(input.clienteId, user);
  if (!cliente) {
    throw new Error("El cliente seleccionado no existe o no pertenece a tu cartera.");
  }

  // 2. Cargar configuraciones globales
  const [pricingSnap, featuresSnap, userDoc] = await Promise.all([
    adminDb.collection("settings").doc("pricing").get(),
    adminDb.collection("settings").doc("features").get(),
    adminDb.collection("users").doc(user.uid).get(),
  ]);

  const pricingData = pricingSnap.exists ? pricingSnap.data() : null;
  const featuresData = featuresSnap.exists ? featuresSnap.data() : null;
  const userData = userDoc.exists ? userDoc.data() : null;

  // Tope de descuento del vendedor: de users o fallback a pricingSettings
  const topeVendedor =
    userData?.topeDescuento ??
    user.topeDescuento ??
    pricingData?.topeDescuentoVendedor ??
    5;

  const permitirConceptoLibre = featuresData?.permitirConceptoLibre === true;

  // 3. Procesar Renglones y Congelar Snapshot
  const itemsSnapshot: ItemSnapshot[] = [];
  const itemsParaCalculo: CotizacionItemInput[] = [];

  for (const itemReq of input.items) {
    if (itemReq.cantidad <= 0) {
      throw new Error("La cantidad de cada renglón debe ser mayor a 0.");
    }

    if (itemReq.esConceptoLibre) {
      if (!permitirConceptoLibre) {
        throw new Error(
          "Los conceptos libres están desactivados en la configuración de la empresa."
        );
      }
      if (!itemReq.nombreLibre?.trim()) {
        throw new Error("Debes indicar un nombre para el concepto libre.");
      }
      const precioSinIva = itemReq.precioLibreSinIvaCentavos ?? 0;
      if (precioSinIva < 0) {
        throw new Error("El precio del concepto libre no puede ser negativo.");
      }

      const libreSnap: ItemSnapshot = {
        id: `libre-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        nombre: itemReq.nombreLibre.trim(),
        categoria: "servicio",
        precioSinIvaCentavos: precioSinIva,
        cantidad: itemReq.cantidad,
        esEquipoPrincipal: false,
        esConceptoLibre: true,
        descripcionConceptoLibre: itemReq.descripcionLibre?.trim() || "",
        queIncluye: [itemReq.descripcionLibre?.trim() || itemReq.nombreLibre.trim()],
      };
      itemsSnapshot.push(libreSnap);
      itemsParaCalculo.push({
        id: libreSnap.id,
        nombre: libreSnap.nombre,
        precioSinIvaCentavos: libreSnap.precioSinIvaCentavos,
        cantidad: libreSnap.cantidad,
        esEquipoPrincipal: false,
        categoria: "servicio",
        activo: true,
        revisarPrecio: false,
        incluyeInstalacion: true,
      });

      // Registro en auditLog por concepto libre
      await recordAuditLog({
        userId: user.uid,
        userEmail: user.email,
        entity: "quote",
        entityId: libreSnap.id,
        action: "create",
        before: null,
        after: libreSnap,
        metadata: { conceptoLibre: true, precioSinIvaCentavos: precioSinIva },
      });

      continue;
    }

    // Producto o Paquete del catálogo
    let prodDoc = await adminDb.collection("products").doc(itemReq.id).get();
    let esPaquete = false;
    if (!prodDoc.exists) {
      prodDoc = await adminDb.collection("packages").doc(itemReq.id).get();
      esPaquete = true;
    }

    if (!prodDoc.exists) {
      throw new Error(`El equipo o paquete con ID '${itemReq.id}' no existe en el catálogo.`);
    }

    const prodData = prodDoc.data()!;
    if (prodData.activo === false) {
      throw new Error(`El equipo "${prodData.nombreComercial || prodData.nombre}" no está activo.`);
    }
    if (prodData.revisarPrecio === true) {
      throw new Error(
        `El equipo "${prodData.nombreComercial || prodData.nombre}" tiene precio por confirmar.`
      );
    }

    // Advertencia de compatibilidad (ej. JC450 o DashCams)
    let advertenciaCompatibilidad: string | undefined;
    if (prodData.categoria === "dashcam" || prodData.modelo === "JC450" || prodData.modelo === "JC181") {
      advertenciaCompatibilidad = "Requiere memoria microSD de alta velocidad para almacenamiento continuo.";
    }

    const snapItem: ItemSnapshot = {
      id: prodDoc.id,
      nombre: esPaquete ? prodData.nombre : prodData.nombreComercial,
      modelo: prodData.modelo || "",
      modeloConfirmado: prodData.modeloConfirmado === true,
      categoria: prodData.categoria || "paquete",
      fotoUrl: prodData.imagenes?.[0] || prodData.fotoUrl || "",
      queIncluye: prodData.queIncluye || prodData.caracteristicas || [],
      precioSinIvaCentavos: prodData.precioSinIvaCentavos,
      cantidad: itemReq.cantidad,
      esEquipoPrincipal: esPaquete ? true : (prodData.esEquipoPrincipal ?? true),
      incluyeInstalacion: prodData.incluyeInstalacion ?? true,
      incluyePlanPrimerAnio: prodData.incluyePlanPrimerAnio ?? true,
      advertenciaCompatibilidad,
    };

    itemsSnapshot.push(snapItem);
    itemsParaCalculo.push({
      id: snapItem.id,
      nombre: snapItem.nombre,
      precioSinIvaCentavos: snapItem.precioSinIvaCentavos,
      cantidad: snapItem.cantidad,
      esEquipoPrincipal: snapItem.esEquipoPrincipal,
      categoria: snapItem.categoria,
      activo: true,
      revisarPrecio: false,
      recurrentes: prodData.recurrentes,
      incluyeInstalacion: snapItem.incluyeInstalacion,
    });
  }

  // 4. Viáticos de Instalación
  let viaticosInput: ViaticosInput | undefined;
  let estadoNombre = "";
  let esSinCostoZona = false;

  if (input.instalacion?.estadoClave) {
    const estadoClave = input.instalacion.estadoClave;
    const municipio = input.instalacion.municipio || "";
    esSinCostoZona = esMunicipioSinCosto(estadoClave, municipio);

    const feeDoc = await adminDb.collection("travelFees").doc(estadoClave).get();
    estadoNombre = feeDoc.exists ? feeDoc.data()?.estadoNombre : estadoClave;

    if (esSinCostoZona) {
      viaticosInput = {
        estadoId: estadoClave,
        estadoNombre,
        sinCosto: true,
        montoPorVisitaCentavos: 0,
        montoPorUnidadCentavos: 0,
      };
    } else if (input.instalacion.viaticosManualCentavos !== undefined && input.instalacion.viaticosManualCentavos >= 0) {
      // Captura manual del vendedor para municipio foráneo
      viaticosInput = {
        estadoId: estadoClave,
        estadoNombre,
        sinCosto: false,
        montoPorVisitaCentavos: input.instalacion.viaticosManualCentavos,
        montoPorUnidadCentavos: 0,
      };
    } else {
      // Se cotiza por confirmar
      viaticosInput = {
        estadoId: estadoClave,
        estadoNombre,
        sinCosto: false,
        montoPorVisitaCentavos: 0,
        montoPorUnidadCentavos: 0,
      };
    }
  }

  // 5. Validar Descuento Adicional y Flujo de Autorización
  const descuentoSolicitado = input.condiciones.descuentoAdicionalPorcentaje || 0;
  let estadoInicial: QuoteStatus = "enviada";
  let solicitoExcesoDescuento = false;

  if (descuentoSolicitado > topeVendedor) {
    if (user.role === "admin") {
      // El administrador tiene autoridad plena
      estadoInicial = "enviada";
    } else {
      // El vendedor excede su tope -> Pasa a autorización
      estadoInicial = "pendiente_autorizacion";
      solicitoExcesoDescuento = true;
    }
  }

  // 6. Opciones y Motor de Cálculo
  const msiPlazos = pricingData?.msi ?? [];
  const opcionesCalculo: OpcionesCotizacion = {
    ivaPorcentaje: pricingData?.ivaPorcentaje ?? 16,
    descuentoVolumen: pricingData?.descuentoVolumen,
    descuentoVendedorPorcentaje: descuentoSolicitado,
    topeDescuentoVendedor: user.role === "admin" ? 100 : topeVendedor,
    planesConfig: {
      msiPlazos,
    },
  };

  const calculo = calcularCotizacion(itemsParaCalculo, viaticosInput, opcionesCalculo);

  // 7. Folio y Token
  const folio = await generarSiguienteFolio();
  const tokenPlano = generarTokenAleatorio();
  const tokenHash = hashToken(tokenPlano);

  const now = new Date().toISOString();
  const vigenciaDias = input.condiciones.vigenciaDias ?? pricingData?.vigenciaDias ?? 15;
  const venceDate = new Date();
  venceDate.setDate(venceDate.getDate() + vigenciaDias);
  const venceAt = venceDate.toISOString();

  // 8. Ensamble de la Cotización con Snapshot Inmutable
  const quote: Quote = {
    id: folio,
    folio,
    folioRaiz: folio,
    version: 1,
    esVersionActiva: true,
    tokenHash,
    token: tokenPlano,
    cliente: {
      id: cliente.id,
      nombre: cliente.nombre,
      telefono: cliente.whatsapp,
      whatsappDisplay: cliente.whatsappDisplay,
      correo: cliente.correo,
      empresa: cliente.empresa,
      rfc: cliente.rfc,
    },
    items: itemsSnapshot,
    instalacion: input.instalacion
      ? {
          estadoClave: input.instalacion.estadoClave,
          estadoNombre,
          municipio: input.instalacion.municipio,
          esSinCosto: esSinCostoZona,
          viaticosManualCentavos: input.instalacion.viaticosManualCentavos,
        }
      : undefined,
    condiciones: {
      planSeleccionado: input.condiciones.planSeleccionado,
      msiPlazoSeleccionado: input.condiciones.msiPlazoSeleccionado,
      descuentoAdicionalPorcentaje: descuentoSolicitado,
      solicitoExcesoDescuento,
      justificacionDescuento: input.condiciones.justificacionDescuento || "",
      vigenciaDias,
      fechaVencimiento: venceAt,
      notasCliente: input.condiciones.notasCliente || "",
      notasInternas: input.condiciones.notasInternas || "",
    },
    calculo,
    snapshotPrecios: {
      fecha: now,
      ivaPorcentaje: calculo.ivaPorcentaje,
      descuentoVolumenPorcentaje: calculo.porcentajeDescuentoVolumen,
      descuentoAdicionalPorcentaje: calculo.descuentoVendedorPorcentaje,
      viaticosCentavos: calculo.viaticosCentavos,
      totalCentavos: calculo.totalCentavos,
      items: itemsSnapshot,
    },
    origen: user.role === "admin" ? "admin" : "vendedor",
    vendedorId: user.uid,
    vendedorNombre: userData?.nombre || user.nombre || user.email.split("@")[0],
    vendedorEmail: user.email,
    vendedorWhatsapp: userData?.whatsapp || user.whatsapp || "7224322053",
    estado: estadoInicial,
    vecesVista: 0,
    createdAt: now,
    updatedAt: now,
    venceAt,
    urlPublica: `/c/${folio}?t=${tokenPlano}`,
  };

  // Guardar en Firestore (sin persistir token plano)
  const { token: _t, ...quoteToSave } = quote;
  await adminDb.collection("quotes").doc(folio).set(quoteToSave);

  // Incrementar contador en el cliente
  await adminDb
    .collection("customers")
    .doc(cliente.id)
    .update({
      totalCotizaciones: (cliente.totalCotizaciones || 0) + 1,
      updatedAt: now,
    });

  // Notificar al admin si quedó pendiente de autorización
  if (estadoInicial === "pendiente_autorizacion") {
    await recordAuditLog({
      userId: user.uid,
      userEmail: user.email,
      entity: "quote",
      entityId: folio,
      action: "create",
      before: null,
      after: quoteToSave,
      metadata: {
        pendienteAutorizacion: true,
        descuentoSolicitado,
        topeVendedor,
        justificacion: input.condiciones.justificacionDescuento,
      },
    });

    // Encolar aviso al administrador
    await adminDb.collection("emailQueue").add({
      tipo: "alerta_autorizacion_cotizacion",
      destinatario: "admin@cosoavl.com",
      asunto: `[Autorización Requerida] Cotización ${folio} con ${descuentoSolicitado}% de descuento`,
      datos: {
        folio,
        vendedorNombre: quote.vendedorNombre,
        clienteNombre: cliente.nombre,
        total: formatMxn(calculo.totalCentavos),
        descuentoSolicitado,
        justificacion: input.condiciones.justificacionDescuento,
      },
      estado: "pendiente",
      createdAt: now,
    });
  }

  return quote;
}

/**
 * Crea una nueva versión (-v2, -v3...) de una cotización existente.
 * Valida que la cotización NO tenga pagos registrados (pagada_parcial o pagada).
 */
export async function crearNuevaVersionCotizacion(
  folioAnterior: string,
  input: CrearCotizacionVendedorInput,
  user: ServiceUser
): Promise<Quote> {
  const anteriorDoc = await adminDb.collection("quotes").doc(folioAnterior).get();
  if (!anteriorDoc.exists) {
    throw new Error(`La cotización '${folioAnterior}' no existe.`);
  }

  const anterior = anteriorDoc.data() as Quote;

  // REGLA FASE 4: No se puede editar ni crear versión de una cotización con pagos registrados
  if (anterior.estado === "pagada" || anterior.estado === "pagada_parcial") {
    throw new Error(
      "Esta cotización ya cuenta con pagos registrados y no puede ser modificada. Genera una cotización nueva."
    );
  }

  if (user.role === "vendedor" && anterior.vendedorId !== user.uid) {
    throw new Error("No tienes permiso para modificar esta cotización.");
  }

  const nuevaVersionNumero = (anterior.version || 1) + 1;
  const nuevoFolio = `${anterior.folioRaiz}-v${nuevaVersionNumero}`;

  // Creamos la nueva versión conservando el folio raíz
  const nuevaQuote = await crearCotizacionVendedor(input, user);

  // Ajustamos el folio a la versión
  const tokenPlano = generarTokenAleatorio();
  const tokenHash = hashToken(tokenPlano);
  const now = new Date().toISOString();

  const versionQuote: Quote = {
    ...nuevaQuote,
    id: nuevoFolio,
    folio: nuevoFolio,
    folioRaiz: anterior.folioRaiz,
    version: nuevaVersionNumero,
    esVersionActiva: true,
    tokenHash,
    token: tokenPlano,
    urlPublica: `/c/${nuevoFolio}?t=${tokenPlano}`,
    updatedAt: now,
  };

  const { token: _t, ...toSave } = versionQuote;
  await adminDb.collection("quotes").doc(nuevoFolio).set(toSave);

  // Marcar versión anterior como inactiva apuntando a la nueva
  await adminDb.collection("quotes").doc(folioAnterior).update({
    esVersionActiva: false,
    versionMasRecienteFolio: nuevoFolio,
    updatedAt: now,
  });

  return versionQuote;
}

/**
 * Registra la visualización del cliente en la cotización (PRIVACIDAD: SIN IP NI USER AGENT).
 */
export async function registrarAperturaCotizacion(folio: string): Promise<void> {
  if (!(await isFirestoreReady())) return;

  const docRef = adminDb.collection("quotes").doc(folio);
  const snap = await docRef.get();
  if (!snap.exists) return;

  const q = snap.data() as Quote;
  const now = new Date().toISOString();

  const updates: Partial<Quote> = {
    vecesVista: (q.vecesVista || 0) + 1,
    fechaUltimaVista: now,
    ...(!q.fechaPrimeraVista && { fechaPrimeraVista: now }),
  };

  // Si estaba en 'enviada', avanza a 'vista'
  if (q.estado === "enviada") {
    updates.estado = "vista";
  }

  await docRef.update(updates);
}

/**
 * Autorización de Descuento por el Administrador.
 */
export async function autorizarDescuentoCotizacion(
  folio: string,
  accion: "aprobar" | "rechazar",
  adminUser: ServiceUser,
  motivo?: string
): Promise<Quote> {
  if (adminUser.role !== "admin") {
    throw new Error("Solo los administradores pueden autorizar o rechazar descuentos.");
  }

  const docRef = adminDb.collection("quotes").doc(folio);
  const snap = await docRef.get();
  if (!snap.exists) throw new Error("Cotización no encontrada.");

  const quote = snap.data() as Quote;
  if (quote.estado !== "pendiente_autorizacion") {
    throw new Error("Esta cotización no se encuentra pendiente de autorización.");
  }

  const now = new Date().toISOString();
  let nuevoEstado: QuoteStatus = accion === "aprobar" ? "enviada" : "borrador";

  const patch: Partial<Quote> = {
    estado: nuevoEstado,
    condiciones: {
      planSeleccionado: quote.condiciones?.planSeleccionado || "contado",
      descuentoAdicionalPorcentaje: quote.condiciones?.descuentoAdicionalPorcentaje || 0,
      vigenciaDias: quote.condiciones?.vigenciaDias || 15,
      fechaVencimiento: quote.condiciones?.fechaVencimiento || now,
      ...quote.condiciones,
      solicitoExcesoDescuento: false,
      aprobadoPorAdminId: adminUser.uid,
      aprobadoPorAdminEmail: adminUser.email,
      aprobadoFecha: now,
      motivoRechazo: accion === "rechazar" ? motivo || "Descuento no autorizado por administración." : undefined,
    },
    updatedAt: now,
  };

  await docRef.set(patch, { merge: true });
  const updated: Quote = { ...quote, ...patch } as Quote;

  await recordAuditLog({
    userId: adminUser.uid,
    userEmail: adminUser.email,
    entity: "quote",
    entityId: folio,
    action: accion === "aprobar" ? "approve" : "reject",
    before: quote,
    after: updated,
    metadata: { motivo },
  });

  // Notificar al vendedor por correo
  if (quote.vendedorEmail) {
    await adminDb.collection("emailQueue").add({
      tipo: "resolucion_autorizacion_cotizacion",
      destinatario: quote.vendedorEmail,
      asunto: `Cotización ${folio}: ${accion === "aprobar" ? "Descuento Aprobado" : "Descuento Rechazado"}`,
      datos: {
        folio,
        accion,
        motivo: motivo || (accion === "aprobar" ? "Aprobado" : "Rechazado"),
        adminEmail: adminUser.email,
      },
      estado: "pendiente",
      createdAt: now,
    });
  }

  return updated;
}
