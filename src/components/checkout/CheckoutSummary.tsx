"use client";

import React from "react";
import { useCart } from "@/context/CartContext";
import { CartView } from "@/components/cart/CartView";
import {
  ShoppingCart,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { formatMxn } from "@/lib/pricing";

export function CheckoutSummary() {
  const { cart, saveStatus } = useCart();
  const calculo = cart?.calculo;
  const planKey = cart?.pago?.planSeleccionado || "contado";
  const activePlan = calculo?.planesPago?.[planKey] || calculo?.planesPago?.["contado"];

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header con indicador de auto-guardado */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-[#7A1428]" />
          <h3 className="font-bold text-sm text-gray-900">Resumen del Pedido</h3>
        </div>

        {/* Auto-save Status Badge */}
        <div className="flex items-center gap-1.5 text-[11px]">
          {saveStatus === "saving" && (
            <span className="text-amber-600 font-medium animate-pulse flex items-center gap-1">
              <Clock className="w-3 h-3" /> Guardando...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Guardado
            </span>
          )}
          {saveStatus === "idle" && (
            <span className="text-gray-400">✓ Sincronizado</span>
          )}
          {saveStatus === "error" && (
            <span className="text-red-500 font-medium">Error al guardar</span>
          )}
        </div>
      </div>

      {/* Vista interactiva del carrito con controles de eliminación, cantidad y recálculo */}
      <CartView showCheckoutButton={false} />

      {/* Desglose de Pago Diferido si el cliente seleccionó plan credi-contado o enganche */}
      {activePlan && activePlan.tipo !== "contado" && (
        <div className="p-3.5 rounded-2xl bg-[#7A1428]/5 border border-[#7A1428]/20 space-y-1.5 text-xs">
          <div className="flex justify-between font-bold text-[#7A1428]">
            <span>Pagas hoy ({activePlan.nombre}):</span>
            <span>{formatMxn(activePlan.montoPrimerPagoCentavos)}</span>
          </div>
          <div className="flex justify-between text-[11px] text-gray-600">
            <span>Saldo al instalar / diferido:</span>
            <span>{formatMxn(activePlan.saldoRestanteCentavos)}</span>
          </div>
        </div>
      )}

      {/* Garantías y sellos de confianza */}
      <div className="pt-2 border-t border-gray-100 space-y-1.5 text-[11px] text-gray-500">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-[#7A1428]" />
          <span>Instalación técnica en 48–72 horas hábiles tras confirmar pago</span>
        </div>
      </div>
    </div>
  );
}
