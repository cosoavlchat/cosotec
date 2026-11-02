"use client";

import React, { useState } from "react";
import { useCart } from "@/context/CartContext";
import {
  CreditCard,
  Building,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Calendar,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import { formatMxn } from "@/lib/pricing";
import { buildWhatsAppCartFallbackLink } from "@/lib/utils/whatsapp";

interface Step5PagoProps {
  onBack: () => void;
  onConfirmOrder: (planSeleccionado: string, metodoSeleccionado: "mercadopago" | "spei") => void;
  isSubmitting?: boolean;
  orderError?: { message: string; errorId?: string } | null;
}

export function Step5Pago({
  onBack,
  onConfirmOrder,
  isSubmitting = false,
  orderError,
}: Step5PagoProps) {
  const { cart, updatePago } = useCart();
  const calculo = cart?.calculo;
  const planes = calculo?.planesPago || {};

  const whatsappFallbackUrl = buildWhatsAppCartFallbackLink({
    errorId: orderError?.errorId,
    cartId: cart?.id,
    items: cart?.items?.map((it) => ({ nombre: it.nombre, cantidad: it.cantidad })),
    totalFormateado: calculo?.formato.total,
    contactoNombre: cart?.contacto?.nombre,
  });

  const [planSeleccionado, setPlanSeleccionado] = useState<string>(
    cart?.pago?.planSeleccionado || "contado"
  );
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<"mercadopago" | "spei">(
    cart?.pago?.metodoSeleccionado || "mercadopago"
  );

  const handleSelectPlan = (planKey: string) => {
    setPlanSeleccionado(planKey);
    updatePago({ planSeleccionado: planKey, metodoSeleccionado }, true);
  };

  const handleSelectMetodo = (metodo: "mercadopago" | "spei") => {
    setMetodoSeleccionado(metodo);
    updatePago({ planSeleccionado, metodoSeleccionado: metodo }, true);
  };

  const currentPlan = planes[planSeleccionado] || planes["contado"];

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7A1428]/10 text-[#7A1428] text-xs font-bold mb-2">
          <span>Paso 5 de 5</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
          Plan de Pago y Método de Liquidación
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Elige cómo deseas distribuir tu inversión y selecciona el método de pago para confirmar tu orden técnica.
        </p>
      </div>

      {/* Selector de Planes de Pago */}
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
          1. Selecciona tu Esquema de Pago *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Plan Contado */}
          {planes["contado"] && (
            <button
              type="button"
              onClick={() => handleSelectPlan("contado")}
              className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all relative ${
                planSeleccionado === "contado"
                  ? "border-[#7A1428] bg-[#7A1428]/5 ring-2 ring-[#7A1428]/20"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-gray-900">Pago de Contado</span>
                  {planSeleccionado === "contado" && (
                    <CheckCircle2 className="w-4 h-4 text-[#7A1428]" />
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mb-3">100% en una sola exhibición</p>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Total a liquidar:</span>
                <span className="text-lg font-black text-gray-900">
                  {formatMxn(planes["contado"].totalCentavos)}
                </span>
              </div>
            </button>
          )}

          {/* Plan Credi-Contado */}
          {planes["credi_contado"] && (
            <button
              type="button"
              onClick={() => handleSelectPlan("credi_contado")}
              className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all relative ${
                planSeleccionado === "credi_contado"
                  ? "border-[#7A1428] bg-[#7A1428]/5 ring-2 ring-[#7A1428]/20"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-gray-900">Credi-Contado</span>
                  {planSeleccionado === "credi_contado" && (
                    <CheckCircle2 className="w-4 h-4 text-[#7A1428]" />
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mb-3">
                  55% al confirmar / 45% al concluir la instalación
                </p>
              </div>
              <div className="pt-2 border-t border-gray-100 space-y-0.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Anticipo hoy:</span>
                  <span className="font-bold text-[#7A1428]">
                    {formatMxn(planes["credi_contado"].montoPrimerPagoCentavos)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-gray-400">
                  <span>Contra entrega:</span>
                  <span>{formatMxn(planes["credi_contado"].saldoRestanteCentavos)}</span>
                </div>
              </div>
            </button>
          )}

          {/* Plan Enganche + 2 Pagos */}
          {planes["enganche_mensualidades"] && (
            <button
              type="button"
              onClick={() => handleSelectPlan("enganche_mensualidades")}
              className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all relative ${
                planSeleccionado === "enganche_mensualidades"
                  ? "border-[#7A1428] bg-[#7A1428]/5 ring-2 ring-[#7A1428]/20"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-gray-900">Enganche + 2 Pagos</span>
                  {planSeleccionado === "enganche_mensualidades" && (
                    <CheckCircle2 className="w-4 h-4 text-[#7A1428]" />
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mb-3">
                  55% enganche inicial y 2 cuotas mensuales
                </p>
              </div>
              <div className="pt-2 border-t border-gray-100 space-y-0.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Enganche hoy:</span>
                  <span className="font-bold text-[#7A1428]">
                    {formatMxn(planes["enganche_mensualidades"].montoPrimerPagoCentavos)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-gray-400">
                  <span>Saldo en 2 cuotas:</span>
                  <span>{formatMxn(planes["enganche_mensualidades"].saldoRestanteCentavos)}</span>
                </div>
              </div>
            </button>
          )}
        </div>

        {/* Desglose de cuotas del plan activo con calendario completo */}
        {currentPlan && currentPlan.pagos && currentPlan.pagos.length > 1 && (
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
                Calendario Oficial de Exhibiciones Programadas
              </span>
              <span className="text-[11px] text-gray-500 font-medium">
                {currentPlan.pagos.length} exhibiciones
              </span>
            </div>
            <div className="space-y-2 text-xs">
              {currentPlan.pagos.map((p) => (
                <div
                  key={p.numero}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-xl bg-white border border-gray-200/80 gap-1.5"
                >
                  <div>
                    <span className="font-bold text-gray-900 block">
                      Pago #{p.numero}: {p.concepto}
                    </span>
                    {p.fechaEstimada && (
                      <span className="text-[11px] text-[#7A1428] font-medium block">
                        🗓️ {p.fechaEstimada}
                      </span>
                    )}
                  </div>
                  <div className="sm:text-right">
                    <span className="text-sm font-black text-gray-900">{p.montoFormateado}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Métodos de Pago */}
      <div className="space-y-3 pt-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
          2. Selecciona el Medio de Pago *
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Mercado Pago */}
          <button
            type="button"
            onClick={() => handleSelectMetodo("mercadopago")}
            className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
              metodoSeleccionado === "mercadopago"
                ? "border-[#7A1428] bg-[#7A1428]/5 ring-2 ring-[#7A1428]/20"
                : "border-gray-200 hover:border-gray-300 bg-white"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                metodoSeleccionado === "mercadopago"
                  ? "bg-[#009EE3] text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <span className="block font-bold text-sm text-gray-900">Mercado Pago Checkout</span>
              <span className="text-xs text-gray-500 block mt-0.5">
                Tarjeta de crédito, débito o prepagada.
              </span>
            </div>
          </button>

          {/* Transferencia SPEI */}
          <button
            type="button"
            onClick={() => handleSelectMetodo("spei")}
            className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
              metodoSeleccionado === "spei"
                ? "border-[#7A1428] bg-[#7A1428]/5 ring-2 ring-[#7A1428]/20"
                : "border-gray-200 hover:border-gray-300 bg-white"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                metodoSeleccionado === "spei"
                  ? "bg-[#7A1428] text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <Building className="w-5 h-5" />
            </div>
            <div>
              <span className="block font-bold text-sm text-gray-900">Transferencia Bancaria (SPEI)</span>
              <span className="text-xs text-gray-500 block mt-0.5">
                Transferencia bancaria. Te mostramos los datos para transferir; validamos tu comprobante y te confirmamos por correo.
              </span>
            </div>
          </button>
        </div>

        {/* Datos Bancarios de Prueba con Alerta Visible Obligatoria */}
        {metodoSeleccionado === "spei" && (
          <div className="mt-4 p-5 rounded-2xl border-2 border-red-300 bg-red-50/80 space-y-3">
            <div className="flex items-center gap-2 text-red-800 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>DATOS BANCARIOS DE PRUEBA – NO REALIZAR TRANSFERENCIAS</span>
            </div>
            <p className="text-xs text-red-700">
              Esta plataforma se encuentra en periodo de validación técnica de checkout. La cuenta fiscal oficial será suministrada antes del lanzamiento a producción.
            </p>
            <div className="bg-white p-3.5 rounded-xl border border-red-200 text-xs space-y-1.5 font-mono text-gray-800">
              <div>
                <span className="text-gray-400">Banco: </span>
                <span className="font-bold">Banco de prueba</span>
              </div>
              <div>
                <span className="text-gray-400">Titular: </span>
                <span className="font-bold">CUENTA DE PRUEBA – NO TRANSFERIR</span>
              </div>
              <div>
                <span className="text-gray-400">CLABE Interbancaria: </span>
                <span className="font-bold tracking-wider">012180001234567897</span>
              </div>
              <div>
                <span className="text-gray-400">Referencia: </span>
                <span className="font-bold">{cart?.id || "PEDIDO-TEST"}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Banner de Error Visible en Página (Sin alerts) con Fallback a WhatsApp */}
      {orderError && (
        <div className="p-5 rounded-2xl bg-red-50 border-2 border-red-200 text-red-900 space-y-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-red-900">
                {orderError.message || "No pudimos generar tu orden"}
              </h4>
              <p className="text-xs text-red-700">
                Ocurrió un inconveniente al conectar con la pasarela de pagos. Puedes terminar tu pedido de inmediato vía WhatsApp con un asesor oficial sin perder los datos de tus vehículos.
              </p>
              {orderError.errorId && (
                <p className="text-[11px] font-mono font-semibold text-red-800">
                  Código de seguimiento: <span className="bg-red-100 px-1.5 py-0.5 rounded border border-red-200">{orderError.errorId}</span>
                </p>
              )}
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <a
              href={whatsappFallbackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-xs rounded-xl shadow-md transition-all hover:scale-105"
            >
              <MessageCircle className="w-4 h-4 fill-current text-white" />
              <span>Terminar compra por WhatsApp (722 432 2053)</span>
            </a>
            <button
              type="button"
              onClick={() => onConfirmOrder(planSeleccionado, metodoSeleccionado)}
              disabled={isSubmitting}
              className="w-full sm:w-auto text-xs font-bold text-red-800 hover:underline px-3 py-2 text-center"
            >
              Reintentar generación de orden
            </button>
          </div>
        </div>
      )}

      {/* Botones de navegación y confirmación */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onBack}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Factura</span>
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => onConfirmOrder(planSeleccionado, metodoSeleccionado)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#7A1428] hover:bg-[#4A0C18] text-white font-bold text-sm rounded-xl shadow-lg transition-all hover:scale-[1.02] disabled:opacity-50"
        >
          <Lock className="w-4 h-4 text-[#C9A15B]" />
          <span>{isSubmitting ? "Procesando Orden..." : "Confirmar Pedido y Proceder"}</span>
        </button>
      </div>
    </div>
  );
}

