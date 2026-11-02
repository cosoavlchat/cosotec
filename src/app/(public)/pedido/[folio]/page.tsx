import React from "react";
import { getCartFromFirestore } from "@/lib/cart";
import { adminDb } from "@/lib/firebase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Calendar,
  MapPin,
  Truck,
  CreditCard,
  Building,
  AlertTriangle,
  ArrowRight,
  Phone,
  MessageCircle,
  Clock,
  ShieldAlert,
  ShieldX,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { formatMxn } from "@/lib/pricing";
import { WHATSAPP_DISPLAY, buildWhatsAppLink } from "@/lib/utils/whatsapp";
import { Order } from "@/types/order";
import { validarTokenCotizacion } from "@/lib/quotes";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Confirmación de Pedido | CosoTec",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PedidoPage({
  params,
  searchParams,
}: {
  params: Promise<{ folio: string }>;
  searchParams: Promise<{ t?: string; mp_status?: string; status?: string }>;
}) {
  const { folio } = await params;
  const { t: token, mp_status: mpStatus } = await searchParams;

  // 1. Intentar cargar orden formal desde 'orders'
  let order: Order | null = null;
  const orderSnap = await adminDb.collection("orders").doc(folio).get();

  if (orderSnap.exists) {
    order = orderSnap.data() as Order;
  } else {
    const q = await adminDb.collection("orders").where("folio", "==", folio).limit(1).get();
    if (!q.empty) {
      order = q.docs[0].data() as Order;
    }
  }

  // 2. Si no existe orden, consultar carrito como fallback
  const cart = !order ? await getCartFromFirestore(folio) : null;

  if (!order && !cart) {
    notFound();
  }

  // REGLA 5: Validación estricta de token (aleatorio, hash revocable)
  if (order?.tokenHash) {
    // Caso A: No se proporcionó el token en la URL
    if (!token) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#F5F3F2]">
          <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-gray-200/80 shadow-md text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-9 h-9" />
            </div>
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                Enlace Protegido
              </span>
              <h1 className="text-2xl font-extrabold text-[#1C1C1E] tracking-tight">
                Se requiere token de seguridad
              </h1>
              <p className="text-sm text-gray-600 leading-relaxed">
                Por privacidad y seguridad comercial, los pedidos de CosoTec no son accesibles mediante folios abiertos.
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600 text-left space-y-1.5 border border-gray-100">
              <p className="font-semibold text-gray-900">¿Cómo acceder?</p>
              <p>
                Abre el enlace completo que te enviamos al confirmar tu orden, el cual incluye el parámetro de autorización (<code className="bg-gray-200 px-1 py-0.5 rounded text-[11px]">?t=...</code>).
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#7A1428] text-white font-bold text-xs hover:bg-[#5C0F1E] transition-colors"
              >
                Ir a la Tienda
              </Link>
            </div>
          </div>
        </div>
      );
    }

    // Caso B: Token inválido o revocado
    const esValido = validarTokenCotizacion(order.tokenHash, token);
    if (!esValido) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#F5F3F2]">
          <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-red-200/80 shadow-md text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto">
              <ShieldX className="w-9 h-9" />
            </div>
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 text-red-800 border border-red-200">
                Acceso Denegado
              </span>
              <h1 className="text-2xl font-extrabold text-[#1C1C1E] tracking-tight">
                Enlace no válido o revocado
              </h1>
              <p className="text-sm text-gray-600 leading-relaxed">
                El token de seguridad ha caducado, fue regenerado o no coincide con los registros del pedido.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition-colors"
              >
                Volver al Inicio
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  const calculo = order?.calculo || cart?.calculo;
  const contacto = order?.contacto || cart?.contacto;
  const instalacion = order?.instalacion || cart?.instalacion;
  const planKey = order?.planPago || cart?.pago?.planSeleccionado || "contado";
  const activePlan = calculo?.planesPago?.[planKey] || calculo?.planesPago?.["contado"];
  const metodoSeleccionado = order?.metodoPago || cart?.pago?.metodoSeleccionado || "mercadopago";
  const orderFolio = order?.folio || cart?.orderFolio || cart?.id || folio;
  const estadoOrden = order?.estado || "pendiente_pago";
  const pagos = order?.pagos || [];

  const whatsappUrl = buildWhatsAppLink({
    producto: `Seguimiento de Pedido ${orderFolio}`,
    pagina: `/pedido/${orderFolio}`,
    tipoConsulta: "compra",
  });

  return (
    <div className="min-h-screen bg-[#F5F3F2] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* REGLA 5: Alerta de Retorno de Mercado Pago (procesando por Webhook) */}
        {mpStatus === "processing" && estadoOrden === "pendiente_pago" && (
          <div className="bg-amber-50 border border-amber-300 rounded-3xl p-5 flex items-start gap-3 shadow-xs">
            <RefreshCw className="w-5 h-5 text-amber-700 shrink-0 mt-0.5 animate-spin" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-amber-900">
                Procesando Pago con Mercado Pago...
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                Tu transacción fue recibida por la pasarela. Estamos esperando la confirmación oficial del webhook para actualizar tu orden técnica. Esta página se actualizará automáticamente.
              </p>
            </div>
          </div>
        )}

        {mpStatus === "failure" && (
          <div className="bg-red-50 border border-red-300 rounded-3xl p-5 flex items-start gap-3 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-red-900">
                Pago No Procesado
              </h3>
              <p className="text-xs text-red-800 leading-relaxed">
                Mercado Pago no pudo autorizar el cobro. Por favor verifica con tu institución bancaria o intenta con otra tarjeta.
              </p>
            </div>
          </div>
        )}

        {/* Banner de Estado Oficial de la Orden */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 text-center space-y-4 shadow-xs">
          {estadoOrden === "pagado" || estadoOrden === "anticipo_pagado" ? (
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          ) : estadoOrden === "revision_manual" ? (
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
          ) : estadoOrden === "pago_rechazado" ? (
            <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8" />
            </div>
          )}

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#7A1428] block">
              CosoTec · Ingeniería y Rastreo Satelital
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {estadoOrden === "pagado"
                ? "¡Pago Liquidado y Confirmado!"
                : estadoOrden === "anticipo_pagado"
                ? "¡Anticipo Confirmado con Éxito!"
                : estadoOrden === "revision_manual"
                ? "Pago en Revisión Manual por Administración"
                : estadoOrden === "pago_rechazado"
                ? "Pago Rechazado"
                : "¡Tu Pedido Ha Sido Registrado!"}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
              {estadoOrden === "pagado" || estadoOrden === "anticipo_pagado"
                ? "Hemos validado tu transacción mediante el webhook oficial. Nuestro equipo técnico tiene programada la preparación de tus unidades."
                : estadoOrden === "revision_manual"
                ? "El monto cobrado difiere del cálculo oficial o requiere autorización manual. Un ejecutivo revisará tu caso."
                : "Tu orden técnica está registrada en espera de confirmación de pago para programar la visita técnica."}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 font-mono text-xs text-gray-800">
            <span className="text-gray-400">Folio Oficial:</span>
            <strong className="text-[#7A1428] text-sm">{orderFolio}</strong>
          </div>
        </div>

        {/* Datos Bancarios SPEI de Prueba si aplica */}
        {metodoSeleccionado === "spei" && (
          <div className="bg-white rounded-3xl border-2 border-red-300 p-6 shadow-xs space-y-4">
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-2 text-red-800 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>DATOS BANCARIOS DE PRUEBA – NO REALIZAR TRANSFERENCIAS REALES</span>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-xs space-y-2 font-mono text-gray-800">
              <div className="flex justify-between border-b border-gray-200/60 pb-1.5">
                <span className="text-gray-500">Banco Receptor:</span>
                <span className="font-bold">Banco de prueba</span>
              </div>
              <div className="flex justify-between border-b border-gray-200/60 pb-1.5">
                <span className="text-gray-500">Beneficiario:</span>
                <span className="font-bold">CUENTA DE PRUEBA – NO TRANSFERIR</span>
              </div>
              <div className="flex justify-between border-b border-gray-200/60 pb-1.5">
                <span className="text-gray-500">CLABE Interbancaria:</span>
                <span className="font-bold tracking-wider text-base text-[#7A1428]">
                  012180001234567897
                </span>
              </div>
              <div className="flex justify-between pt-0.5">
                <span className="text-gray-500">Concepto / Referencia:</span>
                <span className="font-bold">{orderFolio}</span>
              </div>
            </div>
          </div>
        )}

        {/* Ficha de Instalación */}
        {instalacion && (
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2">
              <MapPin className="w-4 h-4 text-[#7A1428]" />
              <span>Coordinación de Instalación Técnica</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-400 block mb-0.5">Lugar / Modalidad:</span>
                <span className="font-semibold text-gray-900 block">
                  {instalacion.tipoLugar === "taller_cosoavl"
                    ? "Taller Matriz Metepec (Segunda privada Callejón del Sol #44, Col. San Jerónimo Chicahualco)"
                    : `${instalacion.direccion || "Domicilio cliente"}, ${instalacion.municipio || ""}, ${instalacion.estadoNombre || ""}`}
                </span>
              </div>

              <div>
                <span className="text-gray-400 block mb-0.5">Fecha y Horario Tentativo:</span>
                <span className="font-semibold text-gray-900 block">
                  {instalacion.fechaTentativa || "Por programar con asesor"} ({instalacion.horarioTentativo || "Matutino"})
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Resumen Financiero y Calendario Granular de Pagos */}
        {calculo && (
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2">
              <CreditCard className="w-4 h-4 text-[#7A1428]" />
              <span>Resumen Financiero y Exhibiciones ({activePlan?.nombre || "Contado"})</span>
            </h2>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal neto:</span>
                <span>{calculo.formato.subtotalConDescuento}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>IVA (16%):</span>
                <span>{calculo.formato.iva}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Viáticos de traslado:</span>
                <span>{calculo.formato.viaticos}</span>
              </div>
              <div className="pt-2 border-t border-gray-100 flex justify-between font-bold text-sm text-gray-900">
                <span>Inversión Total con IVA:</span>
                <span className="text-[#7A1428] font-black">{calculo.formato.total}</span>
              </div>
            </div>

            {/* Calendario Granular con Estado Individual por Cuota */}
            {pagos.length > 0 && (
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600 block">
                  Estado de Exhibiciones del Calendario
                </span>
                <div className="space-y-2 text-xs">
                  {pagos.map((p) => (
                    <div
                      key={p.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200/80 gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">
                            {p.id}: {p.concepto}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              p.estado === "aprobado"
                                ? "bg-emerald-100 text-emerald-800"
                                : p.estado === "rechazado"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {p.estado === "aprobado"
                              ? "Acreditado"
                              : p.estado === "rechazado"
                              ? "Rechazado"
                              : "Pendiente"}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-500 font-mono block mt-0.5">
                          Ref: {p.externalReference}
                        </span>
                        {p.fechaEstimada && (
                          <span className="text-[11px] text-[#7A1428] block mt-0.5">
                            🗓️ {p.fechaEstimada}
                          </span>
                        )}
                      </div>
                      <div className="sm:text-right">
                        <span className="text-sm font-black text-gray-900 block">
                          {formatMxn(p.montoCentavos)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botones de Acción y Soporte */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
          <Link
            href="/"
            className="w-full sm:w-auto text-center px-6 py-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-white transition-all shadow-xs"
          >
            Volver a la Tienda
          </Link>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold shadow-md transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Coordinar con un Asesor</span>
          </a>
        </div>
      </div>
    </div>
  );
}
