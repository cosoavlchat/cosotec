import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Car,
  Truck,
  Shield,
  Clock,
  MapPin,
  Check,
  MessageCircle,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Layers,
} from "lucide-react";
import { getProducts } from "@/lib/services/catalog-service";
import { getSolutionBySlug, getSolutions } from "@/lib/services/solutions-service";
import { SolutionTierCard } from "@/components/public/SolutionTierCard";
import { ProductCard } from "@/components/public/ProductCard";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";
import type { Metadata } from "next";

const iconMap = {
  Car,
  Truck,
  Shield,
  Clock,
  MapPin,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tipo: string }>;
}): Promise<Metadata> {
  const { tipo } = await params;
  const sol = await getSolutionBySlug(tipo);
  if (!sol) return { title: "Solución no encontrada" };

  return {
    title: sol.titulo,
    description: sol.subtitulo,
    alternates: {
      canonical: `/soluciones/${tipo}`,
    },
    openGraph: {
      title: `${sol.titulo} | CosoTec by CoSoAVL`,
      description: sol.subtitulo,
      url: `/soluciones/${tipo}`,
    },
  };
}

export default async function SolucionPage({
  params,
}: {
  params: Promise<{ tipo: string }>;
}) {
  const { tipo } = await params;
  const sol = await getSolutionBySlug(tipo);
  if (!sol) notFound();

  const allSolutions = await getSolutions();
  const allProducts = await getProducts(false);

  // Mapeo de productos para los tiers
  const productMap = new Map(allProducts.map((p) => [p.slug, p]));

  // Accesorios compatibles
  const relatedProducts = allProducts.filter((p) =>
    sol.accesoriosCompatiblesSlugs.includes(p.slug)
  );

  const whatsappQuoteUrl = buildWhatsAppLink({
    pagina: `/soluciones/${tipo}`,
    tipoConsulta: "cotizacion",
    equipo: `Solución Especializada para ${sol.titulo}`,
  });

  const Icon = iconMap[sol.iconoName] || Car;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12 sm:space-y-16">
      {/* 1. Barra de Navegación Rápida entre las 7 Soluciones */}
      <div className="space-y-2">
        <span className="text-[11px] uppercase font-bold text-gray-400 tracking-wider block">
          Cambiar tipo de unidad:
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {allSolutions.map((s) => {
            const SIcon = iconMap[s.iconoName] || Car;
            const isCurrent = s.slug === tipo;
            return (
              <Link
                key={s.slug}
                href={`/soluciones/${s.slug}`}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isCurrent
                    ? "bg-[#7A1428] text-white shadow-sm"
                    : "bg-white border border-gray-200/90 text-gray-700 hover:border-[#7A1428]/40 hover:text-[#7A1428]"
                }`}
                aria-label={`Ver solución para ${s.titulo}`}
              >
                <SIcon className="w-3.5 h-3.5" />
                <span>{s.titulo}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 2. Hero de la Solución */}
      <div className="bg-gradient-to-br from-[#1C0409] via-[#2A060E] to-[#120205] text-white rounded-3xl p-6 sm:p-12 shadow-xl border border-[#C9A15B]/30 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C9A15B_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#C9A15B] text-xs font-bold uppercase tracking-wider backdrop-blur-xs border border-white/10">
            <Icon className="w-4 h-4 text-[#C9A15B]" />
            <span>Solución Especializada</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            {sol.titulo}
          </h1>

          <p className="text-sm sm:text-base text-gray-200 leading-relaxed font-medium">
            {sol.subtitulo}
          </p>

          {/* Problema y Riesgos Prioritarios */}
          <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1.5 backdrop-blur-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#C9A15B] flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Problema Crítico</span>
              </span>
              <p className="text-xs text-gray-200 leading-snug">
                {sol.problema}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1.5 backdrop-blur-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>Riesgos Protegidos</span>
              </span>
              <ul className="space-y-1 text-xs text-gray-200">
                {sol.amenazas.map((amenaza, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-[#C9A15B] font-black">•</span>
                    <span className="leading-tight">{amenaza}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Tres Opciones: Básico / Recomendado / Completo */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#7A1428]">
              <Layers className="w-4 h-4" />
              <span>Niveles de Equipamiento</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Configuraciones Listas para Instalar
            </h2>
          </div>
          <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
            Todas las opciones incluyen equipo nuevo de grado automotriz, mano de obra de instalación profesional oculta y primer año de servicio.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sol.tiers.map((tier) => (
            <SolutionTierCard
              key={tier.id}
              tier={tier}
              product={productMap.get(tier.productoSlug)}
              solucionTitulo={sol.titulo}
            />
          ))}
        </div>
      </section>

      {/* 4. Accesorios Compatibles */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6 pt-4 border-t border-gray-100">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7A1428]">
              Complementos Disponibles
            </span>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              Accesorios y Sensores Compatibles con {sol.titulo}
            </h2>
            <p className="text-xs text-gray-500">
              Personaliza tu unidad con sensores adicionales, chapas electromecánicas o botones de auxilio.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* 5. CTA a Cotización a Medida */}
      <div className="rounded-3xl bg-gray-50 border border-gray-200/80 p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl text-center sm:text-left">
          <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            ¿Requieres equipar flotillas o una configuración especial?
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Te armamos una cotización formal inmediata con descuentos por volumen a partir de 5 unidades y logística de instalación consolidada.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link
            href={`/soluciones?tipo=${tipo}`}
            className="w-full sm:w-auto px-6 py-3.5 bg-[#7A1428] hover:bg-[#4A0C18] text-white text-xs font-bold rounded-xl transition-all shadow-xs text-center cursor-pointer"
            aria-label={`Ver catálogo de soluciones para ${sol.titulo}`}
          >
            <span>Explorar Otras Soluciones</span>
          </Link>
          <a
            href={whatsappQuoteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-3.5 bg-[#C9A15B] hover:bg-[#b58f4a] text-gray-900 text-xs font-extrabold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            aria-label={`Cotizar ${sol.titulo} por WhatsApp`}
          >
            <MessageCircle className="w-4 h-4 fill-current text-gray-900" />
            <span>Asesoría Directa</span>
          </a>
        </div>
      </div>
    </div>
  );
}
