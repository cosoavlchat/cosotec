import { notFound } from "next/navigation";
import Link from "next/link";
import { getProducts } from "@/lib/services/catalog-service";
import { ProductCard } from "@/components/public/ProductCard";
import { ProductCategory } from "@/types/catalog";
import type { Metadata } from "next";

const categoryTitles: Record<string, { title: string; desc: string }> = {
  gps: {
    title: "GPS Vehicular y Rastreo Satelital",
    desc: "Dispositivos de grado automotriz e industrial 4G LTE con paro de motor y geocercas.",
  },
  dashcam: {
    title: "DashCams Inteligentes con IA",
    desc: "Cámaras JC181 y JC450 de doble lente con video en vivo 4G y detección de incidentes.",
  },
  seguridad: {
    title: "Seguridad Activa y Sensores",
    desc: "Sistemas anti-jammer por RFID, chapas electromecánicas y sensores de combustible.",
  },
  accesorio: {
    title: "Accesorios Homologados",
    desc: "Botones de pánico, micrófonos, antenas activas y tarjetas MicroSD especializadas.",
  },
  dron: {
    title: "Drones Empresariales DJI Enterprise",
    desc: "Aeronaves DJI Matrice 4E y Matrice 4T para mapeo fotogramétrico e inspección térmica.",
  },
  servicio: {
    title: "Servicios Técnicos e Instalación",
    desc: "Mano de obra certificada, desinstalación, traspaso entre unidades y calibraciones.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoria: string }>;
}): Promise<Metadata> {
  const { categoria } = await params;
  const meta = categoryTitles[categoria];
  if (!meta) return { title: "Categoría no encontrada" };

  return {
    title: `${meta.title} | Catálogo CosoTec`,
    description: meta.desc,
  };
}

export default async function CategoriaTiendaPage({
  params,
}: {
  params: Promise<{ categoria: string }>;
}) {
  const { categoria } = await params;
  const meta = categoryTitles[categoria];
  if (!meta) notFound();

  const allProducts = await getProducts(false);
  const products = allProducts.filter((p) => p.categoria === (categoria as ProductCategory));

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-10">
      <div className="space-y-3">
        <Link
          href="/tienda"
          className="text-xs font-bold text-[#7A1428] hover:underline"
        >
          ← Volver a todo el catálogo
        </Link>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
          {meta.title}
        </h1>
        <p className="text-xs text-gray-500 max-w-2xl">{meta.desc}</p>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <p className="text-xs text-gray-400">No hay equipos disponibles en esta categoría por el momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

