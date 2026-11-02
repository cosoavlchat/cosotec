import { getContentLegales } from "@/lib/services/content-service";
import { AlertTriangle, ShieldCheck, Mail, Phone } from "lucide-react";
import { CORREO_VENTAS, TELEFONO_MATRIZ } from "@/lib/utils/whatsapp";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aviso de Privacidad (Borrador en Revisión) | CosoTec by CoSoAVL",
  description: "Aviso de Privacidad de CosoTec by CoSoAVL. Documento en proceso de validación.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PrivacidadPage() {
  const legales = await getContentLegales();

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
      {/* Aviso de Documento en Revisión */}
      <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h2 className="font-bold text-sm tracking-tight">Documento en revisión</h2>
          <p className="text-xs text-amber-800 leading-relaxed">
            {legales.avisoRevision || "Documento en revisión."}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-[#7A1428]">
          Aspectos Legales
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
          Aviso de Privacidad Integral
        </h1>
        <p className="text-xs text-gray-500">
          CoSoAVL · Metepec, Estado de México
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-xs space-y-6 text-xs text-gray-700 leading-relaxed">
        <section className="space-y-2">
          <h3 className="font-bold text-gray-900 text-sm">1. Identidad y Domicilio del Responsable</h3>
          <p>
            CoSoAVL, con domicilio en Metepec, Estado de México, es responsable del uso y protección de sus datos personales en apego a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-gray-900 text-sm">2. Finalidades del Tratamiento de Datos</h3>
          <p>
            Los datos personales recabados a través de nuestro sitio web, cotizaciones y formularios de contacto se destinan a las siguientes finalidades primarias:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li>Elaborar y dar seguimiento a cotizaciones técnicas y comerciales solicitadas.</li>
            <li>Gestionar pedidos, facturación fiscal (CFDI 4.0) y cobranza de equipos y servicios.</li>
            <li>Coordinar y ejecutar agendas de instalación técnica y soporte postventa en campo.</li>
            <li>Habilitar accesos a las plataformas satelitales de rastreo y video contratadas.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-gray-900 text-sm">3. Derechos ARCO y Contacto</h3>
          <p>
            Usted tiene derecho a conocer qué datos personales tenemos, para qué los utilizamos y las condiciones de su uso (Acceso); solicitar la corrección de su información desactualizada o inexacta (Rectificación); que la eliminemos de nuestros registros cuando considere que no está siendo utilizada adecuadamente (Cancelación); así como oponerse al uso de sus datos para fines específicos (Oposición).
          </p>
          <p>
            Para ejercer sus derechos ARCO o consultar la versión final aprobada de este aviso, puede comunicarse a través de:
          </p>
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
            <p className="font-semibold text-gray-900">Oficina de Privacidad y Cumplimiento CoSoAVL</p>
            <p>Correo: <a href={`mailto:${CORREO_VENTAS}`} className="text-[#7A1428] underline">{CORREO_VENTAS}</a></p>
            <p>Teléfono: <a href="tel:7221340127" className="text-[#7A1428] underline">{TELEFONO_MATRIZ}</a></p>
          </div>
        </section>
      </div>
    </div>
  );
}

