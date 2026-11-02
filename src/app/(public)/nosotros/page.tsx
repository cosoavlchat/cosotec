import { getContentStats } from "@/lib/services/content-service";
import { ShieldCheck, Award, Users, MapPin, Cpu, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre CoSoAVL",
  description:
    "Liderazgo en telemetría, rastreo GPS y seguridad vehicular en México. Más de 48,000 dispositivos vendidos.",
  alternates: {
    canonical: "/nosotros",
  },
  openGraph: {
    title: "Sobre CoSoAVL | CosoTec by CoSoAVL",
    description:
      "Liderazgo en telemetría, rastreo GPS y seguridad vehicular en México. Más de 48,000 dispositivos vendidos.",
    url: "/nosotros",
  },
};

export default async function NosotrosPage() {
  const stats = await getContentStats();

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-16">
      {/* Hero */}
      <div className="space-y-4 max-w-3xl">
        <span className="text-xs font-bold uppercase tracking-wider text-[#7A1428]">
          Acerca de CoSoAVL
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight">
          Ingeniería Mexicana en Telemetría y Seguridad
        </h1>
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
          CoSoAVL nació con el compromiso de brindar a las empresas mexicanas el control absoluto de sus vehículos y transporte de carga, combinando electrónica automotriz de grado industrial y plataformas telemáticas avanzadas.
        </p>
      </div>

      {/* Cifras de Impacto Veraces */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 rounded-3xl bg-white border border-gray-200/80 shadow-xs space-y-2">
          <span className="text-4xl font-black text-[#7A1428] block">{stats.cifraDispositivos}</span>
          <h3 className="font-bold text-gray-900 text-sm">Dispositivos Vendidos</h3>
          <p className="text-xs text-gray-500 leading-relaxed">{stats.dispositivosTexto}</p>
        </div>

        <div className="p-8 rounded-3xl bg-white border border-gray-200/80 shadow-xs space-y-2">
          <div className="flex items-center gap-1.5 text-emerald-600">
            <ShieldCheck className="w-6 h-6 shrink-0" />
            <span className="font-bold text-xs uppercase tracking-wider">Experiencia</span>
          </div>
          <h3 className="font-bold text-gray-900 text-sm">Soporte y Flotas</h3>
          <p className="text-xs text-gray-500 leading-relaxed">{stats.gobiernosTexto}</p>
        </div>

        <div className="p-8 rounded-3xl bg-white border border-gray-200/80 shadow-xs space-y-2">
          <div className="flex items-center gap-1.5 text-[#C9A15B]">
            <Award className="w-6 h-6 shrink-0" />
            <span className="font-bold text-xs uppercase tracking-wider">Seguridad</span>
          </div>
          <h3 className="font-bold text-gray-900 text-sm">Recuperación con la ANERPV</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Asistencia para recuperación de unidades en coordinación con la Asociación Nacional de Empresas de Rastreo y Protección Vehicular.
          </p>
        </div>
      </div>

      {/* Pilares */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-200/80 shadow-xs space-y-8">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Nuestros Pilares de Operación</h2>
          <p className="text-xs text-gray-500">Por qué las empresas eligen CoSoAVL frente a corporativos multinacionales.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
          <div className="space-y-2">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#7A1428]" />
              <span>Capital y Soporte 100% Mexicano</span>
            </h3>
            <p className="text-gray-600 leading-relaxed pl-6">
              Soporte humano directo desde nuestra matriz en Metepec, Estado de México, sin intermediarios ni bots que no conocen las carreteras del país.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#7A1428]" />
              <span>Plataformas Telemáticas Confiables</span>
            </h3>
            <p className="text-gray-600 leading-relaxed pl-6">
              Acceso a plataformas consolidadas como TrackTracer y SphereGT para rastreo en tiempo real y telemetría de flotas industriales y particulares.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#7A1428]" />
              <span>Instaladores Técnicos Calificados</span>
            </h3>
            <p className="text-gray-600 leading-relaxed pl-6">
              Personal capacitado en protocolos automotrices que realiza instalaciones discretas y seguras sin afectar los sistemas de tu unidad.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#7A1428]" />
              <span>Precios Transparentes y Públicos</span>
            </h3>
            <p className="text-gray-600 leading-relaxed pl-6">
              Creemos en la honestidad comercial: nuestros precios se publican abiertos con IVA y sin letras chiquitas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

