import Link from "next/link";
import { Car, Truck, Shield, Clock, MapPin, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { getSolutions } from "@/lib/services/solutions-service";
import { formatMxn } from "@/lib/pricing";
import type { Metadata } from "next";

const iconMap = {
  Car,
  Truck,
  Shield,
  Clock,
  MapPin,
};

export const metadata: Metadata = {
  title: "Soluciones de Rastreo Satelital y Seguridad por Tipo de Unidad",
  description:
    "Descubre la solución a la medida para autos, taxis, tractocamiones, autobuses, cajas refrigeradas, maquinaria pesada y motocicletas.",
  alternates: {
    canonical: "/soluciones",
  },
  openGraph: {
    title: "Soluciones de Rastreo y Seguridad | CosoTec by CoSoAVL",
    description:
      "Protección y telemetría por tipo de unidad: autos, taxis, tractocamiones, cajas secas, maquinaria y motos con instalación profesional.",
    url: "/soluciones",
  },
};

export default async function SolucionesHubPage() {
  const solutions = await getSolutions();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      {/* Header */}
      <div className="space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7A1428]/10 text-[#7A1428] text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Configuraciones Especializadas</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight">
          Soluciones de Rastreo a la Medida de tu Unidad
        </h1>
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
          Cada tipo de vehículo enfrenta riesgos distintos: desde robos en semáforos hasta asaltos con inhibidores (jammer) en carretera federal. Selecciona tu unidad y encuentra el paquete y equipo ideal.
        </p>
      </div>

      {/* Grid de 7 Soluciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {solutions.map((sol) => {
          const Icon = iconMap[sol.iconoName] || Car;
          return (
            <div
              key={sol.slug}
              className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200/80 hover:border-[#7A1428]/60 shadow-xs hover:shadow-lg transition-all overflow-hidden flex flex-col justify-between group"
            >
              {/* Tarjeta Visual 3:4 Horizontal con Logo Oficial */}
              {sol.imagenUrl && (
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/5">
                  <img
                    src={sol.imagenUrl}
                    alt={`Solución de rastreo para ${sol.titulo}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              )}

              <div className="p-6 sm:p-7 flex flex-col justify-between flex-1 space-y-6">
                <div className="space-y-4">
                  {/* Header de tarjeta */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#7A1428]/10 text-[#7A1428] flex items-center justify-center shrink-0 group-hover:bg-[#7A1428] group-hover:text-white transition-colors shadow-xs">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-gray-900 group-hover:text-[#7A1428] transition-colors leading-tight">
                        {sol.titulo}
                      </h2>
                      <span className="text-[11px] text-gray-400 font-semibold block mt-0.5">
                        {sol.tiers.length} {sol.tiers.length === 1 ? "configuración disponible" : "configuraciones disponibles"}
                      </span>
                    </div>
                  </div>

                {/* Subtítulo */}
                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                  {sol.subtitulo}
                </p>

                {/* Problema que resuelve */}
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block">
                    Problema que resuelve:
                  </span>
                  <p className="text-xs text-gray-700 leading-snug">
                    {sol.problema}
                  </p>
                </div>

                {/* Equipo Recomendado */}
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] text-gray-400 font-medium block">
                    Equipo o kit base sugerido:
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#C9A15B] shrink-0" />
                    <span>{sol.equipoRecomendado}</span>
                  </div>
                </div>
              </div>

              {/* Footer con Precio y Botón */}
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                      Inversión desde
                    </span>
                    <span className="text-xl font-black text-gray-900">
                      {formatMxn(sol.precioDesdeCentavos)}
                    </span>
                    <span className="text-[10px] text-gray-500 font-semibold ml-1 uppercase">con IVA</span>
                  </div>
                </div>

                <Link
                  href={`/soluciones/${sol.slug}`}
                  className="w-full py-3 px-4 bg-[#7A1428] hover:bg-[#4A0C18] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 group-hover:shadow-md cursor-pointer"
                  aria-label={`Ver opciones y configurar solución para ${sol.titulo}`}
                >
                  <span>Ver Opciones y Configurar</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}

