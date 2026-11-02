"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/types/catalog";
import { SolutionTier } from "@/lib/services/solutions-service";
import { useCart } from "@/context/CartContext";
import { formatMxn, precioConIva } from "@/lib/pricing";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";
import { Check, ShoppingBag, ArrowRight, MessageCircle, AlertTriangle, Sparkles } from "lucide-react";

interface SolutionTierCardProps {
  tier: SolutionTier;
  product?: Product | null;
  solucionTitulo: string;
}

export function SolutionTierCard({ tier, product, solucionTitulo }: SolutionTierCardProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  if (!product) {
    return null;
  }

  const conIvaCentavos = precioConIva(product.precioSinIvaCentavos, 16);
  const formattedPrice = formatMxn(conIvaCentavos);

  const whatsappUrl = buildWhatsAppLink({
    equipo: `${solucionTitulo} - Nivel ${tier.nivel} (${product.nombreComercial})`,
    precioConIva: product.revisarPrecio ? undefined : formattedPrice,
    pagina: `/soluciones`,
    tipoConsulta: product.revisarPrecio ? "cotizacion" : "asesoria",
  });

  const handleAddToCart = async () => {
    try {
      setAdding(true);
      await addItem({
        id: product.slug,
        tipo: "producto",
        nombre: `${tier.nivel}: ${product.nombreComercial}`,
        categoria: product.categoria,
        precioSinIvaCentavos: product.precioSinIvaCentavos,
        cantidad: 1,
        esEquipoPrincipal: product.esEquipoPrincipal ?? true,
        incluyeInstalacion: product.incluyeInstalacion ?? true,
        incluyePlanPrimerAnio: product.incluyePlanPrimerAnio ?? true,
      });
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch (e) {
      console.error("Error agregando solución al carrito:", e);
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    try {
      setAdding(true);
      await addItem({
        id: product.slug,
        tipo: "producto",
        nombre: `${tier.nivel}: ${product.nombreComercial}`,
        categoria: product.categoria,
        precioSinIvaCentavos: product.precioSinIvaCentavos,
        cantidad: 1,
        esEquipoPrincipal: product.esEquipoPrincipal ?? true,
        incluyeInstalacion: product.incluyeInstalacion ?? true,
        incluyePlanPrimerAnio: product.incluyePlanPrimerAnio ?? true,
      });
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
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7A1428] text-white text-[11px] font-bold uppercase tracking-wider shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#C9A15B]" />
          <span>Opción Más Elegida</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Encabezado del Nivel */}
        <div>
          <span
            className={`text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-lg inline-block ${
              tier.destacado
                ? "bg-[#7A1428]/10 text-[#7A1428]"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Nivel {tier.nivel}
          </span>
          <h3 className="text-xl font-black text-gray-900 tracking-tight mt-2">
            {tier.titulo}
          </h3>
          <p className="text-xs text-gray-500 font-medium leading-relaxed mt-1">
            {tier.subtitulo}
          </p>
        </div>

        {/* Precio */}
        <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100">
          {product.revisarPrecio ? (
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Precio por confirmar</span>
              </div>
              <p className="text-[11px] text-gray-500">Solicita cotización formal a tu asesor</p>
            </div>
          ) : (
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                Inversión Total Llave en Mano
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-gray-900">
                  {formattedPrice}
                </span>
                <span className="text-xs font-bold text-gray-500 uppercase">con IVA</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                ✓ Equipo + Instalación + 1er año de plataforma
              </span>
            </div>
          )}
        </div>

        {/* Lo que incluye */}
        <div className="space-y-2 pt-1">
          <span className="text-[11px] uppercase font-bold text-gray-400 tracking-wider block">
            ¿Qué incluye esta opción?
          </span>
          <ul className="space-y-2">
            {tier.incluye.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-gray-700">
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span className="leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="pt-6 mt-6 border-t border-gray-100 space-y-2.5">
        {product.revisarPrecio ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            aria-label={`Cotizar ${tier.titulo} por WhatsApp`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Cotizar Nivel {tier.nivel} por WhatsApp</span>
          </a>
        ) : (
          <>
            <div className="flex items-center gap-2">
              {/* Botón Comprar Ahora (va directo a checkout) */}
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={adding}
                className="flex-1 py-3 px-3 bg-[#7A1428] hover:bg-[#4A0C18] text-white font-bold text-xs rounded-xl shadow-sm transition-all hover:scale-[1.01] flex items-center justify-center gap-1.5 cursor-pointer"
                aria-label={`Comprar ahora opción ${tier.titulo}`}
              >
                <span>{adding ? "Procesando..." : "Comprar Ahora"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* Botón Agregar al Carrito */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={adding}
                className="py-3 px-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                title="Agregar al carrito"
                aria-label={`Agregar ${tier.titulo} al carrito`}
              >
                <ShoppingBag className="w-4 h-4 text-[#7A1428]" />
                <span className="hidden sm:inline">{added ? "¡Agregado!" : "Agregar"}</span>
              </button>
            </div>

            {/* Asesoría por WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 px-3 text-center text-xs font-semibold text-gray-600 hover:text-[#7A1428] hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              aria-label={`Solicitar asesoría por WhatsApp sobre ${tier.titulo}`}
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
              <span>Asesoría por WhatsApp</span>
            </a>
          </>
        )}
      </div>
    </div>
  );
}
