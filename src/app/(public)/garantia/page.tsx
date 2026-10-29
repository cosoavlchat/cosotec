import { getContentLegales } from "@/lib/services/content-service";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { CORREO_VENTAS, TELEFONO_MATRIZ, WHATSAPP_DISPLAY } from "@/lib/utils/whatsapp";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Póliza de Garantía (Borrador en Revisión) | CosoTec by CoSoAVL",
  description: "Política de garantía de hardware e instalación de CoSoAVL Telecomunicaciones.",
};

export default async function GarantiaPage() {
  const legales = await getContentLegales();

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
      {/* Aviso de Documento en Revisión */}
      <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h2 className="font-bold text-sm tracking-tight">Documento en Revisión</h2>
          <p className="text-xs text-amber-800 leading-relaxed">
            {legales.avisoRevision ||
              "Documento en revisión por el área jurídica y comercial de CoSoAVL. Esta versión es un borrador informativo sujeto a validación."}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-[#7A1428]">
          Soporte y Calidad
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
          Póliza de Garantía de Equipos e Instalación
        </h1>
        <p className="text-xs text-gray-500">
          CoSoAVL Telecomunicaciones S.A. de C.V. · Alcance técnico y condiciones
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-xs space-y-6 text-xs text-gray-700 leading-relaxed">
        <section className="space-y-2">
          <h3 className="font-bold text-gray-900 text-sm">1. Cobertura de Hardware</h3>
          <p>
            Los dispositivos GPS, DashCams, sensores y componentes electrónicos comercializados por CoSoAVL cuentan con garantía contra defectos de fabricación. Los términos específicos y periodos de cobertura por línea de producto se encuentran en proceso de formalización en la póliza definitiva.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-gray-900 text-sm">2. Garantía en Mano de Obra e Instalación</h3>
          <p>
            Toda instalación realizada por el equipo técnico certificado de CoSoAVL se efectúa respetando la integridad del arnés eléctrico original de la unidad, sin vulnerar las garantías de agencia del fabricante automotriz. Cualquier desperfecto derivado de la instalación es respaldado por nuestro servicio técnico.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-gray-900 text-sm">3. Exclusiones Generales</h3>
          <p>
            La garantía queda sin efecto si el equipo ha sido intervenido, alterado o desinstalado por personal no autorizado por CoSoAVL, o si presenta daños provocados por siniestros vehiculares severos, vandalismo, descargas eléctricas externas o manipulación indebida.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-gray-900 text-sm">4. Solicitud de Diagnóstico o Garantía</h3>
          <p>
            Para reportar una falla o coordinar la visita de un técnico de soporte:
          </p>
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
            <p className="font-semibold text-gray-900">Mesa de Soporte Técnico CoSoAVL</p>
            <p>WhatsApp Soporte: <a href="https://wa.me/5217224322053" className="text-[#7A1428] underline">{WHATSAPP_DISPLAY}</a></p>
            <p>Conmutador: <a href="tel:7221340127" className="text-[#7A1428] underline">{TELEFONO_MATRIZ}</a></p>
            <p>Correo: <a href={`mailto:${CORREO_VENTAS}`} className="text-[#7A1428] underline">{CORREO_VENTAS}</a></p>
          </div>
        </section>
      </div>
    </div>
  );
}

