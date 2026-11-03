import { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";

export const metadata: Metadata = {
  title: "Carrito de Compra | CosoTec by CoSoAVL",
  description: "Revisa los productos, accesorios y niveles de solución seleccionados para tu unidad.",
};

export default function CarritoPage() {
  return (
    <div className="min-h-screen bg-[#F5F3F2] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navegación y Título */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200/60 pb-4">
          <div className="space-y-1">
            <Link
              href="/soluciones"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#7A1428] transition-colors mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Seguir explorando soluciones
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#7A1428] text-white flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                Carrito de Compra
              </h1>
            </div>
          </div>
        </div>

        {/* Contenedor Principal del Carrito */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs">
          <CartView showCheckoutButton={true} />
        </div>
      </div>
    </div>
  );
}

