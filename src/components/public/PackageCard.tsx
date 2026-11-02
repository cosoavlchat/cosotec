"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package } from "@/types/catalog";
import { precioConIva, formatMxn, getQueIncluyeComputed } from "@/lib/pricing";
import { MessageCircle, Check, AlertTriangle, ArrowRight, Sparkles, ShoppingCart } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { useCart } from "@/context/CartContext";

interface PackageCardProps {
  pkg: Package;
}

function getPackageImage(pkg: Package): string {
  if (pkg.imagenes && pkg.imagenes.length > 0 && pkg.imagenes[0]) {
    return pkg.imagenes[0];
  }
  const slug = (pkg.slug || "").toLowerCase();
  if (slug.includes("jammer")) return "/products/antijammer.webp";
  if (slug.includes("flotilla") || slug.includes("tracto")) return "/solutions/tractocamion.webp";
  if (slug.includes("dashcam") || slug.includes("camara")) return "/products/dashcam.webp";
  if (slug.includes("moto")) return "/products/gps-moto.webp";
  if (slug.includes("caja")) return "/solutions/caja-refrigerada.webp";
  return "/products/gps-standard.webp";
}

export function PackageCard({ pkg }: PackageCardProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const conIvaCentavos = precioConIva(pkg.precioSinIvaCentavos, 16);
  const formattedPrice = formatMxn(conIvaCentavos);

  const whatsappUrl = buildWhatsAppLink({
    producto: `Paquete ${pkg.nombre}`,
    precioConIva: pkg.revisarPrecio ? undefined : formattedPrice,
    pagina: `/paquetes/${pkg.slug}`,
    tipoConsulta: pkg.revisarPrecio ? "cotizacion" : "asesoria",
  });

  const handleBuyNow = async () => {
    try {
      setAdding(true);
      await addItem({
        id: pkg.slug,
        tipo: "paquete",
        nombre: `Paquete ${pkg.nombre}`,
        categoria: "gps",
        precioSinIvaCentavos: pkg.precioSinIvaCentavos,
        cantidad: 1,
        esEquipoPrincipal: true,
        incluyeInstalacion: pkg.incluyeInstalacion ?? true,
        incluyePlanPrimerAnio: pkg.incluyePlanPrimerAnio ?? true,
      });
      router.push("/checkout");
    } catch (e) {
      console.error("Error agregando paquete al carrito:", e);
      setAdding(false);
    }
  };

  const handleAddToCart = async () => {
    try {
      setAdding(true);
      await addItem({
        id: pkg.slug,
        tipo: "paquete",
        nombre: `Paquete ${pkg.nombre}`,
        categoria: "gps",
        precioSinIvaCentavos: pkg.precioSinIvaCentavos,
        cantidad: 1,
        esEquipoPrincipal: true,
        incluyeInstalacion: pkg.incluyeInstalacion ?? true,
        incluyePlanPrimerAnio: pkg.incluyePlanPrimerAnio ?? true,
      });
      setAdded(true);
      setTimeout(() => setAdded(false), 2200);
      trackAnalyticsEvent("AddToCart", {
        product_slug: pkg.slug,
        product_name: `Paquete ${pkg.nombre}`,
        price: conIvaCentavos / 100,
      });
    } catch (e) {
      console.error("Error agregando paquete:", e);
    } finally {
      setAdding(false);
    }
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

      {/* Imagen representativa del paquete */}
      <div className="relative h-36 sm:h-44 w-full overflow-hidden bg-gray-50/80 flex items-center justify-center p-3 border-b border-gray-100">
        <Link href={`/paquetes/${pkg.slug}`} className="w-full h-full flex items-center justify-center">
          <img
            src={getPackageImage(pkg)}
            alt={`Paquete ${pkg.nombre}`}
            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </Link>
      </div>

      <div className="p-6 space-y-5 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <Link href={`/paquetes/${pkg.slug}`} className="block group-hover:text-[#7A1428] transition-colors">
            <h3 className="text-lg font-black text-gray-900 tracking-tight">{pkg.nombre}</h3>
          </Link>
          <p className="text-xs text-gray-600 leading-relaxed">{pkg.descripcion}</p>

          {/* Viñetas Qué Incluye (Dinámico) */}
          {(() => {
            const list = getQueIncluyeComputed(pkg);
            if (list.length === 0) return null;
            return (
              <div className="pt-3 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                  Incluye:
                </span>
                <ul className="space-y-1.5 text-xs text-gray-700">
                  {list.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-[#C9A15B] shrink-0 mt-0.5" />
                      <span className="leading-tight font-medium text-gray-800">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}
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
                Inversión Total Llave en Mano
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-gray-900">{formattedPrice}</span>
                <span className="text-xs font-semibold text-gray-500 uppercase">con IVA</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {pkg.revisarPrecio ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                aria-label={`Cotizar paquete ${pkg.nombre} por WhatsApp`}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Cotizar Paquete por WhatsApp</span>
              </a>
            ) : (
              <div className="flex items-center gap-2">
                {/* Comprar ahora */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={adding}
                  className="flex-1 py-3 px-3 bg-[#7A1428] hover:bg-[#4A0C18] text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  aria-label={`Comprar ahora paquete ${pkg.nombre}`}
                >
                  <span>{adding ? "..." : "Comprar Ahora"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {/* Agregar al carrito */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={adding}
                  className={`p-3 rounded-xl border transition-colors flex items-center justify-center cursor-pointer shrink-0 ${
                    added
                      ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                      : "border-gray-200 text-gray-700 hover:text-[#7A1428] hover:bg-gray-50"
                  }`}
                  title={added ? "¡Agregado al carrito!" : "Agregar al carrito"}
                  aria-label={`Agregar paquete ${pkg.nombre} al carrito`}
                >
                  {added ? <Check className="w-4 h-4 stroke-[3]" /> : <ShoppingCart className="w-4 h-4" />}
                </button>

                {/* Asesoría WhatsApp */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl border border-gray-200 text-gray-600 hover:text-[#25D366] hover:bg-gray-50 transition-colors shrink-0"
                  title="Asesoría por WhatsApp"
                  aria-label={`Asesoría por WhatsApp para paquete ${pkg.nombre}`}
                >
                  <MessageCircle className="w-4 h-4" />
                </a>

                {/* Ver Ficha */}
                <Link
                  href={`/paquetes/${pkg.slug}`}
                  className="p-3 rounded-xl border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors shrink-0"
                  title="Ver detalles del paquete"
                  aria-label={`Ver detalles del paquete ${pkg.nombre}`}
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
