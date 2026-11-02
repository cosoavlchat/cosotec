import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "@/lib/firebase/admin";
import { getCartFromFirestore } from "@/lib/cart";
import { verifyCartSession, CART_SESSION_COOKIE_NAME } from "@/lib/cart/session";
import { generarSiguienteFolio, generarTokenAleatorio, hashToken, validarTokenCotizacion } from "@/lib/quotes";
import { crearOrdenMercadoPago, validarExternalReferenceMP } from "@/lib/mercadopago";
import { Order, OrderPagoProgramado } from "@/types/order";
import { Quote } from "@/types/quote";
import { notificarConfirmacionPedidoCliente } from "@/lib/services/email-service";

export async function POST(req: NextRequest) {
  let folio: string | undefined;
  try {
    const rawCookie = req.cookies.get(CART_SESSION_COOKIE_NAME)?.value;
    const sessionCartId = verifyCartSession(rawCookie);

    const json = await req.json().catch(() => ({}));
    const cotizacionFolio: string | undefined = json.cotizacionFolio;
    const cotizacionToken: string | undefined = json.token || json.cotizacionToken;
    const cartId: string | undefined = json.cartId || sessionCartId;

    let quoteData: Quote | null = null;

    // FLUJO A: Pago directo desde Cotización (/c/[folio] o /checkout?cotizacion=...)
    if (cotizacionFolio) {
      const quoteSnap = await adminDb.collection("quotes").doc(cotizacionFolio).get();
      if (!quoteSnap.exists) {
        return NextResponse.json(
          { error: "La cotización especificada no existe." },
          { status: 404 }
        );
      }
      quoteData = quoteSnap.data() as Quote;

      // 1. Validar token si fue proporcionado
      if (cotizacionToken && !validarTokenCotizacion(quoteData.tokenHash, cotizacionToken)) {
        return NextResponse.json(
          { error: "Token de acceso a la cotización no válido." },
          { status: 403 }
        );
      }

      // 2. Regla: Solo cotizaciones en estado 'enviada' o 'vista'
      if (quoteData.estado === "pendiente_autorizacion") {
        return NextResponse.json(
          { error: "La cotización está en revisión y pendiente de autorización." },
          { status: 403 }
        );
      }

      if (quoteData.estado === "pagada" || quoteData.estado === "pagada_parcial") {
        return NextResponse.json(
          { error: "Esta cotización ya cuenta con pagos registrados y no puede pagarse de nuevo." },
          { status: 400 }
        );
      }

      if (quoteData.estado !== "enviada" && quoteData.estado !== "vista") {
        return NextResponse.json(
          { error: `La cotización no se encuentra en estado pagable (estado: ${quoteData.estado}).` },
          { status: 400 }
        );
      }

      // 3. Regla de Versiones: no permitir pagar versiones obsoletas
      if (quoteData.esVersionActiva === false) {
        return NextResponse.json(
          { error: "Hay una versión más reciente de esta cotización" },
          { status: 400 }
        );
      }

      // 4. Regla de Vigencia: no permitir cotizaciones vencidas
      const vencida = quoteData.venceAt ? new Date(quoteData.venceAt).getTime() < Date.now() : false;
      if (vencida) {
        return NextResponse.json(
          { error: "Esta cotización venció, solicita una actualización a tu asesor" },
          { status: 400 }
        );
      }
    }

    // FLUJO B: Carrito estándar de tienda / compra normal
    let cart = null;
    if (cartId) {
      if (sessionCartId && sessionCartId !== cartId && !cotizacionFolio) {
        return NextResponse.json(
          { error: "No tienes autorización para generar un pedido desde un carrito ajeno." },
          { status: 403 }
        );
      }
      cart = await getCartFromFirestore(cartId);
    }

    if (!quoteData && (!cart || !cart.items || cart.items.length === 0)) {
      return NextResponse.json(
        { error: "El carrito está vacío o no se identificó ninguna cotización válida para procesar." },
        { status: 400 }
      );
    }

    // Datos de contacto y cálculo congelado
    const contacto = json.contacto || cart?.contacto || {
      nombre: quoteData?.cliente?.nombre || "Cliente CosoTec",
      telefono: quoteData?.cliente?.telefono || "",
      correo: quoteData?.cliente?.correo || "",
      empresa: quoteData?.cliente?.empresa,
      rfc: quoteData?.cliente?.rfc,
    };

    if (!contacto.telefono || !contacto.nombre) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios de contacto para generar el pedido." },
        { status: 400 }
      );
    }

    // SNAPSHOT INMUTABLE: si proviene de cotización, usar su cálculo frozen SIN recalcular con catálogo actual
    const calculo = quoteData ? quoteData.calculo : cart?.calculo;
    if (!calculo) {
      return NextResponse.json(
        { error: "No se ha determinado el cálculo de la cotización." },
        { status: 400 }
      );
    }

    // Folio consecutivo atómico CT-XXXXXXX
    folio = await generarSiguienteFolio();
    const token = generarTokenAleatorio();
    const tokenHash = hashToken(token);

    const planKey =
      json.planSeleccionado ||
      cart?.pago?.planSeleccionado ||
      quoteData?.condiciones?.planSeleccionado ||
      "contado";

    const metodoPago =
      json.metodoSeleccionado ||
      cart?.pago?.metodoSeleccionado ||
      "mercadopago";

    const plan = calculo.planesPago[planKey] || calculo.planesPago["contado"];
    const nowIso = new Date().toISOString();

    // External reference con soporte de versión (ej: "CT-1124451-v2-P1" o "CT-1124451-P1")
    const baseFolioParaRef = quoteData ? quoteData.folio : folio;

    const pagosProgramados: OrderPagoProgramado[] = (plan.pagos || []).map((p) => {
      const extRef = `${baseFolioParaRef}-P${p.numero}`;
      if (!validarExternalReferenceMP(extRef)) {
        throw new Error(`external_reference inválida para Mercado Pago: ${extRef}`);
      }
      return {
        id: `P${p.numero}`,
        numero: p.numero,
        concepto: p.concepto,
        montoCentavos: p.montoCentavos,
        momento: p.momento,
        fechaEstimada: p.fechaEstimada,
        estado: "pendiente",
        externalReference: extRef,
      };
    });

    let mpOrder = undefined;

    // Si el método seleccionado es Mercado Pago, generar la orden Checkout Pro para el primer pago (P1)
    if (metodoPago === "mercadopago") {
      const origin = req.nextUrl.origin || "http://localhost:3000";
      const pago1 = pagosProgramados[0];
      const montoP1Pesos = pago1.montoCentavos / 100;

      mpOrder = await crearOrdenMercadoPago({
        folio,
        externalReference: pago1.externalReference,
        token,
        items: [
          {
            id: pago1.externalReference,
            title: `Pedido ${folio} - ${pago1.concepto}`,
            quantity: 1,
            unit_price: montoP1Pesos,
          },
        ],
        payerEmail: contacto.correo || "cliente@cosotec.com",
        backUrlBase: origin,
      });

      pago1.orderMpId = mpOrder.id;
      pago1.preferenceId = mpOrder.id;
    }

    const orderItems = quoteData
      ? quoteData.items.map((it) => ({
          id: it.id,
          nombre: it.nombre,
          cantidad: it.cantidad,
          precioSinIvaCentavos: it.precioSinIvaCentavos,
          totalSinIvaCentavos: it.precioSinIvaCentavos * it.cantidad,
          esEquipoPrincipal: it.esEquipoPrincipal,
        }))
      : (cart?.items || []).map((it) => ({
          id: it.id,
          nombre: it.nombre,
          cantidad: it.cantidad,
          precioSinIvaCentavos: it.precioSinIvaCentavos,
          totalSinIvaCentavos: it.precioSinIvaCentavos * it.cantidad,
          esEquipoPrincipal: it.esEquipoPrincipal,
        }));

    const instalacion =
      json.instalacion ||
      cart?.instalacion ||
      (quoteData?.instalacion
        ? {
            estadoClave: quoteData.instalacion.estadoClave,
            estadoNombre: quoteData.instalacion.estadoNombre,
            municipio: quoteData.instalacion.municipio,
            direccion: "Por confirmar con asesor técnico",
            tipoLugar: "domicilio" as const,
          }
        : quoteData?.estadoInstalacion
        ? {
            estadoClave: quoteData.estadoInstalacion.clave,
            estadoNombre: quoteData.estadoInstalacion.nombre,
            municipio: quoteData.estadoInstalacion.nombre,
            direccion: "Por confirmar con asesor técnico",
            tipoLugar: "domicilio" as const,
          }
        : {});

    const order: Order = {
      id: folio,
      folio,
      cartId: cart?.id || `cart_cot_${quoteData?.folio || folio}`,
      tokenHash,
      estado: "pendiente_pago",
      metodoPago,
      planPago: planKey,
      montoPrimerPagoCentavos: plan.montoPrimerPagoCentavos,
      saldoRestanteCentavos: plan.saldoRestanteCentavos,
      totalCentavos: calculo.totalCentavos,
      items: orderItems,
      calculo,
      contacto,
      instalacion,
      unidades: json.unidades || cart?.unidades || [],
      factura: json.factura || cart?.factura,
      pagos: pagosProgramados,
      mercadoPagoOrderId: mpOrder?.id,
      mercadoPagoPreferenceId: mpOrder?.id,
      folioCotizacion: quoteData?.folio,
      vendedorId: quoteData?.vendedorId,
      vendedorNombre: quoteData?.vendedorNombre,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Guardar orden en Firestore
    await adminDb.collection("orders").doc(folio).set(order);

    // Actualizar carrito si existe
    if (cart?.id) {
      await adminDb.collection("carts").doc(cart.id).update({
        orderFolio: folio,
        updatedAt: nowIso,
      }).catch(() => {});
    }

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
      { error: error.message?.includes("cotización") ? error.message : "No pudimos generar tu orden", errorId },
      { status: 500 }
    );
  }
}
