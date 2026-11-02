"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/types/catalog";
import { SolutionTier } from "@/lib/services/solutions-service";
import { useCart } from "@/context/CartContext";
import { formatMxn, precioConIva } from "@/lib/pricing";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";
import { Check, ShoppingBag, ArrowRight, MessageCircle, AlertTriangle, Sparkles, PackageCheck } from "lucide-react";

interface SolutionTierCardProps {
  tier: SolutionTier;
  products: Product[];
  solucionTitulo: string;
}

export function SolutionTierCard({ tier, products, solucionTitulo }: SolutionTierCardProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  if (!products || products.length === 0) {
    return null;
  }

  // Precios calculados dinámicamente de la suma de productos
  const totalSinIvaCentavos = products.reduce((acc, p) => acc + (p.precioSinIvaCentavos || 0), 0);
  const conIvaCentavos = precioConIva(totalSinIvaCentavos, 16);
  const formattedPrice = formatMxn(conIvaCentavos);
  const formattedSinIva = formatMxn(totalSinIvaCentavos);

  // Si algún producto tiene revisarPrecio, se inhabilita compra directa
  const hasRevisarPrecio = products.some((p) => p.revisarPrecio);

  // Viñetas reales extraídas únicamente del "queIncluye" oficial de los productos que componen el nivel
  const queIncluyeUnificado = Array.from(
    new Set(
      products.flatMap((p) => p.queIncluye || [])
    )
  );

  const nombresProductos = products.map((p) => p.nombreComercial).join(" + ");

  const whatsappUrl = buildWhatsAppLink({
    equipo: `${solucionTitulo} - Nivel ${tier.nivel}: ${nombresProductos}`,
    precioConIva: hasRevisarPrecio ? undefined : formattedPrice,
    pagina: `/soluciones`,
    tipoConsulta: hasRevisarPrecio ? "cotizacion" : "asesoria",
  });

  const addAllToCart = async () => {
    for (const p of products) {
      await addItem({
        id: p.slug,
        tipo: "producto",
        nombre: p.nombreComercial,
        categoria: p.categoria,
        precioSinIvaCentavos: p.precioSinIvaCentavos,
        cantidad: 1,
        esEquipoPrincipal: p.esEquipoPrincipal ?? true,
        incluyeInstalacion: p.incluyeInstalacion ?? true,
        incluyePlanPrimerAnio: p.incluyePlanPrimerAnio ?? true,
      });
    }
  };

  const handleAddToCart = async () => {
    if (hasRevisarPrecio) return;
    try {
      setAdding(true);
      await addAllToCart();
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch (e) {
      console.error("Error agregando solución al carrito:", e);
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (hasRevisarPrecio) return;
    try {
      setAdding(true);
      await addAllToCart();
      router.push("/checkout");
    } catch (e) {
      console.error("Error procediendo a checkout:", e);
      setAdding(false);
    }
  };

  return (
    <div
      className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all ${
        tier.destacado
          ? "bg-white border-2 border-[#7A1428] shadow-xl ring-4 ring-[#7A1428]/5"
          : "bg-white border border-gray-200/90 shadow-xs hover:shadow-md"
      }`}
    >
      {tier.destacado && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-[#7A1428] text-white text-[10px] font-extrabold uppercase tracking-widest shadow-md flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#C9A15B]" />
          <span>Configuración Recomendada</span>
        </div>
      )}

      <div className="space-y-5">
        {/* Encabezado del Nivel */}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                tier.destacado ? "bg-[#7A1428]/10 text-[#7A1428]" : "bg-gray-100 text-gray-700"
              }`}
            >
              Nivel {tier.nivel}
            </span>
            {products.length > 1 && (
              <span className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                {products.length} componentes
              </span>
            )}
          </div>
          <h3 className="text-xl font-black text-gray-900 tracking-tight leading-snug pt-1">
            {tier.titulo}
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed">{tier.subtitulo}</p>
        </div>

        {/* Productos que Componen este Nivel (Suma acumulativa) */}
        <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200/70 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
            Equipamiento incluido:
          </span>
          <div className="space-y-1.5">
            {products.map((p, idx) => (
              <div key={p.slug} className="flex items-start gap-2 text-xs">
                <span className="w-4 h-4 rounded-full bg-[#7A1428]/10 text-[#7A1428] flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">
                  {idx === 0 ? "1" : "+"}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-gray-900 block truncate">{p.nombreComercial}</span>
                  <span className="text-[10px] text-gray-500 block">
                    {formatMxn(precioConIva(p.precioSinIvaCentavos, 16))} IVA inc.
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Precio Sumado del Nivel */}
        <div className="pt-1 border-t border-gray-100">
          {hasRevisarPrecio ? (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Precio por Confirmar</span>
              </div>
              <p className="text-[11px] text-amber-700 leading-snug">
                El precio de este equipo está en validación final por nuestro equipo técnico.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-900 tracking-tight">{formattedPrice}</span>
                <span className="text-xs text-gray-500 font-semibold">con IVA</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-400 font-medium">{formattedSinIva} sin IVA</span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                  Instalación profesional incluida
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Viñetas Oficiales (Extraídas del queIncluye de cada producto) */}
        <div className="space-y-2 pt-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block">
            Alcance y suministros:
          </span>
          <ul className="space-y-2 text-xs text-gray-600">
            {queIncluyeUnificado.slice(0, 6).map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <Check className="w-3.5 h-3.5 text-[#7A1428] shrink-0 mt-0.5 stroke-[2.5]" />
                <span className="leading-tight text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="pt-6 space-y-2 border-t border-gray-100 mt-6">
        {hasRevisarPrecio ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            aria-label={`Cotizar ${tier.titulo} por WhatsApp`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Cotizar Nivel {tier.nivel} por WhatsApp</span>
          </a>
        ) : (
          <>
            <div className="flex items-center gap-2">
              {/* Comprar Ahora: Agrega todos los productos y va a checkout */}
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={adding}
                className="flex-1 py-3.5 px-4 bg-[#7A1428] hover:bg-[#4A0C18] text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
                aria-label={`Comprar ahora nivel ${tier.nivel}`}
              >
                <PackageCheck className="w-4 h-4" />
                <span>{adding ? "Configurando..." : `Comprar Nivel ${tier.nivel}`}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>

              {/* Agregar al Carrito */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={adding}
                className={`p-3.5 rounded-xl border transition-colors flex items-center justify-center cursor-pointer shrink-0 ${
                  added
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                    : "border-gray-200 text-gray-700 hover:text-[#7A1428] hover:bg-gray-50"
                }`}
                title={added ? "¡Agregado al carrito!" : "Agregar al carrito"}
                aria-label={`Agregar nivel ${tier.nivel} al carrito`}
              >
                {added ? <Check className="w-4 h-4 stroke-[3]" /> : <ShoppingBag className="w-4 h-4" />}
              </button>
            </div>

            {/* Asesoría WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-3 bg-white border border-gray-200 hover:border-[#25D366] text-gray-700 hover:text-[#25D366] font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
              aria-label={`Asesoría para nivel ${tier.nivel}`}
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
              <span>Asesoría por WhatsApp sobre este nivel</span>
            </a>
          </>
        )}
      </div>
    </div>
  );
}
