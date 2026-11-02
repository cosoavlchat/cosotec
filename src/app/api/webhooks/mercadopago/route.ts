import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import {
  validarFirmaWebhook,
  obtenerPagoMercadoPago,
  getMercadoPagoWebhookSecret,
} from "@/lib/mercadopago";
import { Order, OrderPagoProgramado } from "@/types/order";

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

    const type = json?.type || json?.topic || searchParams.get("topic");

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
      console.warn(`[Webhook MP] Firma inválida rechazada para paymentId: ${dataId}`);
      return NextResponse.json({ error: "Firma de webhook inválida" }, { status: 401 });
    }

    // Solo procesamos eventos de tipo 'payment'
    if (type && type !== "payment") {
      return NextResponse.json({ received: true, note: `Evento ignorado: ${type}` }, { status: 200 });
    }

    // 2. Consultar directamente a la API de Mercado Pago (/v1/payments/{id})
    const payment = await obtenerPagoMercadoPago(dataId);
    const externalReference = payment.external_reference;

    if (!externalReference) {
      console.warn(`[Webhook MP] Pago ${payment.id} no incluye external_reference.`);
      await adminDb.collection("auditLog").add({
        tipo: "mercadopago_sin_external_reference",
        paymentId: payment.id,
        status: payment.status,
        monto: payment.transaction_amount,
        fecha: new Date().toISOString(),
      });
      return NextResponse.json({ received: true, note: "Sin external_reference" }, { status: 200 });
    }

    // 3. Descomponer external_reference granular (ej: "CT-1124451:P1", "CT-1124451:P2", etc.)
    const [orderFolio, pagoIdRaw] = externalReference.split(":");
    const targetPagoId = pagoIdRaw || "P1";

    let orderRef = adminDb.collection("orders").doc(orderFolio);
    let orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      // Búsqueda por campo folio
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
        paymentId: payment.id,
        monto: payment.transaction_amount,
        fecha: new Date().toISOString(),
      });
      return NextResponse.json({ received: true, note: "Orden no encontrada" }, { status: 200 });
    }

    const orderData = orderSnap.data() as Order;
    const nowIso = new Date().toISOString();

    // 4. Ubicar el pago específico dentro del calendario de exhibiciones
    const pagosList: OrderPagoProgramado[] = orderData.pagos || [];
    const pagoIndex = pagosList.findIndex((p) => p.id === targetPagoId);
    const pago = pagoIndex >= 0 ? pagosList[pagoIndex] : undefined;

    const montoEsperadoCentavos = pago
      ? pago.montoCentavos
      : orderData.montoPrimerPagoCentavos || orderData.totalCentavos;

    // 5. Idempotencia: Verificar si esta exhibición ya fue aprobada y acreditada
    if (
      pago &&
      pago.estado === "aprobado" &&
      pago.paymentId === String(payment.id)
    ) {
      return NextResponse.json(
        { received: true, note: `Pago ${targetPagoId} ya procesado previamente (idempotente)` },
        { status: 200 }
      );
    }

    // 6. Verificación de monto exacto (Tolerancia 0 en centavos enteros)
    const transactionAmountCentavos = Math.round(payment.transaction_amount * 100);

    if (transactionAmountCentavos !== montoEsperadoCentavos) {
      // Discrepancia estricta: tolerancia 0
      console.error(
        `[Webhook MP] ALERTA: Discrepancia de monto en orden ${orderData.folio} (${targetPagoId}). Esperado: ${montoEsperadoCentavos} centavos, Cobrado: ${transactionAmountCentavos} centavos`
      );

      await orderRef.update({
        estado: "revision_manual",
        motivoRevision: "monto_discrepante",
        mercadoPagoPaymentId: String(payment.id),
        metodoPagoDetalle: payment.payment_method_id || "desconocido",
        notas: `Monto cobrado en MP (${transactionAmountCentavos} centavos) difiere del monto exacto de la exhibición ${targetPagoId} (${montoEsperadoCentavos} centavos). Tolerancia 0.`,
        updatedAt: nowIso,
      });

      await adminDb.collection("auditLog").add({
        tipo: "mercadopago_revision_manual",
        folio: orderData.folio,
        pagoId: targetPagoId,
        motivo: "monto_discrepante",
        montoEsperadoCentavos,
        montoCobradoCentavos: transactionAmountCentavos,
        paymentId: payment.id,
        fecha: nowIso,
      });

      return NextResponse.json({ received: true, estado: "revision_manual" }, { status: 200 });
    }

    // 7. Transiciones de estado según veredicto de Mercado Pago
    const updatedPagos = [...pagosList];

    if (payment.status === "approved") {
      if (pagoIndex >= 0) {
        updatedPagos[pagoIndex] = {
          ...updatedPagos[pagoIndex],
          estado: "aprobado",
          paymentId: String(payment.id),
          pagadoAt: payment.date_approved || nowIso,
        };
      }

      // Evaluar estado general de la orden:
      // Si todos los pagos del calendario están aprobados -> "pagado"
      // Si el primer pago o anticipo está aprobado pero faltan cuotas -> "anticipo_pagado"
      const todosAprobados =
        updatedPagos.length > 0
          ? updatedPagos.every((p) => p.estado === "aprobado")
          : true;

      const nuevoEstado: Order["estado"] = todosAprobados ? "pagado" : "anticipo_pagado";

      await orderRef.update({
        estado: nuevoEstado,
        pagos: updatedPagos,
        mercadoPagoPaymentId: String(payment.id),
        metodoPagoDetalle: payment.payment_method_id || "mercadopago",
        pagadoAt: payment.date_approved || nowIso,
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
      }

      // Bitácora de auditoría
      await adminDb.collection("auditLog").add({
        tipo: "mercadopago_pago_aprobado",
        folio: orderData.folio,
        pagoId: targetPagoId,
        paymentId: payment.id,
        montoCentavos: transactionAmountCentavos,
        nuevoEstado,
        fecha: nowIso,
      });

      return NextResponse.json({
        received: true,
        estado: nuevoEstado,
        pagoId: targetPagoId,
        paymentId: payment.id,
      });
    }

    if (payment.status === "rejected" || payment.status === "cancelled") {
      if (pagoIndex >= 0) {
        updatedPagos[pagoIndex] = {
          ...updatedPagos[pagoIndex],
          estado: "rechazado",
          paymentId: String(payment.id),
        };
      }

      await orderRef.update({
        estado: "pago_rechazado",
        pagos: updatedPagos,
        mercadoPagoPaymentId: String(payment.id),
        motivoRechazo: payment.status_detail || payment.status,
        updatedAt: nowIso,
      });

      return NextResponse.json({ received: true, estado: "pago_rechazado", pagoId: targetPagoId });
    }

    return NextResponse.json({ received: true, status: payment.status, pagoId: targetPagoId });
  } catch (error: any) {
    console.error("[Webhook Mercado Pago] Error crítico:", error);
    return NextResponse.json(
      { error: "Error interno al procesar webhook", message: error.message },
      { status: 500 }
    );
  }
}
