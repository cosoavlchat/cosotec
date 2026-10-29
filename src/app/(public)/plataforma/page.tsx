import Link from "next/link";
import { Monitor, Smartphone, ShieldCheck, MapPin, Compass, Key, ArrowRight, MessageCircle } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plataformas de Rastreo y Telemetría | CosoTec by CoSoAVL",
  description:
    "Conoce las plataformas TrackTracer y SphereGT de CoSoAVL: rastreo en tiempo real 24/7, geocercas, paro de motor remoto y reportes de telemetría.",
};

export default function PlataformaPage() {
  const whatsappUrl = buildWhatsAppLink({
    pagina: "/plataforma",
    tipoConsulta: "demo",
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-16">
      {/* Header */}
      <div className="space-y-4 max-w-3xl">
        <span className="text-xs font-bold uppercase tracking-wider text-[#7A1428]">
          Software de Grado Industrial
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight">
          Control Total de tus Vehículos en Tiempo Real
        </h1>
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
          Nuestras soluciones en la nube conectan cada GPS y DashCam con una interfaz intuitiva para computadoras y aplicaciones móviles iOS y Android.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/acceso"
            className="px-6 py-3 rounded-xl bg-[#7A1428] hover:bg-[#4A0C18] text-white text-xs font-bold transition-all shadow-xs"
          >
            Acceso a Clientes Activos
          </Link>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-xl bg-white border border-gray-300 hover:border-[#7A1428] text-gray-800 text-xs font-bold transition-all flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4 text-[#25D366]" />
            <span>Solicitar Demo en Vivo</span>
          </a>
        </div>
      </div>

      {/* Plataformas Destacadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* TrackTracer */}
        <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-xs space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-[#7A1428]/10 text-[#7A1428] flex items-center justify-center font-bold">
            <Compass className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-[#7A1428] uppercase tracking-wider">
              Solución para Flotillas y Transporte
            </span>
            <h2 className="text-xl font-black text-gray-900">TrackTracer & SGL</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Plataforma robusta diseñada para monitoreo logístico, control de rutas, detección de paradas no autorizadas y apagado de motor seguro desde central o teléfono móvil.
            </p>
          </div>
          <ul className="text-xs text-gray-600 space-y-2.5">
            <li className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Rastreo continuo cada 30 segundos con mapas de alta precisión.</span>
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Comando remoto de corte a marcha / inmovilización.</span>
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Geocercas poligonales con alertas inmediatas a celular.</span>
            </li>
          </ul>
        </div>

        {/* SphereGT */}
        <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-xs space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-[#C9A15B]/20 text-[#8c6b2d] flex items-center justify-center font-bold">
            <Monitor className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-[#8c6b2d] uppercase tracking-wider">
              Telemetría Avanzada
            </span>
            <h2 className="text-xl font-black text-gray-900">SphereGT (SGL+)</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Diseñada para análisis profundo de operación: lecturas de computadora de abordo CANBus, control de consumo de combustible, horas de motor y hábitos de manejo.
            </p>
          </div>
          <ul className="text-xs text-gray-600 space-y-2.5">
            <li className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Gráficas en tiempo real de velocidad, combustible y temperatura.</span>
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Módulos de mantenimiento preventivo por kilometraje y horas.</span>
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Exportación de reportes ejecutivos en PDF y Excel para auditorías.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* CTA final */}
      <div className="rounded-3xl bg-[#4A0C18] text-white p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
        <div className="space-y-2 max-w-xl">
          <h3 className="text-xl font-black text-white">¿Buscas una solución para tu empresa?</h3>
          <p className="text-xs text-gray-300">
            Nuestros ingenieros configuran las plataformas y alertas a la medida de tu operación.
          </p>
        </div>
        <Link
          href="/contacto"
          className="px-6 py-3 rounded-xl bg-white text-[#7A1428] font-bold text-xs hover:bg-gray-100 transition-colors shrink-0"
        >
          Contactar a un Ingeniero
        </Link>
      </div>
    </div>
  );
}

