import { getProducts } from "@/lib/services/catalog-service";
import { ProductCard } from "@/components/public/ProductCard";
import Link from "next/link";
import { Layers, ShieldCheck, Video, Cpu, Plane, Wrench } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catálogo Oficial de Equipos",
  description:
    "Catálogo de GPS vehicular, DashCams con IA, seguridad anti-jammer y drones empresariales. Precios públicos con IVA incluido.",
  alternates: {
    canonical: "/tienda",
  },
  openGraph: {
    title: "Catálogo Oficial de Equipos | CosoTec by CoSoAVL",
    description:
      "Catálogo de GPS vehicular, DashCams con IA, seguridad anti-jammer y drones empresariales. Precios públicos con IVA incluido.",
    url: "/tienda",
  },
};

export default async function TiendaPage() {
  const products = await getProducts(false); // Solo productos con activo === true y visibleEnTienda !== false

  const allCategories = [
    { id: "all", name: "Todos los Equipos", href: "/tienda", count: products.length },
    { id: "gps", name: "GPS Vehicular", href: "/tienda/gps", icon: Layers },
    { id: "dashcam", name: "DashCams", href: "/tienda/dashcam", icon: Video },
    { id: "seguridad", name: "Seguridad y Sensores", href: "/tienda/seguridad", icon: ShieldCheck },
    { id: "accesorio", name: "Accesorios", href: "/tienda/accesorio", icon: Cpu },
    { id: "dron", name: "Drones Empresariales", href: "/tienda/dron", icon: Plane },
    { id: "servicio", name: "Servicios e Instalación", href: "/tienda/servicio", icon: Wrench },
  ];

  // Solo mostrar categorías que tengan productos activos y visibles
  const visibleCategoriesSet = new Set(products.map((p) => p.categoria));
  const categories = allCategories.filter((cat) => cat.id === "all" || visibleCategoriesSet.has(cat.id as any));

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-10">
      {/* Header Tienda */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7A1428]/10 text-[#7A1428] text-xs font-semibold">
          <span>Catálogo CosoTec 2026</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
          Catálogo de Seguridad y Telemetría
        </h1>
        <p className="text-xs text-gray-500 max-w-2xl">
          Todos los precios incluyen IVA (16%). 10% de descuento automático en pedidos de más de 5 equipos principales.
        </p>
      </div>

      {/* Categorías Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={cat.href}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-colors ${
              cat.id === "all"
                ? "bg-[#7A1428] text-white shadow-xs"
                : "bg-white border border-gray-200 text-gray-700 hover:border-[#7A1428] hover:text-[#7A1428]"
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {/* Grid de Productos (2 columnas en celular) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}

