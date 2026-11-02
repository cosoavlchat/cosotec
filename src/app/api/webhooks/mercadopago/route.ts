import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import {
  validarFirmaWebhook,
  obtenerOrdenMercadoPago,
  obtenerPagoMercadoPago,
  getMercadoPagoWebhookSecret,
} from "@/lib/mercadopago";
import { Order, OrderPagoProgramado } from "@/types/order";
import { notificarFichaInstalacionASoporte } from "@/lib/services/email-service";

export async function POST(req: NextRequest) {
  try {
    const signatureHeader = req.headers.get("x-signature");
    const requestIdHeader = req.headers.get("x-request-id");

    const json = await req.json().catch(() => ({}));
    const searchParams = req.nextUrl.searchParams;

    // Extraer identificador del recurso desde body o query params
    const dataId =
      json?.data?.id ||
      json?.id ||
      searchParams.get("data.id") ||
      searchParams.get("id");

    const topic =
      json?.type ||
      json?.topic ||
      searchParams.get("type") ||
      searchParams.get("topic");

    const action = json?.action;

    if (!dataId) {
      // Notificación de prueba o ping vacío de Mercado Pago
      return NextResponse.json({ received: true, note: "Sin data.id" }, { status: 200 });
    }

    // 1. Validar si el secreto es el temporal de primer despliegue o está ausente
    const secret = getMercadoPagoWebhookSecret();
    if (!secret || secret === "temporal-pendiente") {
      console.warn(
        `[Webhook MP] Alerta: MP_WEBHOOK_SECRET tiene el valor 'temporal-pendiente' o no está configurado. Rechazando con 503.`
      );
      await adminDb.collection("auditLog").add({
        tipo: "mercadopago_webhook_secreto_temporal",
        dataId: String(dataId),
        mensaje:
          "Notificación recibida mientras MP_WEBHOOK_SECRET tiene el valor 'temporal-pendiente'. Registre la URL en Mercado Pago Developers para obtener el secreto definitivo.",
        fecha: new Date().toISOString(),
      });
      return NextResponse.json(
        {
          error: "Webhook temporalmente no disponible: MP_WEBHOOK_SECRET pendiente de configuración definitiva.",
          code: "WEBHOOK_SECRET_PENDING",
        },
        { status: 503 }
      );
    }

    // 2. Validar firma criptográfica x-signature
    const isValid = validarFirmaWebhook(signatureHeader, requestIdHeader, String(dataId), secret);
    if (!isValid) {
      console.warn(`[Webhook MP] Firma inválida rechazada para recurso: ${dataId}`);
      return NextResponse.json({ error: "Firma de webhook inválida" }, { status: 401 });
    }

    // 3. Determinar si el recurso es una Orden (Orders API) o un Pago (Payments API)
    const isOrder =
      topic === "orders" ||
      topic === "order" ||
      (typeof action === "string" && action.startsWith("order.")) ||
      String(dataId).startsWith("ORD");

    let externalReference: string | undefined;
    let montoCentavosCobrado: number = 0;
    let statusMp: string = "";
    let statusDetail: string = "";
    let paymentMethodDetail: string = "mercadopago";
    let mpResourceId: string = String(dataId);
    let isApproved = false;
    let isRejected = false;
    let subPaymentId: string | undefined;

    if (isOrder) {
      // Consulta a la API de Orders (/v1/orders/{id})
      const orderMp = await obtenerOrdenMercadoPago(String(dataId));
      externalReference = orderMp.external_reference;
      const totalPesos =
        typeof orderMp.total_amount === "string"
          ? parseFloat(orderMp.total_amount)
          : Number(orderMp.total_amount);
      montoCentavosCobrado = Math.round(totalPesos * 100);
      statusMp = orderMp.status;
      statusDetail = orderMp.status_detail || "";
      mpResourceId = orderMp.id;

      const firstPayment = orderMp.transactions?.payments?.[0];
      if (firstPayment) {
        subPaymentId = String(firstPayment.id);
        paymentMethodDetail = firstPayment.payment_method?.id || firstPayment.payment_method?.type || "tarjeta";
      }

      // En Orders API, status "processed" indica orden totalmente pagada
      isApproved =
        statusMp === "processed" ||
        Boolean(orderMp.transactions?.payments?.some((p) => p.status === "processed" || p.status === "approved"));

      isRejected =
        statusMp === "canceled" ||
        statusMp === "failed" ||
        Boolean(orderMp.transactions?.payments?.some((p) => p.status === "rejected" || p.status === "cancelled"));
    } else {
      // Respaldo para eventos directos de tipo 'payment'
      const payment = await obtenerPagoMercadoPago(dataId);
      externalReference = payment.external_reference;
      montoCentavosCobrado = Math.round(payment.transaction_amount * 100);
      statusMp = payment.status;
      statusDetail = payment.status_detail || "";
      paymentMethodDetail = payment.payment_method_id || "mercadopago";
      mpResourceId = String(payment.id);
      subPaymentId = String(payment.id);

      isApproved = payment.status === "approved";
      isRejected = payment.status === "rejected" || payment.status === "cancelled";
    }

    if (!externalReference) {
      console.warn(`[Webhook MP] Recurso ${mpResourceId} no incluye external_reference.`);
      await adminDb.collection("auditLog").add({
        tipo: "mercadopago_sin_external_reference",
        resourceId: mpResourceId,
        isOrder,
        status: statusMp,
        montoCentavos: montoCentavosCobrado,
        fecha: new Date().toISOString(),
      });
      return NextResponse.json({ received: true, note: "Sin external_reference" }, { status: 200 });
    }

    // 4. Descomponer external_reference granular (ej: "CT-1124451-P1", o compatibilidad legacy "CT-1124451:P1")
    let orderFolio = externalReference;
    let targetPagoId = "P1";

    if (externalReference.includes(":")) {
      const [f, p] = externalReference.split(":");
      orderFolio = f;
      targetPagoId = p || "P1";
    } else {
      const match = externalReference.match(/^(CT-[A-Za-z0-9]+)-(P\d+)$/i);
      if (match) {
        orderFolio = match[1];
        targetPagoId = match[2].toUpperCase();
      }
    }

    let orderRef = adminDb.collection("orders").doc(orderFolio);
    let orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      // Búsqueda por campo folio si el ID del documento es distinto
      const q = await adminDb
        .collection("orders")
        .where("folio", "==", orderFolio)
        .limit(1)
        .get();

      if (!q.empty) {
        orderRef = q.docs[0].ref;
        orderSnap = q.docs[0];
      }
    }

    if (!orderSnap.exists) {
      console.warn(`[Webhook MP] No se encontró orden para folio: ${orderFolio} (ref: ${externalReference})`);
      await adminDb.collection("auditLog").add({
        tipo: "mercadopago_orden_no_encontrada",
        externalReference,
        folio: orderFolio,
        resourceId: mpResourceId,
        montoCentavos: montoCentavosCobrado,
        fecha: new Date().toISOString(),
      });
      return NextResponse.json({ received: true, note: "Orden no encontrada" }, { status: 200 });
    }

    const orderData = orderSnap.data() as Order;
    const nowIso = new Date().toISOString();

    // 5. Ubicar el pago específico dentro del calendario de exhibiciones
    const pagosList: OrderPagoProgramado[] = orderData.pagos || [];
    const pagoIndex = pagosList.findIndex((p) => p.id === targetPagoId);
    const pago = pagoIndex >= 0 ? pagosList[pagoIndex] : undefined;

    const montoEsperadoCentavos = pago
      ? pago.montoCentavos
      : orderData.montoPrimerPagoCentavos || orderData.totalCentavos;

    // 6. Idempotencia: Verificar si esta exhibición ya fue aprobada y acreditada
    if (
      pago &&
      pago.estado === "aprobado" &&
      (pago.paymentId === mpResourceId || pago.orderMpId === mpResourceId || (subPaymentId && pago.paymentId === subPaymentId))
    ) {
      return NextResponse.json(
        { received: true, note: `Pago ${targetPagoId} ya procesado previamente (idempotente)` },
        { status: 200 }
      );
    }

    // 7. Verificación de monto exacto (Tolerancia Cero en centavos enteros)
    if (montoCentavosCobrado !== montoEsperadoCentavos) {
      console.error(
        `[Webhook MP] ALERTA: Discrepancia de monto en orden ${orderData.folio} (${targetPagoId}). Esperado: ${montoEsperadoCentavos} centavos, Cobrado: ${montoCentavosCobrado} centavos`
      );

      await orderRef.update({
        estado: "revision_manual",
        motivoRevision: "monto_discrepante",
        mercadoPagoOrderId: isOrder ? mpResourceId : orderData.mercadoPagoOrderId,
        mercadoPagoPaymentId: subPaymentId || orderData.mercadoPagoPaymentId,
        metodoPagoDetalle: paymentMethodDetail,
        notas: `Monto cobrado en MP (${montoCentavosCobrado} centavos) difiere del monto exacto de la exhibición ${targetPagoId} (${montoEsperadoCentavos} centavos). Tolerancia 0.`,
        updatedAt: nowIso,
      });

      await adminDb.collection("auditLog").add({
        tipo: "mercadopago_revision_manual",
        folio: orderData.folio,
        pagoId: targetPagoId,
        motivo: "monto_discrepante",
        montoEsperadoCentavos,
        montoCobradoCentavos: montoCentavosCobrado,
        resourceId: mpResourceId,
        fecha: nowIso,
      });

      return NextResponse.json({ received: true, estado: "revision_manual" }, { status: 200 });
    }

    // 8. Transiciones de estado según veredicto de Mercado Pago
    const updatedPagos = [...pagosList];

    if (isApproved) {
      if (pagoIndex >= 0) {
        updatedPagos[pagoIndex] = {
          ...updatedPagos[pagoIndex],
          estado: "aprobado",
          paymentId: subPaymentId || mpResourceId,
          orderMpId: isOrder ? mpResourceId : updatedPagos[pagoIndex].orderMpId,
          pagadoAt: nowIso,
        };
      }

      // Evaluar estado general de la orden
      const todosAprobados =
        updatedPagos.length > 0
          ? updatedPagos.every((p) => p.estado === "aprobado")
          : true;

      const nuevoEstado: Order["estado"] = todosAprobados ? "pagado" : "anticipo_pagado";

      await orderRef.update({
        estado: nuevoEstado,
        pagos: updatedPagos,
        mercadoPagoOrderId: isOrder ? mpResourceId : orderData.mercadoPagoOrderId,
        mercadoPagoPaymentId: subPaymentId || orderData.mercadoPagoPaymentId,
        metodoPagoDetalle: paymentMethodDetail,
        pagadoAt: nowIso,
        updatedAt: nowIso,
      });

      // Si existe carrito vinculado, transicionar a "convertido"
      if (orderData.cartId) {
        await adminDb.collection("carts").doc(orderData.cartId).update({
          estado: "convertido",
          updatedAt: nowIso,
        }).catch(() => {});
      }

      // Registrar o actualizar instalación técnica en 'installations' si es el pago inicial
      if (targetPagoId === "P1") {
        const installationId = `ins_${orderData.folio}`;
        await adminDb.collection("installations").doc(installationId).set(
          {
            id: installationId,
            folio: orderData.folio,
            orderId: orderData.id,
            estado: "pendiente_asignacion",
            cliente: {
              nombre: orderData.contacto?.nombre || "Cliente CoSoTec",
              telefono: orderData.contacto?.telefono || "",
              correo: orderData.contacto?.correo || "",
            },
            instalacion: orderData.instalacion,
            unidades: orderData.unidades || [],
            totalEquipos: (orderData.items || [])
              .filter((i) => i.esEquipoPrincipal)
              .reduce((acc, curr) => acc + curr.cantidad, 0),
            createdAt: nowIso,
            updatedAt: nowIso,
          },
          { merge: true }
        );

        // Notificar ficha técnica completa a soporte
        await notificarFichaInstalacionASoporte(orderData).catch((err) =>
          console.error("[Webhook MP] Error notificando ficha a soporte:", err)
        );
      }

      // Bitácora de auditoría
      await adminDb.collection("auditLog").add({
        tipo: isOrder ? "mercadopago_orden_procesada" : "mercadopago_pago_aprobado",
        folio: orderData.folio,
        pagoId: targetPagoId,
        resourceId: mpResourceId,
        montoCentavos: montoCentavosCobrado,
        nuevoEstado,
        fecha: nowIso,
      });

      return NextResponse.json({
        received: true,
        estado: nuevoEstado,
        pagoId: targetPagoId,
        resourceId: mpResourceId,
      });
    }

    if (isRejected) {
      if (pagoIndex >= 0) {
        updatedPagos[pagoIndex] = {
          ...updatedPagos[pagoIndex],
          estado: "rechazado",
          paymentId: subPaymentId || mpResourceId,
          orderMpId: isOrder ? mpResourceId : updatedPagos[pagoIndex].orderMpId,
        };
      }

      await orderRef.update({
        estado: "pago_rechazado",
        pagos: updatedPagos,
        mercadoPagoOrderId: isOrder ? mpResourceId : orderData.mercadoPagoOrderId,
        mercadoPagoPaymentId: subPaymentId || orderData.mercadoPagoPaymentId,
        motivoRechazo: statusDetail || statusMp,
        updatedAt: nowIso,
      });

      return NextResponse.json({ received: true, estado: "pago_rechazado", pagoId: targetPagoId });
    }

    // Otros estados intermedios como 'created' o 'action_required'
    return NextResponse.json({ received: true, status: statusMp, pagoId: targetPagoId });
  } catch (error: any) {
    console.error("[Webhook Mercado Pago] Error crítico:", error);
    return NextResponse.json(
      { error: "Error interno al procesar webhook", message: error.message },
      { status: 500 }
    );
  }
}
