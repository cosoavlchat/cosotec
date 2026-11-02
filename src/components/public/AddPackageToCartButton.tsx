"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Package } from "@/types/catalog";
import { useCart } from "@/context/CartContext";
import { ArrowRight, ShoppingBag, Check } from "lucide-react";
import { trackAnalyticsEvent } from "@/lib/analytics";

interface AddPackageToCartButtonProps {
  pkg: Package;
}

export function AddPackageToCartButton({ pkg }: AddPackageToCartButtonProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [loadingBuy, setLoadingBuy] = useState(false);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [added, setAdded] = useState(false);

  if (pkg.revisarPrecio) return null;

  const handleBuyNow = async () => {
    try {
      setLoadingBuy(true);
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
      console.error("Error comprando paquete:", e);
      setLoadingBuy(false);
    }
  };

  const handleAddToCart = async () => {
    try {
      setLoadingAdd(true);
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
        price: (pkg.precioSinIvaCentavos * 1.16) / 100,
      });
    } catch (e) {
      console.error("Error agregando paquete:", e);
    } finally {
      setLoadingAdd(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-2.5">
      <button
        type="button"
        onClick={handleBuyNow}
        disabled={loadingBuy}
        className="w-full sm:w-auto py-3.5 px-6 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 bg-[#7A1428] hover:bg-[#4A0C18] text-white hover:scale-[1.01] cursor-pointer"
        aria-label={`Comprar ahora paquete ${pkg.nombre}`}
      >
        <span>{loadingBuy ? "Procesando..." : "Comprar Ahora"}</span>
        <ArrowRight className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={loadingAdd}
        className={`w-full sm:w-auto py-3.5 px-5 font-bold text-xs rounded-xl border transition-all flex items-center justify-center gap-2 cursor-pointer ${
          added
            ? "bg-emerald-50 border-emerald-300 text-emerald-800"
            : "bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-800"
        }`}
        title="Agregar paquete al carrito"
        aria-label={`Agregar paquete ${pkg.nombre} al carrito`}
      >
        {added ? (
          <>
            <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
            <span>¡Agregado al Carrito!</span>
          </>
        ) : (
          <>
            <ShoppingBag className="w-4 h-4 text-[#7A1428]" />
            <span>{loadingAdd ? "Agregando..." : "Agregar al Carrito"}</span>
          </>
        )}
      </button>
    </div>
  );
}

