import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "@/lib/firebase/admin";
import { getCartFromFirestore } from "@/lib/cart";
import { verifyCartSession, CART_SESSION_COOKIE_NAME } from "@/lib/cart/session";
import { generarSiguienteFolio, generarTokenAleatorio, hashToken } from "@/lib/quotes";
import { crearOrdenMercadoPago } from "@/lib/mercadopago";
import { Order, OrderPagoProgramado } from "@/types/order";
import { notificarConfirmacionPedidoCliente } from "@/lib/services/email-service";

export async function POST(req: NextRequest) {
  let folio: string | undefined;
  try {
    const rawCookie = req.cookies.get(CART_SESSION_COOKIE_NAME)?.value;
    const sessionCartId = verifyCartSession(rawCookie);

    const json = await req.json().catch(() => ({}));
    const cartId = json.cartId || sessionCartId;

    if (!cartId) {
      return NextResponse.json(
        { error: "No se identificó ningún carrito activo para procesar." },
        { status: 400 }
      );
    }

    // Si hay sesión de cookie y difiere del cartId solicitado
    if (sessionCartId && sessionCartId !== cartId) {
      return NextResponse.json(
        { error: "No tienes autorización para generar un pedido desde un carrito ajeno." },
        { status: 403 }
      );
    }

    const cart = await getCartFromFirestore(cartId);
    if (!cart || !cart.items || cart.items.length === 0) {
      return NextResponse.json(
        { error: "El carrito está vacío o no existe en Firestore." },
        { status: 400 }
      );
    }

    if (!cart.contacto?.telefono || !cart.contacto?.nombre) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios de contacto para generar el pedido." },
        { status: 400 }
      );
    }

    const calculo = cart.calculo;
    if (!calculo) {
      return NextResponse.json(
        { error: "No se ha calculado la cotización del carrito." },
        { status: 400 }
      );
    }

    // Folio consecutivo atómico CT-XXXXXXX
    folio = await generarSiguienteFolio();
    const token = generarTokenAleatorio();
    const tokenHash = hashToken(token);

    const planKey = cart.pago?.planSeleccionado || "contado";
    const metodoPago = cart.pago?.metodoSeleccionado || "mercadopago";
    const plan = calculo.planesPago[planKey] || calculo.planesPago["contado"];

    const nowIso = new Date().toISOString();

    // Construir desglose granular de exhibiciones del calendario (ej: CT-1124451-P1)
    const pagosProgramados: OrderPagoProgramado[] = (plan.pagos || []).map((p) => ({
      id: `P${p.numero}`,
      numero: p.numero,
      concepto: p.concepto,
      montoCentavos: p.montoCentavos,
      momento: p.momento,
      fechaEstimada: p.fechaEstimada,
      estado: "pendiente",
      externalReference: `${folio}-P${p.numero}`,
    }));

    let mpOrder = undefined;

    // Si el método seleccionado es Mercado Pago, generar la orden Checkout Pro para el primer pago (P1)
    if (metodoPago === "mercadopago") {
      const origin = req.nextUrl.origin || "http://localhost:3000";
      const pago1 = pagosProgramados[0];
      const montoP1Pesos = pago1.montoCentavos / 100;

      mpOrder = await crearOrdenMercadoPago({
        folio,
        externalReference: pago1.externalReference, // "CT-XXXXXXX-P1"
        token,
        items: [
          {
            id: pago1.externalReference,
            title: `Pedido ${folio} - ${pago1.concepto}`,
            quantity: 1,
            unit_price: montoP1Pesos,
          },
        ],
        payerEmail: cart.contacto.correo || "cliente@cosotec.com",
        backUrlBase: origin,
      });

      pago1.orderMpId = mpOrder.id;
      pago1.preferenceId = mpOrder.id;
    }

    const order: Order = {
      id: folio,
      folio,
      cartId: cart.id,
      tokenHash,
      estado: "pendiente_pago",
      metodoPago,
      planPago: planKey,
      montoPrimerPagoCentavos: plan.montoPrimerPagoCentavos,
      saldoRestanteCentavos: plan.saldoRestanteCentavos,
      totalCentavos: calculo.totalCentavos,
      items: cart.items.map((it) => ({
        id: it.id,
        nombre: it.nombre,
        cantidad: it.cantidad,
        precioSinIvaCentavos: it.precioSinIvaCentavos,
        totalSinIvaCentavos: it.precioSinIvaCentavos * it.cantidad,
        esEquipoPrincipal: it.esEquipoPrincipal,
      })),
      calculo,
      contacto: cart.contacto,
      instalacion: cart.instalacion || {},
      unidades: cart.unidades || [],
      factura: cart.factura,
      pagos: pagosProgramados,
      mercadoPagoOrderId: mpOrder?.id,
      mercadoPagoPreferenceId: mpOrder?.id,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Guardar orden en Firestore
    await adminDb.collection("orders").doc(folio).set(order);

    // Actualizar carrito con folio generado
    await adminDb.collection("carts").doc(cart.id).update({
      orderFolio: folio,
      updatedAt: nowIso,
    });

    // Enviar confirmación de pedido por correo al cliente
    const origin = req.nextUrl.origin || "http://localhost:3000";
    await notificarConfirmacionPedidoCliente(order, token, origin).catch((err) =>
      console.error("[crear-orden] Error enviando confirmación por correo:", err)
    );

    return NextResponse.json({
      success: true,
      folio,
      token,
      order,
      mercadoPago: mpOrder,
    });
  } catch (error: any) {
    const errorId = `ERR_${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    console.error(
      `[API Checkout Crear Orden] [ErrorId: ${errorId}] [Folio: ${folio || "N/A"}] Error completo:`,
      error
    );
    // Nunca exponer mensajes internos de Mercado Pago ni detalles de infraestructura al cliente
    return NextResponse.json(
      { error: "No pudimos generar tu orden", errorId },
      { status: 500 }
    );
  }
}
