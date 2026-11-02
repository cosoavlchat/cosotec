import { notFound } from "next/navigation";
import Link from "next/link";
import { getPackages } from "@/lib/services/catalog-service";
import { precioConIva, formatMxn } from "@/lib/pricing";
import { Check, MessageCircle, AlertTriangle, Clock, Sparkles } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";
import { AddPackageToCartButton } from "@/components/public/AddPackageToCartButton";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const packages = await getPackages(false);
  const pkg = packages.find((p) => p.slug === slug);
  if (!pkg) return { title: "Paquete no encontrado" };

  return {
    title: `Paquete ${pkg.nombre}`,
    description: pkg.descripcion,
    alternates: {
      canonical: `/paquetes/${pkg.slug}`,
    },
    openGraph: {
      title: `Paquete ${pkg.nombre} | CosoTec by CoSoAVL`,
      description: pkg.descripcion,
      url: `/paquetes/${pkg.slug}`,
    },
  };
}

function getPackageImage(pkg: { slug?: string; imagenes?: string[] }): string {
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

export default async function PaqueteDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const packages = await getPackages(false);
  const pkg = packages.find((p) => p.slug === slug);

  if (!pkg) notFound();

  const conIvaCentavos = precioConIva(pkg.precioSinIvaCentavos, 16);
  const formattedPrice = formatMxn(conIvaCentavos);

  const whatsappUrl = buildWhatsAppLink({
    producto: `Paquete ${pkg.nombre}`,
    precioConIva: pkg.revisarPrecio ? undefined : formattedPrice,
    pagina: `/paquetes/${pkg.slug}`,
    tipoConsulta: pkg.revisarPrecio ? "cotizacion" : "asesoria",
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/" className="hover:text-gray-900">Inicio</Link>
        <span>/</span>
        <Link href="/paquetes" className="hover:text-gray-900">Paquetes</Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">{pkg.nombre}</span>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200/80 shadow-md space-y-8">
        {/* Imagen del Paquete */}
        <div className="w-full h-48 sm:h-64 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center p-4 overflow-hidden">
          <img
            src={getPackageImage(pkg)}
            alt={`Paquete ${pkg.nombre}`}
            className="w-full h-full object-contain"
            fetchPriority="high"
          />
        </div>

        <div className="space-y-3">
          {pkg.destacado && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7A1428] text-white text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#C9A15B]" />
              <span>Paquete Recomendado</span>
            </div>
          )}

          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            {pkg.nombre}
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed">{pkg.descripcion}</p>
        </div>

        {/* Pricing Box */}
        <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-4">
          {pkg.revisarPrecio ? (
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Precio por confirmar</span>
              </div>
              <p className="text-xs text-gray-500">Solicita precio preferencial para flotilla</p>
            </div>
          ) : (
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                Inversión Total con IVA
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-900">{formattedPrice}</span>
                <span className="text-xs font-semibold text-gray-500 uppercase">IVA 16% Incluido</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Subtotal: {formatMxn(pkg.precioSinIvaCentavos)} sin IVA
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {pkg.revisarPrecio ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                aria-label={`Cotizar paquete ${pkg.nombre} por WhatsApp`}
              >
                <MessageCircle className="w-4 h-4" />
                <span>Cotizar este paquete por WhatsApp</span>
              </a>
            ) : (
              <>
                <AddPackageToCartButton pkg={pkg} />
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-gray-200 text-gray-700 hover:text-[#25D366] hover:bg-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  aria-label={`Asesoría por WhatsApp sobre paquete ${pkg.nombre}`}
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  <span>Asesoría por WhatsApp</span>
                </a>
              </>
            )}
          </div>
        </div>

        {/* Qué Incluye */}
        {pkg.queIncluye && pkg.queIncluye.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
              ¿Qué incluye este paquete completo?
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-700">
              {pkg.queIncluye.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
