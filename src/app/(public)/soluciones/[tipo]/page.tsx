import { notFound } from "next/navigation";
import Link from "next/link";
import { Car, Truck, Shield, Clock, MapPin, Check, MessageCircle, ArrowRight } from "lucide-react";
import { getProducts, getPackages } from "@/lib/services/catalog-service";
import { ProductCard } from "@/components/public/ProductCard";
import { PackageCard } from "@/components/public/PackageCard";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";
import type { Metadata } from "next";

interface SolucionData {
  titulo: string;
  subtitulo: string;
  icono: any;
  amenazas: string[];
  paqueteSlug: string;
  productosCompatibles: string[];
}

const solucionesMap: Record<string, SolucionData> = {
  "auto-camioneta": {
    titulo: "Seguridad para Autos y Camionetas",
    subtitulo: "Rastreo personal, paro de motor remoto y botón de asistencia ante robo o asalto.",
    icono: Car,
    amenazas: ["Robo estacionado o con violencia", "Uso no autorizado del vehículo", "Falta de asistencia en carretera"],
    paqueteSlug: "gps-esencial",
    productosCompatibles: ["gps-estandar", "boton-panico", "seguros-puertas-automatizados"],
  },
  "taxi-apps": {
    titulo: "Seguridad para Taxi, Uber, Didi y Apps",
    subtitulo: "Botón de pánico silencioso en cabina y monitoreo continuo las 24 horas.",
    icono: Car,
    amenazas: ["Asaltos a chofer durante servicio", "Desconexión de equipo", "Disputas de pasaje"],
    paqueteSlug: "dashcam-esencial-jc181",
    productosCompatibles: ["gps-basico-semi", "boton-panico", "microfono"],
  },
  "tractocamion": {
    titulo: "Protección Integral para Tractocamiones",
    subtitulo: "Telemetría avanzada, protección activa anti-jammer, control de diesel y video multicámara.",
    icono: Truck,
    amenazas: ["Ataque con inhibidores de señal (jammer)", "Robo de diesel por ordeña", "Accidentes en carretera"],
    paqueteSlug: "flotilla-pro-combustible",
    productosCompatibles: ["gps-flotilla", "anti-jammer", "sensor-combustible-varilla-instalado", "dashcam-industrial-360"],
  },
  "camion-autobus": {
    titulo: "Monitoreo para Camiones, Volteos y Autobuses",
    subtitulo: "Control estricto de velocidad, cumplimiento de rutas y botón de emergencia.",
    icono: Truck,
    amenazas: ["Excesos de velocidad y multas", "Desvío no autorizado de ruta", "Pérdida de control de tiempos"],
    paqueteSlug: "gps-flotilla-pro",
    productosCompatibles: ["gps-intermedio", "boton-panico", "bocina"],
  },
  "caja-refrigerada": {
    titulo: "Rastreo para Cajas Secas y Refrigeradas",
    subtitulo: "Equipos portátiles de larga duración y sensores de temperatura para cadena de frío.",
    icono: Shield,
    amenazas: ["Pérdida de temperatura en perecederos", "Desenganche no autorizado de caja", "Robo de mercancía"],
    paqueteSlug: "gps-flotilla-pro",
    productosCompatibles: ["gps-portable-3d", "gps-caja", "sensor-temperatura", "chapa-electromecanica-1-perno-ferceo"],
  },
  "maquinaria": {
    titulo: "Control para Maquinaria Pesada y de Construcción",
    subtitulo: "Medición exacta de horómetros de motor, geocercas en obra y paro preventivo.",
    icono: Clock,
    amenazas: ["Uso no autorizado fuera de horario", "Robo en obra durante la noche", "Falta de control de horas de trabajo"],
    paqueteSlug: "gps-flotilla-pro",
    productosCompatibles: ["gps-maquinaria-pesada", "sensor-combustible-varilla-instalado"],
  },
  "motos": {
    titulo: "Rastreo para Motocicletas de Reparto",
    subtitulo: "Dispositivo ultra compacto impermeable que no drena la batería.",
    icono: MapPin,
    amenazas: ["Robo de moto estacionada", "Asalto en entrega de último tramo", "Pérdida de señal"],
    paqueteSlug: "gps-esencial",
    productosCompatibles: ["gps-motocicleta-y04g"],
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tipo: string }>;
}): Promise<Metadata> {
  const { tipo } = await params;
  const sol = solucionesMap[tipo];
  if (!sol) return { title: "Solución no encontrada" };

  return {
    title: `${sol.titulo} | CosoTec by CoSoAVL`,
    description: sol.subtitulo,
  };
}

export default async function SolucionPage({
  params,
}: {
  params: Promise<{ tipo: string }>;
}) {
  const { tipo } = await params;
  const sol = solucionesMap[tipo];
  if (!sol) notFound();

  const [allProducts, allPackages] = await Promise.all([
    getProducts(false),
    getPackages(false),
  ]);

  const recommendedPackage = allPackages.find((p) => p.slug === sol.paqueteSlug && p.activo);
  const relatedProducts = allProducts.filter(
    (p) => sol.productosCompatibles.includes(p.slug) && p.activo
  );

  const whatsappUrl = buildWhatsAppLink({
    producto: sol.titulo,
    pagina: `/soluciones/${tipo}`,
    tipoConsulta: "cotizacion",
  });

  const IconComp = sol.icono;

  return (
    <div className="space-y-16 pb-20">
      {/* Header Solución */}
      <section className="bg-gradient-to-r from-[#4A0C18] to-[#7A1428] text-white py-16 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#C9A15B]">
              <IconComp className="w-6 h-6" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{sol.titulo}</h1>
            <p className="text-sm sm:text-base text-gray-200 leading-relaxed">{sol.subtitulo}</p>
            <div className="pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#C9A15B] hover:bg-[#b58f4a] text-gray-900 font-extrabold text-xs rounded-xl shadow-lg transition-transform hover:scale-105"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Cotizar esta solución por WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Tarjeta de Riesgos que resuelve */}
          <div className="w-full md:w-80 bg-black/30 backdrop-blur-md rounded-2xl p-6 border border-white/15 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#C9A15B] block">
              Riesgos que neutraliza:
            </span>
            <ul className="space-y-2 text-xs text-gray-200">
              {sol.amenazas.map((amenaza, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{amenaza}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Paquete Recomendado */}
      {recommendedPackage && (
        <section className="max-w-6xl mx-auto px-6 space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7A1428]">
              Configuración Sugerida
            </span>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              Paquete Recomendado para {sol.titulo}
            </h2>
          </div>
          <div className="max-w-md">
            <PackageCard pkg={recommendedPackage} />
          </div>
        </section>
      )}

      {/* Equipos y Accesorios Compatibles */}
      {relatedProducts.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7A1428]">
              Complementos Compatibles
            </span>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              Equipos y Sensores para esta Unidad
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

