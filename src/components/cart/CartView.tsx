"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatMxn } from "@/lib/pricing";
import {
  Trash2,
  Plus,
  Minus,
  RotateCcw,
  AlertCircle,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
  Tag,
  CheckCircle2,
  X,
  MessageCircle,
} from "lucide-react";

interface CartViewProps {
  showCheckoutButton?: boolean;
  onCheckoutClick?: () => void;
  compact?: boolean;
}

export function CartView({
  showCheckoutButton = true,
  onCheckoutClick,
  compact = false,
}: CartViewProps) {
  const {
    cart,
    items,
    calculo,
    maxUnidadesPorItem,
    removeItem,
    removeGroup,
    updateQuantity,
    undoDelete,
    dismissUndo,
    clearCart,
    lastDeleted,
    isSaving,
  } = useCart();

  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const isLocked = Boolean(cart?.isQuoteSnapshot || cart?.quoteFolio);

  // Agrupar items por grupoId
  const groups: { [key: string]: { nombre: string; items: typeof items } } = {};
  const standaloneItems: typeof items = [];

  for (const it of items) {
    if (it.grupoId) {
      if (!groups[it.grupoId]) {
        groups[it.grupoId] = {
          nombre: it.grupoNombre || "Nivel de Solución",
          items: [],
        };
      }
      groups[it.grupoId].items.push(it);
    } else {
      standaloneItems.push(it);
    }
  }

  // Estado vacío
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12 px-4 space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center text-gray-400">
          <Package className="w-10 h-10 stroke-[1.5]" />
        </div>
        <div className="space-y-2 max-w-sm">
          <h3 className="text-xl font-black text-gray-900">Tu carrito está vacío</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Aún no has seleccionado ningún equipo GPS o paquete de telemetría. Explora nuestras soluciones diseñadas para tu tipo de unidad.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <Link
            href="/soluciones"
            onClick={onCheckoutClick}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#7A1428] text-white text-xs font-bold hover:bg-[#4A0C18] transition-all shadow-xs"
          >
            Ver Soluciones
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/tienda"
            onClick={onCheckoutClick}
            className="flex-1 inline-flex items-center justify-center px-4 py-3 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-all"
          >
            Ver Tienda
          </Link>
        </div>

        {/* Banner de Deshacer si se acaba de vaciar */}
        {lastDeleted && (
          <div className="w-full max-w-md mt-4 p-3 rounded-xl bg-gray-900 text-white flex items-center justify-between text-xs shadow-lg animate-in fade-in slide-in-from-bottom-2">
            <span className="truncate pr-2">
              {lastDeleted.nombre} ({lastDeleted.items.length}{" "}
              {lastDeleted.items.length === 1 ? "producto" : "productos"}) eliminado
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={undoDelete}
                className="px-2.5 py-1 rounded bg-[#C9A15B] hover:bg-[#d8af65] text-gray-950 font-bold text-[11px] flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Deshacer
              </button>
              <button
                type="button"
                onClick={dismissUndo}
                aria-label="Cerrar aviso"
                className="p-1 text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast / Banner Flotante para Deshacer Eliminación */}
      {lastDeleted && (
        <div className="sticky top-2 z-30 p-3 rounded-xl bg-gray-900 text-white flex items-center justify-between text-xs shadow-xl border border-gray-800 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 truncate pr-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <span className="truncate">
              {lastDeleted.tipo === "group" ? "Nivel eliminado" : "Producto eliminado"}:{" "}
              <strong>{lastDeleted.nombre}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={undoDelete}
              className="px-3 py-1 rounded-lg bg-[#C9A15B] hover:bg-[#b8914b] text-gray-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Deshacer
            </button>
            <button
              type="button"
              onClick={dismissUndo}
              aria-label="Cerrar aviso de deshacer"
              className="p-1 rounded-md text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Candado de Snapshot para Cotización de Asesor */}
      {isLocked && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 text-xs">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-950">
              Esta compra corresponde a la cotización {cart?.quoteFolio || ""}; para cambios contacta a tu asesor.
            </p>
            <p className="text-amber-800 text-[11px] leading-relaxed">
              Los productos, descuentos y viáticos están fijados según tu propuesta personalizada vigente.
            </p>
          </div>
        </div>
      )}

      {/* Cabecera con Botón de Vaciar Carrito */}
      {!isLocked && (
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <span className="text-xs font-semibold text-gray-500">
            {items.reduce((sum, i) => sum + i.cantidad, 0)} {items.reduce((sum, i) => sum + i.cantidad, 0) === 1 ? "artículo" : "artículos"} en total
          </span>

          {!confirmClearOpen ? (
            <button
              type="button"
              onClick={() => setConfirmClearOpen(true)}
              className="text-xs font-semibold text-gray-500 hover:text-red-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Vaciar carrito
            </button>
          ) : (
            <div className="flex items-center gap-2 text-xs bg-red-50 text-red-900 px-3 py-1.5 rounded-lg border border-red-200 animate-in fade-in">
              <span className="font-medium text-[11px]">¿Confirmas vaciar todo?</span>
              <button
                type="button"
                onClick={async () => {
                  await clearCart();
                  setConfirmClearOpen(false);
                }}
                className="px-2 py-0.5 bg-red-700 text-white rounded font-bold text-[11px] hover:bg-red-800 transition-colors cursor-pointer"
              >
                Sí, vaciar
              </button>
              <button
                type="button"
                onClick={() => setConfirmClearOpen(false)}
                className="px-2 py-0.5 border border-red-300 rounded font-semibold text-[11px] hover:bg-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Lista de Grupos de Soluciones */}
      {Object.entries(groups).map(([grupoId, groupData]) => (
        <div
          key={grupoId}
          className="rounded-2xl border-2 border-[#7A1428]/20 bg-linear-to-b from-white to-gray-50/50 p-4 space-y-3.5 shadow-xs"
        >
          {/* Header del Nivel de Solución */}
          <div className="flex items-center justify-between border-b border-gray-200/70 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#7A1428]/10 text-[#7A1428] flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#7A1428] block">
                  Nivel de Solución
                </span>
                <h4 className="font-black text-xs sm:text-sm text-gray-900">
                  {groupData.nombre}
                </h4>
              </div>
            </div>

            {!isLocked && (
              <button
                type="button"
                onClick={() => removeGroup(grupoId)}
                aria-label={`Eliminar nivel completo ${groupData.nombre}`}
                className="text-[11px] font-bold text-red-700 hover:text-red-900 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Eliminar nivel</span>
              </button>
            )}
          </div>

          {/* Renglones de Productos del Grupo */}
          <div className="space-y-3 divide-y divide-gray-100">
            {groupData.items.map((it) => (
              <ItemRow
                key={`${it.id}_${grupoId}`}
                item={it}
                isLocked={isLocked}
                maxUnidades={maxUnidadesPorItem}
                onUpdateQuantity={(cant) => updateQuantity(it.id, cant, it.grupoId)}
                onRemove={() => removeItem(it.id, it.grupoId)}
                compact={compact}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Lista de Items Individuales (sin grupo) */}
      {standaloneItems.length > 0 && (
        <div className="rounded-2xl border border-gray-200/90 bg-white p-4 space-y-3.5 shadow-xs">
          {Object.keys(groups).length > 0 && (
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2">
              Productos y Accesorios Individuales
            </h4>
          )}
          <div className="space-y-3 divide-y divide-gray-100">
            {standaloneItems.map((it) => (
              <ItemRow
                key={it.id}
                item={it}
                isLocked={isLocked}
                maxUnidades={maxUnidadesPorItem}
                onUpdateQuantity={(cant) => updateQuantity(it.id, cant)}
                onRemove={() => removeItem(it.id)}
                compact={compact}
              />
            ))}
          </div>
        </div>
      )}

      {/* Mano de obra de instalación agregada automáticamente */}
      {calculo?.lineasCalculadas
        ?.filter((l) => l.esInstalacionAgregada)
        .map((inst, idx) => (
          <div
            key={`calc_inst_${idx}`}
            className="flex items-center justify-between text-xs px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200/70"
          >
            <div className="space-y-0.5">
              <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                🔧 {inst.nombre} <span className="text-gray-400">× {inst.cantidad}</span>
              </span>
              <span className="text-[10px] text-gray-500 block">
                Mano de obra técnica calificada de instalación
              </span>
            </div>
            <span className="font-bold text-gray-800">
              {formatMxn(inst.totalSinIvaCentavos)}
            </span>
          </div>
        ))}

      {/* Desglose de Totales y Recálculo Automático */}
      <div className="rounded-2xl bg-gray-50/80 border border-gray-200/80 p-4 space-y-2.5 text-xs">
        <div className="flex items-center justify-between text-gray-600">
          <span>Subtotal productos e instalación:</span>
          <span className="font-semibold text-gray-900">
            {formatMxn(calculo?.subtotalBrutoCentavos || 0)}
          </span>
        </div>

        {/* Descuento por Volumen (>= 6 unidades) */}
        {Boolean(calculo?.descuentoVolumenCentavos && calculo.descuentoVolumenCentavos > 0) && (
          <div className="flex items-center justify-between text-emerald-800 font-medium bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
            <span className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-700" />
              Descuento por volumen ({calculo?.porcentajeDescuentoVolumen}%):
            </span>
            <span className="font-bold">
              -{formatMxn(calculo?.descuentoVolumenCentavos || 0)}
            </span>
          </div>
        )}

        {/* Viáticos */}
        {Boolean(calculo?.viaticosCentavos && calculo.viaticosCentavos > 0) && (
          <div className="flex items-center justify-between text-gray-600">
            <span>Viáticos de instalación:</span>
            <span className="font-semibold text-gray-900">
              {formatMxn(calculo?.viaticosCentavos || 0)}
            </span>
          </div>
        )}

        {/* IVA */}
        <div className="flex items-center justify-between text-gray-600">
          <span>IVA (16%):</span>
          <span className="font-semibold text-gray-900">
            {formatMxn(calculo?.ivaCentavos || 0)}
          </span>
        </div>

        {/* Total Final */}
        <div className="pt-2 border-t border-gray-200/80 flex items-baseline justify-between">
          <div>
            <span className="font-black text-sm text-gray-900 block">Total con IVA</span>
            <span className="text-[10px] text-gray-500 font-medium">Moneda Nacional MXN</span>
          </div>
          <span className="text-xl sm:text-2xl font-black text-[#7A1428] tracking-tight">
            {formatMxn(calculo?.totalCentavos || 0)}
          </span>
        </div>
      </div>

      {/* Botón de Checkout CTA */}
      {showCheckoutButton && (
        <div className="pt-2">
          <Link
            href="/checkout"
            onClick={onCheckoutClick}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[#7A1428] hover:bg-[#4A0C18] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all hover:scale-[1.01] cursor-pointer"
          >
            <span>Continuar al Checkout</span>
            <ArrowRight className="w-4 h-4 text-[#C9A15B]" />
          </Link>
          <div className="flex items-center justify-center gap-3 mt-3 text-[11px] text-gray-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Compra protegida SSL
            </span>
            <span>·</span>
            <span>Facturación CFDI 4.0</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponente de Renglón de Producto
interface ItemRowProps {
  item: {
    id: string;
    nombre: string;
    categoria?: string;
    tipo?: string;
    precioSinIvaCentavos: number;
    cantidad: number;
    incluyeInstalacion?: boolean;
    incluyePlanPrimerAnio?: boolean;
  };
  isLocked: boolean;
  maxUnidades: number;
  onUpdateQuantity: (cant: number) => void;
  onRemove: () => void;
  compact?: boolean;
}

function ItemRow({
  item,
  isLocked,
  maxUnidades,
  onUpdateQuantity,
  onRemove,
  compact = false,
}: ItemRowProps) {
  const lineTotal = item.precioSinIvaCentavos * item.cantidad;

  return (
    <div className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
      <div className="space-y-1 flex-1 pr-2">
        <div className="font-bold text-gray-900 leading-snug">
          {item.nombre}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
          <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-semibold uppercase">
            {item.categoria || item.tipo}
          </span>
          {item.incluyeInstalacion === false && (
            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-medium border border-amber-200">
              + Instalación separada
            </span>
          )}
          {item.incluyePlanPrimerAnio && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-medium">
              1er año plataforma inc.
            </span>
          )}
        </div>
        <div className="text-[11px] text-gray-500 font-medium">
          {formatMxn(item.precioSinIvaCentavos)} s/IVA c/u
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
        {/* Controles de Cantidad − / + y campo numérico */}
        {!isLocked ? (
          <div className="flex items-center gap-1 border border-gray-300 rounded-lg bg-white p-0.5">
            <button
              type="button"
              onClick={() => onUpdateQuantity(item.cantidad - 1)}
              aria-label={`Disminuir cantidad de ${item.nombre}`}
              className="w-7 h-7 flex items-center justify-center rounded text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer"
            >
              {item.cantidad === 1 ? (
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
              ) : (
                <Minus className="w-3.5 h-3.5" />
              )}
            </button>

            <input
              type="number"
              min="1"
              max={maxUnidades}
              value={item.cantidad}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (isNaN(val)) return;
                onUpdateQuantity(val);
              }}
              aria-label={`Cantidad de ${item.nombre}`}
              className="w-10 text-center font-bold text-gray-900 text-xs py-0.5 border-0 focus:ring-0 focus:outline-none"
            />

            <button
              type="button"
              disabled={item.cantidad >= maxUnidades}
              onClick={() => onUpdateQuantity(item.cantidad + 1)}
              aria-label={`Aumentar cantidad de ${item.nombre}`}
              className="w-7 h-7 flex items-center justify-center rounded text-gray-600 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <span className="font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded">
            × {item.cantidad}
          </span>
        )}

        {/* Precio Total de la Línea */}
        <div className="text-right min-w-[70px]">
          <span className="font-black text-gray-900 block text-xs sm:text-sm">
            {formatMxn(lineTotal)}
          </span>
          <span className="text-[10px] text-gray-400">s/IVA</span>
        </div>

        {/* Botón de Borrar con ícono de bote y aria-label */}
        {!isLocked && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Eliminar ${item.nombre} del carrito`}
            className="p-1.5 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

