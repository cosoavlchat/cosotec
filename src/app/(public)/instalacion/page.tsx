import { getTravelFees, getZonasSinCosto } from "@/lib/services/pricing-service";
import { precioConIva, formatMxn } from "@/lib/pricing";
import { Clock, ShieldCheck, MapPin, CheckCircle2, MessageCircle, Info } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Instalación y Cobertura Nacional",
  description:
    "Instalación profesional en 48 a 72 horas hábiles. Ciudades sin costo de viáticos y tabla por estado.",
  alternates: {
    canonical: "/instalacion",
  },
  openGraph: {
    title: "Instalación y Cobertura Nacional | CosoTec by CoSoAVL",
    description:
      "Instalación profesional en 48 a 72 horas hábiles. Ciudades sin costo de viáticos y tabla por estado.",
    url: "/instalacion",
  },
};

export default async function InstalacionPage() {
  const [travelFees, zonasSinCosto] = await Promise.all([
    getTravelFees(),
    getZonasSinCosto(),
  ]);

  const whatsappUrl = buildWhatsAppLink({
    pagina: "/instalacion",
    tipoConsulta: "instalacion",
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-16">
      {/* Header */}
      <div className="space-y-3 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7A1428]/10 text-[#7A1428] text-xs font-semibold">
          <MapPin className="w-3.5 h-3.5" />
          <span>Cobertura Nacional en los 32 Estados</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
          Instalación Profesional y Viáticos por Estado
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
          Nuestros técnicos certificados instalan en tus patios, talleres o domicilio sin cortar arneses originales del vehículo mediante conectores y fusibles automotrices seguros.
        </p>
      </div>

      {/* Tiempos y Garantías Clave */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-gray-200/80 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#7A1428]/10 text-[#7A1428] flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-900 text-sm">48 a 72 Horas Hábiles</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Tiempo estándar de agendamiento tras la confirmación de pago de tu cotización o pedido.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-gray-200/80 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#C9A15B]/20 text-[#7A1428] flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-900 text-sm">1.5 a 2 Horas por Unidad</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Instalación oculta hermética y pruebas de comunicación en plataforma y corte de motor.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-gray-200/80 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-900 text-sm">Sin Límite de Cupo</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Capacidad para equipar desde un auto particular hasta flotillas completas de transporte en cualquier punto del país.
          </p>
        </div>
      </div>

      {/* Ciudades Sin Costo */}
      <div className="bg-gradient-to-r from-[#4A0C18] to-[#7A1428] text-white rounded-3xl p-8 sm:p-10 shadow-md space-y-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#C9A15B]">
              Beneficio de Cobertura Directa
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold uppercase">
              Delimitación por validar
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            Zonas Metropolitanas Sin Costo de Viáticos
          </h2>
          <p className="text-xs text-gray-200 max-w-3xl">
            Municipios metropolitanos delimitados con base en el marco oficial INEGI / CONAPO con viáticos de instalación incluidos. Para cualquier municipio foráneo o resto de cada entidad, los viáticos se cotizan según kilometraje y casetas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2 text-xs">
          {zonasSinCosto.map((zona) => (
            <div key={zona.id} className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-gray-100 block leading-snug">{zona.nombreZona}</span>
                <span className="shrink-0 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  Sin Costo
                </span>
              </div>
              <p className="text-[11px] text-gray-300 leading-relaxed line-clamp-3">
                {zona.municipios.join(", ")}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Matriz de Viáticos por Estado */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden space-y-4 p-6 sm:p-8">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-gray-900 tracking-tight">
            Tabla de Viáticos por Entidad Federativa (32 Estados)
          </h2>
          <p className="text-xs text-gray-500">
            Sin costo en zona metropolitana; resto del estado se cotiza para MEX, CDMX, JAL, NLE y QRO.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Estado / Clave</th>
                <th className="px-4 py-3">Costo de Viático por Visita</th>
                <th className="px-4 py-3">Costo por Unidad Adicional</th>
                <th className="px-4 py-3">Estatus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {travelFees.map((fee) => {
                const isMetroExempt = ["MEX", "CDMX", "JAL", "NLE", "QRO"].includes(fee.claveInegi);

                const textoVisita = isMetroExempt
                  ? "Sin costo en zona metropolitana; resto del estado se cotiza"
                  : fee.sinCosto
                  ? "Sin costo"
                  : fee.montoPorVisitaCentavos === 0
                  ? "Se cotiza"
                  : formatMxn(precioConIva(fee.montoPorVisitaCentavos, 16));

                const textoUnidad = isMetroExempt
                  ? "Sin costo en zona metropolitana; resto del estado se cotiza"
                  : fee.sinCosto
                  ? "Sin costo"
                  : fee.montoPorUnidadCentavos === 0
                  ? "Se cotiza"
                  : formatMxn(precioConIva(fee.montoPorUnidadCentavos, 16));

                return (
                  <tr key={fee.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-4 py-3 font-bold text-gray-900 flex items-center gap-2">
                      <span className="font-mono text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        {fee.claveInegi}
                      </span>
                      <span>{fee.estadoNombre}</span>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`font-semibold ${
                          isMetroExempt
                            ? "text-emerald-700"
                            : fee.sinCosto
                            ? "text-emerald-700"
                            : textoVisita === "Se cotiza"
                            ? "text-amber-700"
                            : "text-gray-900"
                        }`}
                      >
                        {textoVisita}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`font-semibold ${
                          isMetroExempt
                            ? "text-emerald-700"
                            : fee.sinCosto
                            ? "text-emerald-700"
                            : textoUnidad === "Se cotiza"
                            ? "text-amber-700"
                            : "text-gray-900"
                        }`}
                      >
                        {textoUnidad}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {isMetroExempt ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Zona Metropolitana
                        </span>
                      ) : fee.sinCosto ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Zona Exenta
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          Foráneo
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* CTA Instalación */}
        <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Info className="w-4 h-4 text-[#7A1428] shrink-0" />
            <span>¿Tienes flotillas en diferentes estados? Te cotizamos una ruta técnica consolidada.</span>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#7A1428] hover:bg-[#4A0C18] text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
          >
            <MessageCircle className="w-4 h-4 text-[#C9A15B]" />
            <span>Consultar fecha de instalación</span>
          </a>
        </div>
      </div>
    </div>
  );
}

