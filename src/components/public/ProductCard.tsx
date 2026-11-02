"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Product } from "@/types/catalog";
import { precioConIva, formatMxn } from "@/lib/pricing";
import { MessageCircle, AlertTriangle, ArrowRight, ShoppingBag, Check } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { getProductImage } from "@/lib/catalog/product-image";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: Product;
  msiOptions?: number[]; // Array de plazos MSI (si está vacío, no se muestra)
}

const categoryLabels: Record<string, string> = {
  gps: "GPS",
  dashcam: "DashCam",
  seguridad: "Seguridad",
  accesorio: "Accesorio",
  sensor: "Sensor",
  dron: "Dron",
  servicio: "Servicio",
};

export function ProductCard({ product, msiOptions = [] }: ProductCardProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const conIvaCentavos = precioConIva(product.precioSinIvaCentavos, 16);
  const formattedPrice = formatMxn(conIvaCentavos);
  const imageUrl = getProductImage(product);
  const readableCategory = categoryLabels[product.categoria] || product.categoria.toUpperCase();

  // Plazos MSI
  const plazoMaximoMsi = msiOptions && msiOptions.length > 0 ? Math.max(...msiOptions) : null;
  const cuotaMsi = plazoMaximoMsi ? formatMxn(Math.round(conIvaCentavos / plazoMaximoMsi)) : null;

  // Enlace a WhatsApp secundario para asesoría
  const whatsappUrl = buildWhatsAppLink({
    producto: product.nombreComercial,
    modelo: product.modeloConfirmado ? product.modelo : undefined,
    precioConIva: product.revisarPrecio ? undefined : formattedPrice,
    pagina: `/p/${product.slug}`,
    tipoConsulta: product.revisarPrecio ? "cotizacion" : "asesoria",
  });

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      setAdding(true);
      await addItem({
        id: product.slug,
        tipo: "producto",
        nombre: product.nombreComercial,
        categoria: product.categoria,
        precioSinIvaCentavos: product.precioSinIvaCentavos,
        cantidad: 1,
        esEquipoPrincipal: product.esEquipoPrincipal ?? true,
        incluyeInstalacion: product.incluyeInstalacion ?? false,
        incluyePlanPrimerAnio: product.incluyePlanPrimerAnio ?? false,
      });
      setAdded(true);
      setTimeout(() => setAdded(false), 2200);
      trackAnalyticsEvent("AddToCart", {
        product_slug: product.slug,
        product_name: product.nombreComercial,
        price: conIvaCentavos / 100,
      });
    } catch (err) {
      console.error("Error agregando al carrito:", err);
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      setAdding(true);
      await addItem({
        id: product.slug,
        tipo: "producto",
        nombre: product.nombreComercial,
        categoria: product.categoria,
        precioSinIvaCentavos: product.precioSinIvaCentavos,
        cantidad: 1,
        esEquipoPrincipal: product.esEquipoPrincipal ?? true,
        incluyeInstalacion: product.incluyeInstalacion ?? false,
        incluyePlanPrimerAnio: product.incluyePlanPrimerAnio ?? false,
      });
      router.push("/checkout");
    } catch (err) {
      console.error("Error procediendo a checkout:", err);
      setAdding(false);
    }
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200/80 hover:border-[#7A1428]/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group">
      {/* Visual Header / Imagen de Producto */}
      <div className="relative p-2.5 sm:p-4 bg-gray-50/60">
        <Link
          href={`/p/${product.slug}`}
          className="block overflow-hidden"
          aria-label={`Ver producto ${product.nombreComercial}`}
        >
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
            {readableCategory}
          </span>
          {product.incluyeInstalacion && (
            <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-emerald-700 text-white shadow-xs">
              Instalación incluida
            </span>
          )}
        </div>
      </div>

      {/* Body Content */}
      <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between space-y-2 sm:space-y-4">
        <div className="space-y-1 sm:space-y-1.5">
          <Link href={`/p/${product.slug}`} className="block group-hover:text-[#7A1428] transition-colors">
            <h3 className="text-xs sm:text-base font-bold text-gray-900 tracking-tight leading-snug line-clamp-2">
              {product.nombreComercial}
            </h3>
          </Link>

          {/* Modelo: Solo visible si está confirmado */}
          {product.modeloConfirmado && product.modelo && (
            <p className="text-[10px] sm:text-xs font-mono text-gray-400">Modelo: {product.modelo}</p>
          )}

          {product.descripcionCorta && (
            <p className="hidden sm:block text-xs text-gray-600 line-clamp-2 leading-relaxed pt-1">
              {product.descripcionCorta}
            </p>
          )}

          {/* Características clave en desktop */}
          {(product.incluyeInstalacion || product.incluyePlanPrimerAnio) && (
            <div className="hidden sm:flex pt-1 flex-wrap gap-2 text-[11px] text-gray-600">
              {product.incluyeInstalacion && (
                <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md font-medium">
                  ✓ Instalación profesional
                </span>
              )}
              {product.incluyePlanPrimerAnio && (
                <span className="inline-flex items-center gap-1 text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md font-medium">
                  ✓ 1er año de plataforma y datos
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
                <span className="truncate">Precio por confirmar</span>
              </div>
              <p className="text-[10px] text-gray-400 hidden sm:block">Solicita cotización formal a tu asesor</p>
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
          <div className="pt-1.5 flex items-center gap-1 sm:gap-2">
            {product.revisarPrecio ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 sm:py-2.5 px-2 text-[11px] sm:text-xs font-bold rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-1 shadow-xs bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                aria-label={`Cotizar ${product.nombreComercial} por WhatsApp`}
              >
                <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Cotizar</span>
              </a>
            ) : (
              <>
                {/* Botón Comprar Ahora (va directo a checkout) */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={adding}
                  className="flex-1 py-2 sm:py-2.5 px-2 sm:px-3 text-[11px] sm:text-xs font-bold rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-1 shadow-xs bg-[#7A1428] hover:bg-[#4A0C18] text-white cursor-pointer"
                  aria-label={`Comprar ahora ${product.nombreComercial}`}
                >
                  <span className="truncate">{adding ? "..." : "Comprar"}</span>
                </button>

                {/* Botón Agregar al Carrito */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={adding}
                  className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl border transition-colors flex items-center justify-center cursor-pointer shrink-0 ${
                    added
                      ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                      : "border-gray-200 text-gray-700 hover:text-[#7A1428] hover:bg-gray-50"
                  }`}
                  title={added ? "¡Agregado al carrito!" : "Agregar al carrito"}
                  aria-label={`Agregar ${product.nombreComercial} al carrito`}
                >
                  {added ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                </button>

                {/* WhatsApp Asesoría */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl border border-gray-200 text-gray-600 hover:text-[#25D366] hover:bg-gray-50 transition-colors shrink-0"
                  title="Asesoría por WhatsApp"
                  aria-label={`Asesoría por WhatsApp para ${product.nombreComercial}`}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </a>
              </>
            )}

            {/* Enlace Ficha */}
            <Link
              href={`/p/${product.slug}`}
              className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors shrink-0"
              title={`Ver ficha completa de ${product.nombreComercial}`}
              aria-label={`Ver detalles de ${product.nombreComercial}`}
            >
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
