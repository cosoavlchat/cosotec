import { adminDb } from "@/lib/firebase/admin";
import { Order, OrderEstado, OrderPagoProgramado } from "@/types/order";
import { crearPreferenciaMercadoPago } from "@/lib/mercadopago";
import { generarTokenAleatorio, hashToken } from "@/lib/quotes";
import {
  notificarFichaInstalacionASoporte,
  notificarResultadoSpeiCliente,
  notificarCobroDiferidoCliente,
} from "@/lib/services/email-service";

export interface GenerarLinkPagoResultado {
  pagoId: string;
  externalReference: string;
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string;
  linkPublico: string;
}

/**
 * Genera la preferencia de Mercado Pago y el link de cobro seguro para una exhibición
 * específica del calendario (ej: P2 Finiquito o P3 Mensualidad).
 */
export async function generarLinkPagoExhibicion(
  orderFolio: string,
  pagoId: string,
  origin: string = "http://localhost:3000"
): Promise<GenerarLinkPagoResultado> {
  const orderRef = adminDb.collection("orders").doc(orderFolio);
  const snap = await orderRef.get();

  if (!snap.exists) {
    throw new Error(`Orden ${orderFolio} no encontrada en Firestore.`);
  }

  const order = snap.data() as Order;
  const pagos = order.pagos || [];
  const pagoIndex = pagos.findIndex((p) => p.id === pagoId);

  if (pagoIndex === -1) {
    throw new Error(`Exhibición ${pagoId} no existe en la orden ${orderFolio}.`);
  }

  const pago = pagos[pagoIndex];
  if (pago.estado === "aprobado") {
    throw new Error(`La exhibición ${pagoId} de la orden ${orderFolio} ya está pagada.`);
  }

  // Generar o reusar token para el link
  const token = generarTokenAleatorio();
  const tokenHash = hashToken(token);

  const montoPesos = pago.montoCentavos / 100;
  const externalReference = `${orderFolio}:${pagoId}`;

  const mpPreference = await crearPreferenciaMercadoPago({
    folio: orderFolio,
    externalReference,
    token,
    items: [
      {
        id: externalReference,
        title: `Pedido ${orderFolio} - ${pago.concepto}`,
        quantity: 1,
        unit_price: montoPesos,
      },
    ],
    payerEmail: order.contacto?.correo || "cliente@cosotec.com",
    backUrlBase: origin,
  });

  // Actualizar orden con token y preferenceId de la cuota
  const updatedPagos = [...pagos];
  updatedPagos[pagoIndex] = {
    ...updatedPagos[pagoIndex],
    preferenceId: mpPreference.id,
  };

  await orderRef.update({
    tokenHash,
    pagos: updatedPagos,
    updatedAt: new Date().toISOString(),
  });

  const linkPublico = `${origin}/pedido/${orderFolio}?t=${token}&pago=${pagoId}`;

  // Enviar notificación de cobro diferido por correo al cliente
  await notificarCobroDiferidoCliente(order, pago, token, linkPublico, origin).catch((err) =>
    console.error("[generarLinkPagoExhibicion] Error notificando cobro diferido:", err)
  );

  return {
    pagoId,
    externalReference,
    preferenceId: mpPreference.id,
    initPoint: mpPreference.initPoint,
    sandboxInitPoint: mpPreference.sandboxInitPoint,
    linkPublico,
  };
}

/**
 * Se ejecuta cuando soporte técnico concluye la instalación física de una unidad o pedido.
 * Activa automáticamente el cobro de la cuota subsecuente:
 * - Credi-contado: Genera y emite el link del finiquito (P2).
 * - Enganche: Programa la mensualidad 1 (+30 días) y mensualidad 2 (+60 días) desde la fecha técnica.
 */
export async function procesarInstalacionCompletada(
  folio: string,
  fechaInstalacionIso?: string,
  origin: string = "http://localhost:3000"
) {
  const orderRef = adminDb.collection("orders").doc(folio);
  const snap = await orderRef.get();

  if (!snap.exists) {
    console.warn(`[procesarInstalacionCompletada] Orden ${folio} no encontrada.`);
    return null;
  }

  const order = snap.data() as Order;
  const fechaBase = fechaInstalacionIso ? new Date(fechaInstalacionIso) : new Date();
  const nowIso = new Date().toISOString();

  const updatedPagos: OrderPagoProgramado[] = [...(order.pagos || [])];
  let linkP2Generado: GenerarLinkPagoResultado | null = null;

  if (order.planPago === "credi_contado") {
    // Credi-contado: P2 (Finiquito al instalar) se vuelve exigible inmediatamente
    const p2Index = updatedPagos.findIndex((p) => p.id === "P2");
    if (p2Index >= 0 && updatedPagos[p2Index].estado === "pendiente") {
      updatedPagos[p2Index].fechaProgramada = nowIso;
      await orderRef.update({ pagos: updatedPagos });
      linkP2Generado = await generarLinkPagoExhibicion(folio, "P2", origin);
    }
  } else if (order.planPago === "enganche_mensualidades") {
    // Enganche: P2 a +30 días, P3 a +60 días
    const p2Index = updatedPagos.findIndex((p) => p.id === "P2");
    if (p2Index >= 0 && updatedPagos[p2Index].estado === "pendiente") {
      const fechaP2 = new Date(fechaBase.getTime() + 30 * 24 * 3600 * 1000);
      updatedPagos[p2Index].fechaProgramada = fechaP2.toISOString();
    }

    const p3Index = updatedPagos.findIndex((p) => p.id === "P3");
    if (p3Index >= 0 && updatedPagos[p3Index].estado === "pendiente") {
      const fechaP3 = new Date(fechaBase.getTime() + 60 * 24 * 3600 * 1000);
      updatedPagos[p3Index].fechaProgramada = fechaP3.toISOString();
    }

    await orderRef.update({
      pagos: updatedPagos,
      updatedAt: nowIso,
    });
  }

  await adminDb.collection("auditLog").add({
    tipo: "instalacion_concluida_activacion_cobros",
    folio,
    planPago: order.planPago,
    fechaInstalacion: fechaBase.toISOString(),
    linkFiniquitoGenerado: Boolean(linkP2Generado),
    fecha: nowIso,
  });

  return {
    folio,
    planPago: order.planPago,
    linkP2Generado,
    pagos: updatedPagos,
  };
}

/**
 * Worker / Cron que busca órdenes con pagos programados vencidos hoy y genera las notificaciones.
 */
export async function verificarCobrosProgramadosVencidos(origin: string = "http://localhost:3000") {
  const nowIso = new Date().toISOString();
  const snapshot = await adminDb
    .collection("orders")
    .where("estado", "==", "anticipo_pagado")
    .get();

  const vencidosProcesados: Array<{ folio: string; pagoId: string; link: string }> = [];

  for (const doc of snapshot.docs) {
    const order = doc.data() as Order;
    const pagos = order.pagos || [];

    for (const pago of pagos) {
      if (
        pago.estado === "pendiente" &&
        pago.fechaProgramada &&
        pago.fechaProgramada <= nowIso
      ) {
        // Generar link y registrar notificación
        const linkRes = await generarLinkPagoExhibicion(order.folio, pago.id, origin);
        vencidosProcesados.push({
          folio: order.folio,
          pagoId: pago.id,
          link: linkRes.linkPublico,
        });
      }
    }
  }

  return {
    total: vencidosProcesados.length,
    vencidosProcesados,
  };
}

/**
 * Aprueba una transferencia SPEI validada manualmente por el administrador.
 * 1. Transiciona la orden a "pagado" o "anticipo_pagado" (según plan de pago).
 * 2. Marca la cuota P1 (o todas si es de contado) como "aprobado".
 * 3. Registra auditoría con el correo del administrador.
 * 4. Crea o actualiza la ficha técnica en 'installations' con estado 'pendiente_asignacion'.
 * 5. Si existe un carrito vinculado, lo marca como 'convertido'.
 */
export async function aprobarPagoSpei(
  folio: string,
  adminEmail: string,
  notasAdmin?: string
) {
  const orderRef = adminDb.collection("orders").doc(folio);
  const snap = await orderRef.get();

  if (!snap.exists) {
    throw new Error(`Orden ${folio} no encontrada.`);
  }

  const order = snap.data() as Order;

  if (order.estado === "pagado") {
    throw new Error(`La orden ${folio} ya se encuentra liquidada.`);
  }

  const nowIso = new Date().toISOString();
  const pagosList = [...(order.pagos || [])];

  // Marcar P1 (o todas si es pago de contado)
  const isContado = order.planPago === "contado" || pagosList.length <= 1;
  const updatedPagos: OrderPagoProgramado[] = pagosList.map((p, idx) => {
    if (idx === 0 || isContado) {
      return {
        ...p,
        estado: "aprobado",
        pagadoAt: nowIso,
      };
    }
    return p;
  });

  const todosAprobados = updatedPagos.every((p) => p.estado === "aprobado");
  const nuevoEstado: OrderEstado = todosAprobados ? "pagado" : "anticipo_pagado";

  const updatedComprobante = order.comprobanteSpei
    ? {
        ...order.comprobanteSpei,
        validadoAt: nowIso,
        validadoPor: adminEmail,
        notasAdmin: notasAdmin || undefined,
        motivoRechazo: undefined,
      }
    : undefined;

  await orderRef.update({
    estado: nuevoEstado,
    pagos: updatedPagos,
    ...(updatedComprobante ? { comprobanteSpei: updatedComprobante } : {}),
    pagadoAt: nowIso,
    updatedAt: nowIso,
  });

  // Convertir carrito si existe
  if (order.cartId) {
    await adminDb.collection("carts").doc(order.cartId).update({
      estado: "convertido",
      updatedAt: nowIso,
    }).catch(() => {});
  }

  // Crear/actualizar ficha técnica en 'installations'
  const installationId = `ins_${order.folio}`;
  await adminDb.collection("installations").doc(installationId).set(
    {
      id: installationId,
      folio: order.folio,
      orderId: order.id,
      estado: "pendiente_asignacion",
      cliente: {
        nombre: order.contacto?.nombre || "Cliente CoSoTec",
        telefono: order.contacto?.telefono || "",
        correo: order.contacto?.correo || "",
      },
      instalacion: order.instalacion,
      unidades: order.unidades || [],
      totalEquipos: (order.items || [])
        .filter((i) => i.esEquipoPrincipal)
        .reduce((acc, curr) => acc + curr.cantidad, 0),
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    { merge: true }
  );

  // Registrar en auditLog
  await adminDb.collection("auditLog").add({
    tipo: "spei_pago_aprobado_admin",
    folio: order.folio,
    adminEmail,
    nuevoEstado,
    totalCentavos: order.totalCentavos,
    notasAdmin: notasAdmin || null,
    fecha: nowIso,
  });

  // Generar token seguro y emitir notificaciones por correo
  const clientToken = generarTokenAleatorio();
  const clientTokenHash = hashToken(clientToken);
  await orderRef.update({ tokenHash: clientTokenHash });

  await notificarFichaInstalacionASoporte(order).catch((err) =>
    console.error("[aprobarPagoSpei] Error notificando ficha a soporte:", err)
  );

  await notificarResultadoSpeiCliente(order, clientToken, "aprobado").catch((err) =>
    console.error("[aprobarPagoSpei] Error notificando acreditación SPEI a cliente:", err)
  );

  return {
    folio: order.folio,
    estado: nuevoEstado,
    pagos: updatedPagos,
  };
}

/**
 * Rechaza un comprobante SPEI con un motivo específico.
 * Permite al cliente subir un nuevo comprobante corregido.
 */
export async function rechazarComprobanteSpei(
  folio: string,
  motivoRechazo: string,
  adminEmail: string
) {
  if (!motivoRechazo || motivoRechazo.trim().length === 0) {
    throw new Error("Se requiere especificar el motivo del rechazo del comprobante.");
  }

  const orderRef = adminDb.collection("orders").doc(folio);
  const snap = await orderRef.get();

  if (!snap.exists) {
    throw new Error(`Orden ${folio} no encontrada.`);
  }

  const order = snap.data() as Order;
  const nowIso = new Date().toISOString();

  const updatedComprobante = order.comprobanteSpei
    ? {
        ...order.comprobanteSpei,
        validadoAt: nowIso,
        validadoPor: adminEmail,
        motivoRechazo: motivoRechazo.trim(),
      }
    : {
        url: "",
        fileName: "",
        mimeType: "",
        sizeBytes: 0,
        subidoAt: nowIso,
        validadoAt: nowIso,
        validadoPor: adminEmail,
        motivoRechazo: motivoRechazo.trim(),
      };

  await orderRef.update({
    estado: "comprobante_rechazado",
    comprobanteSpei: updatedComprobante,
    updatedAt: nowIso,
  });

  await adminDb.collection("auditLog").add({
    tipo: "spei_comprobante_rechazado_admin",
    folio: order.folio,
    adminEmail,
    motivoRechazo: motivoRechazo.trim(),
    fecha: nowIso,
  });

  // Generar token seguro y notificar al cliente del rechazo con el motivo
  const clientToken = generarTokenAleatorio();
  const clientTokenHash = hashToken(clientToken);
  await orderRef.update({ tokenHash: clientTokenHash });

  await notificarResultadoSpeiCliente(order, clientToken, "rechazado", motivoRechazo.trim()).catch((err) =>
    console.error("[rechazarComprobanteSpei] Error notificando rechazo SPEI a cliente:", err)
  );

  return {
    folio: order.folio,
    estado: "comprobante_rechazado",
    motivoRechazo: motivoRechazo.trim(),
  };
}

