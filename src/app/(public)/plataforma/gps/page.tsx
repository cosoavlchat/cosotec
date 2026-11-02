import Link from "next/link";
import { Compass, CheckCircle2, ShieldCheck, Smartphone, ArrowRight, MessageCircle } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rastreo Satelital GPS en Tiempo Real | CosoTec by CoSoAVL",
  description:
    "Monitoreo GPS vía web y app móvil para flotas y vehículos particulares. Alarmas por geocerca, paro de motor remoto e historial de viajes.",
};

export default function PlataformaGpsPage() {
  const whatsappUrl = buildWhatsAppLink({
    pagina: "/plataforma/gps",
    tipoConsulta: "demo",
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-16">
      <div className="space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7A1428]/10 text-[#7A1428] text-xs font-semibold">
          <Compass className="w-3.5 h-3.5" />
          <span>Rastreo Satelital Vía Internet</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight">
          Monitoreo GPS en Vivo y Reportes AVL
        </h1>
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
          Accede a la posición exacta de cada vehículo desde cualquier navegador web o desde la app en tu teléfono inteligente las 24 horas del día.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/tienda/gps"
            className="px-6 py-3 rounded-xl bg-[#7A1428] hover:bg-[#4A0C18] text-white text-xs font-bold transition-all shadow-xs"
          >
            Ver Equipos GPS Disponibles
          </Link>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-xl bg-white border border-gray-300 text-gray-800 text-xs font-bold hover:border-[#7A1428] transition-all flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4 text-[#25D366]" />
            <span>Solicitar Demostración</span>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#7A1428]/10 text-[#7A1428] flex items-center justify-center font-bold">
            <Smartphone className="w-5 h-5" />
          </div>
          <h3 className="font-black text-gray-900 text-base">App Móvil iOS & Android</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Notificaciones push inmediatas al encender el motor, salir de una geocerca o desconectar la batería.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#7A1428]/10 text-[#7A1428] flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-black text-gray-900 text-base">Inmovilización Remota</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Corta la corriente de ignición desde tu celular para evitar que la unidad sea encendida o movida tras un robo.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#7A1428]/10 text-[#7A1428] flex items-center justify-center font-bold">
            <Compass className="w-5 h-5" />
          </div>
          <h3 className="font-black text-gray-900 text-base">Historial de Viajes y Paradas</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Consulta hasta 90 días de historial de recorridos, paradas no autorizadas, excesos de velocidad y kilómetros.
          </p>
        </div>
      </div>
    </div>
  );
}

