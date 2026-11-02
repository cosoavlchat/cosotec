"use client";

import React from "react";
import { useCart } from "@/context/CartContext";
import {
  ShoppingCart,
  ShieldCheck,
  Tag,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { formatMxn } from "@/lib/pricing";

export function CheckoutSummary() {
  const { cart, saveStatus, lastSavedAt } = useCart();
  const calculo = cart?.calculo;
  const items = cart?.items || [];
  const planKey = cart?.pago?.planSeleccionado || "contado";
  const activePlan = calculo?.planesPago?.[planKey] || calculo?.planesPago?.["contado"];

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs space-y-6">
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
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Tus datos se guardan automáticamente
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

      {/* Lista de Productos del Carrito */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No hay productos seleccionados.</p>
        ) : (
          items.map((it) => (
            <div key={it.id} className="flex items-start justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="font-bold text-gray-900 flex items-center gap-1.5">
                  <span>{it.nombre}</span>
                  <span className="text-gray-400 font-normal">× {it.cantidad}</span>
                </div>
                <span className="text-[11px] text-gray-400 capitalize block">
                  {it.categoria || it.tipo}
                </span>
                {it.incluyeInstalacion === false && (
                  <span className="text-[10px] text-amber-700 font-medium bg-amber-50 px-1.5 py-0.5 rounded inline-block">
                    + Instalación por separado
                  </span>
                )}
              </div>
              <span className="font-semibold text-gray-900 whitespace-nowrap">
                {formatMxn(it.precioSinIvaCentavos * it.cantidad)}
              </span>
            </div>
          ))
        )}

        {/* Líneas de instalación técnica calculadas automáticamente */}
        {calculo?.lineasCalculadas
          ?.filter((l) => l.esInstalacionAgregada)
          .map((inst, idx) => (
            <div
              key={`inst_${idx}`}
              className="flex items-start justify-between gap-3 text-xs pt-1 border-t border-gray-100"
            >
              <div className="space-y-0.5">
                <span className="font-medium text-gray-700 flex items-center gap-1">
                  🔧 {inst.nombre} <span className="text-gray-400">× {inst.cantidad}</span>
                </span>
                <span className="text-[10px] text-gray-400 block">Mano de obra técnica calificada</span>
              </div>
              <span className="font-semibold text-gray-700">
                {formatMxn(inst.totalSinIvaCentavos)}
              </span>
            </div>
          ))}
      </div>

      {/* Desglose Financiero */}
      {calculo && (
        <div className="border-t border-gray-100 pt-4 space-y-2 text-xs">
          {/* Subtotal bruto */}
          <div className="flex justify-between text-gray-600">
            <span>Subtotal sin IVA:</span>
            <span>{calculo.formato.subtotalBruto}</span>
          </div>

          {/* Descuento por Volumen (si aplica) */}
          {calculo.aplicaDescuentoVolumen && (
            <div className="flex justify-between text-emerald-700 font-semibold bg-emerald-50/80 p-2 rounded-xl">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> Descuento por Volumen ({calculo.porcentajeDescuentoVolumen}%):
              </span>
              <span>- {calculo.formato.descuentoVolumen}</span>
            </div>
          )}

          {/* Viáticos */}
          <div className="flex justify-between text-gray-600">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#7A1428]" /> Viáticos de traslado:
            </span>
            <span>
              {calculo.viaticosPorConfirmar ? (
                <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                  Por confirmar
                </span>
              ) : calculo.viaticosCentavos === 0 ? (
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                  Sin costo
                </span>
              ) : (
                calculo.formato.viaticos
              )}
            </span>
          </div>

          {/* IVA */}
          <div className="flex justify-between text-gray-600">
            <span>IVA (16% sobre base total):</span>
            <span>{calculo.formato.iva}</span>
          </div>

          {/* Total canónico */}
          <div className="flex justify-between items-baseline pt-2 border-t border-gray-200">
            <span className="font-black text-sm text-gray-900">Total con IVA:</span>
            <span className="font-black text-xl text-[#7A1428]">{calculo.formato.total}</span>
          </div>

          {/* Esquema diferido si no es contado */}
          {activePlan && activePlan.tipo !== "contado" && (
            <div className="mt-3 p-3 rounded-2xl bg-[#7A1428]/5 border border-[#7A1428]/20 space-y-1">
              <div className="flex justify-between text-xs font-bold text-[#7A1428]">
                <span>Pagas hoy ({activePlan.nombre}):</span>
                <span>{formatMxn(activePlan.montoPrimerPagoCentavos)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-gray-600">
                <span>Saldo pendiente:</span>
                <span>{formatMxn(activePlan.saldoRestanteCentavos)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Garantías y sellos de confianza */}
      <div className="pt-3 border-t border-gray-100 space-y-2 text-[11px] text-gray-500">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-[#7A1428]" />
          <span>Instalación en 48–72 horas después de confirmar tu pago</span>
        </div>
      </div>
    </div>
  );
}

