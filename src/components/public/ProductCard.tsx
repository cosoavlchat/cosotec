"use client";

import Link from "next/link";
import { Product } from "@/types/catalog";
import { precioConIva, formatMxn } from "@/lib/pricing";
import { DevicePlaceholder } from "./DevicePlaceholder";
import { MessageCircle, AlertTriangle, ArrowRight, ShieldCheck } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";
import { trackAnalyticsEvent } from "@/lib/analytics";

interface ProductCardProps {
  product: Product;
  msiOptions?: number[]; // Array de plazos MSI (si está vacío, no se muestra)
}

export function ProductCard({ product, msiOptions = [] }: ProductCardProps) {
  const conIvaCentavos = precioConIva(product.precioSinIvaCentavos, 16);
  const formattedPrice = formatMxn(conIvaCentavos);

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
    <div className="bg-white rounded-2xl border border-gray-200/80 hover:border-[#7A1428]/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group">
      {/* Visual Header / Placeholder */}
      <div className="relative p-4 bg-gray-50/50">
        <Link href={`/p/${product.slug}`} className="block">
          {product.imagenes && product.imagenes.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imagenes[0]}
              alt={product.nombreComercial}
              className="w-full h-44 object-contain rounded-xl"
            />
          ) : (
            <DevicePlaceholder
              category={product.categoria}
              title={product.nombreComercial}
              size="md"
            />
          )}
        </Link>

        {/* Badges superiores */}
        <div className="absolute top-6 left-6 flex flex-wrap gap-1.5">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/95 text-gray-800 border border-gray-200 shadow-xs">
            {product.categoria}
          </span>
          {product.esEquipoPrincipal && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#7A1428] text-white">
              Principal
            </span>
          )}
          {product.incluyeInstalacion && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-700 text-white shadow-xs">
              Instalación Inc.
            </span>
          )}
        </div>
      </div>

      {/* Body Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-1.5">
          <Link href={`/p/${product.slug}`} className="block group-hover:text-[#7A1428] transition-colors">
            <h3 className="text-base font-bold text-gray-900 tracking-tight leading-snug">
              {product.nombreComercial}
            </h3>
          </Link>
          {product.modelo && (
            <p className="text-xs font-mono text-gray-500">Modelo: {product.modelo}</p>
          )}
          {product.descripcionCorta && (
            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed pt-1">
              {product.descripcionCorta}
            </p>
          )}

          {/* Características clave de inclusión */}
          {(product.incluyeInstalacion || product.incluyePlanPrimerAnio) && (
            <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-gray-600">
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
        <div className="pt-3 border-t border-gray-100 space-y-2">
          {product.revisarPrecio ? (
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Precio por confirmar</span>
              </div>
              <p className="text-[11px] text-gray-400">Solicita cotización personalizada a tu asesor</p>
            </div>
          ) : product.precioSinIvaCentavos === 0 ? (
            <div className="space-y-1">
              <span className="text-sm font-bold text-gray-700">Cotización a medida</span>
              <p className="text-[11px] text-gray-400">Equipos de grado empresarial</p>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-gray-900">{formattedPrice}</span>
                <span className="text-[11px] font-semibold text-gray-500 uppercase">con IVA</span>
              </div>
              {cuotaMsi && plazoMaximoMsi && (
                <p className="text-[11px] font-semibold text-emerald-700">
                  o desde {cuotaMsi}/mes a {plazoMaximoMsi} MSI
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleCtaClick}
              className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs ${
                product.revisarPrecio
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-[#7A1428] hover:bg-[#4A0C18] text-white"
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{product.revisarPrecio ? "Cotizar por WhatsApp" : "Comprar / Cotizar"}</span>
            </a>

            <Link
              href={`/p/${product.slug}`}
              className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              title="Ver ficha completa"
            >
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

