"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { Product } from "@/types/catalog";
import { ShoppingCart, ArrowRight, Check } from "lucide-react";
import { trackAnalyticsEvent } from "@/lib/analytics";

interface AddToCartButtonProps {
  product: Product;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [loadingBuy, setLoadingBuy] = useState(false);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [added, setAdded] = useState(false);

  if (product.revisarPrecio || product.precioSinIvaCentavos === 0) {
    return null;
  }

  const handleBuyNow = async () => {
    try {
      setLoadingBuy(true);
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
    } catch (e) {
      console.error("Error comprando producto:", e);
      setLoadingBuy(false);
    }
  };

  const handleAddToCart = async () => {
    try {
      setLoadingAdd(true);
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
      setTimeout(() => setAdded(false), 2500);
      trackAnalyticsEvent("AddToCart", {
        product_slug: product.slug,
        product_name: product.nombreComercial,
        price: (product.precioSinIvaCentavos * 1.16) / 100,
      });
    } catch (e) {
      console.error("Error agregando al carrito:", e);
    } finally {
      setLoadingAdd(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col sm:flex-row items-center gap-2.5 w-full">
      {/* Botón Comprar Ahora */}
      <button
        type="button"
        onClick={handleBuyNow}
        disabled={loadingBuy}
        className="w-full sm:flex-1 py-3.5 px-6 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 bg-[#7A1428] hover:bg-[#4A0C18] text-white hover:scale-[1.01] cursor-pointer"
        aria-label={`Comprar ahora ${product.nombreComercial}`}
      >
        <span>{loadingBuy ? "Procesando..." : "Comprar Ahora"}</span>
        <ArrowRight className="w-4 h-4" />
      </button>

      {/* Botón Agregar al Carrito */}
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={loadingAdd}
        className={`w-full sm:w-auto py-3.5 px-5 font-bold text-xs rounded-xl border transition-all flex items-center justify-center gap-2 cursor-pointer ${
          added
            ? "bg-emerald-50 border-emerald-300 text-emerald-800"
            : "bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-800"
        }`}
        title="Agregar al carrito sin salir"
        aria-label={`Agregar ${product.nombreComercial} al carrito`}
      >
        {added ? (
          <>
            <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
            <span>¡Agregado al Carrito!</span>
          </>
        ) : (
          <>
            <ShoppingCart className="w-4 h-4 text-[#7A1428]" />
            <span>{loadingAdd ? "Agregando..." : "Agregar al Carrito"}</span>
          </>
        )}
      </button>
    </div>
  );
}
