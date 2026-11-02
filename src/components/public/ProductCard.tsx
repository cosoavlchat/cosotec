"use client";

import Link from "next/link";
import { Product } from "@/types/catalog";
import { precioConIva, formatMxn } from "@/lib/pricing";
import { DevicePlaceholder } from "./DevicePlaceholder";
import { MessageCircle, AlertTriangle, ArrowRight, ShieldCheck } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { getProductImage } from "@/lib/catalog/product-image";

interface ProductCardProps {
  product: Product;
  msiOptions?: number[]; // Array de plazos MSI (si está vacío, no se muestra)
}

export function ProductCard({ product, msiOptions = [] }: ProductCardProps) {
  const conIvaCentavos = precioConIva(product.precioSinIvaCentavos, 16);
  const formattedPrice = formatMxn(conIvaCentavos);
  const imageUrl = getProductImage(product);

  // REGLA 4: Solo calcular cuota mensual si hay plazos MSI configurados
  const plazoMaximoMsi = msiOptions && msiOptions.length > 0 ? Math.max(...msiOptions) : null;
  const cuotaMsi = plazoMaximoMsi ? formatMxn(Math.round(conIvaCentavos / plazoMaximoMsi)) : null;

  // REGLA 6: Botón a WhatsApp mientras no haya checkout
  const whatsappUrl = buildWhatsAppLink({
    producto: product.nombreComercial,
    modelo: product.modelo,
    precioConIva: product.revisarPrecio ? undefined : formattedPrice,
    pagina: `/p/${product.slug}`,
    tipoConsulta: product.revisarPrecio ? "cotizacion" : "compra",
  });

  const handleCtaClick = () => {
    trackAnalyticsEvent("Contact", {
      method: "product_card_whatsapp",
      product_slug: product.slug,
      product_name: product.nombreComercial,
      price: product.revisarPrecio ? 0 : conIvaCentavos / 100,
    });
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200/80 hover:border-[#7A1428]/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group">
      {/* Visual Header / Imagen de Producto */}
      <div className="relative p-2.5 sm:p-4 bg-gray-50/60">
        <Link href={`/p/${product.slug}`} className="block overflow-hidden">
          <img
            src={imageUrl}
            alt={product.nombreComercial}
            className="w-full h-28 sm:h-44 object-contain rounded-lg sm:rounded-xl transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* Badges superiores compactos */}
        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 flex flex-wrap gap-1 sm:gap-1.5">
          <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-white/95 text-gray-800 border border-gray-200 shadow-xs">
            {product.categoria}
          </span>
          {product.esEquipoPrincipal && (
            <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-[#7A1428] text-white">
              Principal
            </span>
          )}
          {product.incluyeInstalacion && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-700 text-white shadow-xs">
              Instalación Inc.
            </span>
          )}
        </div>
      </div>

      {/* Body Content */}
      <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between space-y-2.5 sm:space-y-4">
        <div className="space-y-1 sm:space-y-1.5">
          <Link href={`/p/${product.slug}`} className="block group-hover:text-[#7A1428] transition-colors">
            <h3 className="text-xs sm:text-base font-bold text-gray-900 tracking-tight leading-snug line-clamp-2">
              {product.nombreComercial}
            </h3>
          </Link>
          {product.modelo && (
            <p className="text-[10px] sm:text-xs font-mono text-gray-400">Modelo: {product.modelo}</p>
          )}
          {product.descripcionCorta && (
            <p className="hidden sm:block text-xs text-gray-600 line-clamp-2 leading-relaxed pt-1">
              {product.descripcionCorta}
            </p>
          )}

          {/* Características clave de inclusión en desktop */}
          {(product.incluyeInstalacion || product.incluyePlanPrimerAnio) && (
            <div className="hidden sm:flex pt-1 flex-wrap gap-2 text-[11px] text-gray-600">
              {product.incluyeInstalacion && (
                <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md font-medium">
                  ✓ Instalación profesional
                </span>
              )}
              {product.incluyePlanPrimerAnio && (
                <span className="inline-flex items-center gap-1 text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md font-medium">
                  ✓ Primer año de plataforma y datos
                </span>
              )}
            </div>
          )}
        </div>

        {/* Precios y Estado */}
        <div className="pt-2 sm:pt-3 border-t border-gray-100 space-y-1.5 sm:space-y-2">
          {product.revisarPrecio ? (
            <div className="space-y-0.5">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[10px] sm:text-xs font-bold">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span className="truncate">Por confirmar</span>
              </div>
              <p className="text-[10px] text-gray-400 hidden sm:block">Solicita cotización personalizada a tu asesor</p>
            </div>
          ) : product.precioSinIvaCentavos === 0 ? (
            <div className="space-y-0.5">
              <span className="text-xs sm:text-sm font-bold text-gray-700">Cotización a medida</span>
              <p className="text-[10px] text-gray-400 hidden sm:block">Equipos de grado empresarial</p>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-sm sm:text-xl font-black text-gray-900">{formattedPrice}</span>
                <span className="text-[9px] sm:text-[11px] font-semibold text-gray-500 uppercase">IVA inc.</span>
              </div>
              {cuotaMsi && plazoMaximoMsi && (
                <p className="text-[10px] sm:text-[11px] font-semibold text-emerald-700 truncate">
                  desde {cuotaMsi}/mes
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-1.5 flex items-center gap-1.5 sm:gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleCtaClick}
              className={`flex-1 py-2 sm:py-2.5 px-2 sm:px-3 text-[11px] sm:text-xs font-bold rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-1 shadow-xs ${
                product.revisarPrecio
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-[#7A1428] hover:bg-[#4A0C18] text-white"
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5 shrink-0 hidden xs:inline" />
              <span className="truncate">{product.revisarPrecio ? "Cotizar" : "Comprar"}</span>
            </a>

            <Link
              href={`/p/${product.slug}`}
              className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors shrink-0"
              title="Ver ficha completa"
            >
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

