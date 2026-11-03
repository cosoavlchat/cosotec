"use client";

import React, { useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { CartView } from "./CartView";
import { X, ShoppingCart } from "lucide-react";

export function CartDrawer() {
  const { isCartDrawerOpen, closeCartDrawer, items } = useCart();

  // Cerrar al presionar la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isCartDrawerOpen) {
        closeCartDrawer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCartDrawerOpen, closeCartDrawer]);

  // Prevenir scroll de fondo cuando el drawer está abierto
  useEffect(() => {
    if (isCartDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartDrawerOpen]);

  if (!isCartDrawerOpen) return null;

  const totalCount = items.reduce((sum, it) => sum + it.cantidad, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Carrito de compra">
      {/* Backdrop traslúcido */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={closeCartDrawer}
        aria-hidden="true"
      />

      {/* Panel Deslizante Lateral */}
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-300">
        {/* Cabecera del Drawer */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#7A1428]/10 text-[#7A1428] flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900 tracking-tight">
                Tu Carrito
              </h2>
              <p className="text-[11px] text-gray-500 font-medium">
                {totalCount} {totalCount === 1 ? "artículo agregado" : "artículos agregados"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeCartDrawer}
            aria-label="Cerrar carrito de compra"
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <CartView onCheckoutClick={closeCartDrawer} />
        </div>
      </div>
    </div>
  );
}

