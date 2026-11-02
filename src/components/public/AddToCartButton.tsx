"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { Product } from "@/types/catalog";
import { ShoppingBag, ArrowRight } from "lucide-react";

interface AddToCartButtonProps {
  product: Product;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [loading, setLoading] = useState(false);

  if (product.revisarPrecio || product.precioSinIvaCentavos === 0) {
    return null;
  }

  const handleAddToCart = async () => {
    try {
      setLoading(true);
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
      console.error("Error agregando al carrito:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleAddToCart}
      disabled={loading}
      className="flex-1 py-3.5 px-6 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 bg-[#1C1C1E] hover:bg-black text-white hover:scale-[1.02] cursor-pointer"
    >
      <ShoppingBag className="w-4 h-4 text-[#C9A15B]" />
      <span>{loading ? "Agregando..." : "Comprar / Configurar en Línea"}</span>
      <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
    </button>
  );
}

