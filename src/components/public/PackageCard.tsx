"use client";

import Link from "next/link";
import { Package } from "@/types/catalog";
import { precioConIva, formatMxn } from "@/lib/pricing";
import { MessageCircle, Check, AlertTriangle, ArrowRight, Sparkles } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";
import { trackAnalyticsEvent } from "@/lib/analytics";

interface PackageCardProps {
  pkg: Package;
}

export function PackageCard({ pkg }: PackageCardProps) {
  const conIvaCentavos = precioConIva(pkg.precioSinIvaCentavos, 16);
  const formattedPrice = formatMxn(conIvaCentavos);

  const whatsappUrl = buildWhatsAppLink({
    producto: `Paquete ${pkg.nombre}`,
    precioConIva: pkg.revisarPrecio ? "Por confirmar" : formattedPrice,
    pagina: `/paquetes/${pkg.slug}`,
    tipoConsulta: pkg.revisarPrecio ? "cotizacion" : "compra",
  });

  const handleCtaClick = () => {
    trackAnalyticsEvent("Contact", {
      method: "package_card_whatsapp",
      package_slug: pkg.slug,
      package_name: pkg.nombre,
      price: pkg.revisarPrecio ? 0 : conIvaCentavos / 100,
    });
  };

  return (
    <div className="relative bg-white rounded-2xl border-2 border-[#7A1428]/20 hover:border-[#7A1428] shadow-xs hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden group">
      {/* Badge de Destacado / Más vendido */}
      {pkg.destacado && (
        <div className="bg-[#7A1428] text-white py-1 px-3 text-[10px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3 text-[#C9A15B]" />
          <span>Paquete Recomendado</span>
        </div>
      )}

      <div className="p-6 space-y-5 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <Link href={`/paquetes/${pkg.slug}`} className="block group-hover:text-[#7A1428] transition-colors">
            <h3 className="text-lg font-black text-gray-900 tracking-tight">{pkg.nombre}</h3>
          </Link>
          <p className="text-xs text-gray-600 leading-relaxed">{pkg.descripcion}</p>

          {/* Viñetas Qué Incluye */}
          {pkg.queIncluye && pkg.queIncluye.length > 0 && (
            <div className="pt-3 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                Incluye:
              </span>
              <ul className="space-y-1.5 text-xs text-gray-700">
                {pkg.queIncluye.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-[#C9A15B] shrink-0 mt-0.5" />
                    <span className="leading-tight">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Precios y Botón */}
        <div className="pt-4 border-t border-gray-100 space-y-3">
          {pkg.revisarPrecio ? (
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Precio por confirmar</span>
              </div>
              <p className="text-[11px] text-gray-400">Solicita precio especial para flotilla</p>
            </div>
          ) : (
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                Inversión Total
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-gray-900">{formattedPrice}</span>
                <span className="text-xs font-semibold text-gray-500 uppercase">con IVA</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleCtaClick}
              className={`flex-1 py-3 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                pkg.revisarPrecio
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-[#7A1428] hover:bg-[#4A0C18] text-white"
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#C9A15B]" />
              <span>{pkg.revisarPrecio ? "Cotizar Paquete" : "Comprar / Cotizar"}</span>
            </a>

            <Link
              href={`/paquetes/${pkg.slug}`}
              className="p-3 rounded-xl border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              title="Ver detalles del paquete"
            >
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

