import { getContentLegales } from "@/lib/services/content-service";
import { AlertTriangle, FileText, CheckCircle2 } from "lucide-react";
import { CORREO_VENTAS, TELEFONO_MATRIZ } from "@/lib/utils/whatsapp";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos Comerciales (Borrador en Revisión) | CosoTec by CoSoAVL",
  description: "Términos y condiciones comerciales de venta e instalación de CosoTec by CoSoAVL.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function TerminosPage() {
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
          Condiciones Comerciales
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
          Términos y Condiciones del Servicio
        </h1>
        <p className="text-xs text-gray-500">
          CoSoAVL · Última actualización en proceso
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-xs space-y-6 text-xs text-gray-700 leading-relaxed">
        <section className="space-y-2">
          <h3 className="font-bold text-gray-900 text-sm">1. Precios y Moneda</h3>
          <p>
            Todos los precios publicados en CosoTec se encuentran expresados en Pesos Mexicanos (MXN) e incluyen el Impuesto al Valor Agregado (IVA del 16%), salvo indicación expresa de desglose.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-gray-900 text-sm">2. Vigencia de Cotizaciones</h3>
          <p>
            Las cotizaciones generadas a través del panel de ventas o plataforma web tienen una vigencia estándar de 15 días naturales a partir de su emisión, sujetas a disponibilidad de existencias de hardware y viáticos aplicables por zona geográfica.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-gray-900 text-sm">3. Descuentos por Volumen</h3>
          <p>
            Aplica un 10% de descuento automático cuando la suma de cantidades de equipos principales es mayor a 5 (6 o más unidades), aplicable sobre todas las líneas de productos del pedido sin incluir viáticos.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-gray-900 text-sm">4. Instalaciones, Citas y Viáticos</h3>
          <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
            <li>Instalación por cita, con fecha y hora coordinadas en conjunto.</li>
            <li>Tiempo de entrega e instalación: 48–72 horas después del depósito o confirmación.</li>
            <li>Se requiere hora y lugar de instalación; tiempo promedio de 1.5 a 2.0 horas por unidad.</li>
            <li>Se requiere la información de la unidad: marca, modelo, año, placas y color.</li>
            <li>Incluye el primer año de plataforma y datos para monitoreo (cuando el producto lo incluya).</li>
            <li>Instalación profesional sin costo de viáticos en las zonas metropolitanas de Toluca, Metepec, CDMX, Monterrey, Guadalajara y Querétaro capital. Fuera de las zonas metropolitanas indicadas, los viáticos se cotizan por separado.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-gray-900 text-sm">5. Aclaraciones y Contacto</h3>
          <p>
            Para consultas comerciales formales o convenios empresariales, contacte al departamento de ventas:
          </p>
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
            <p className="font-semibold text-gray-900">CoSoAVL</p>
            <p>Correo: <a href={`mailto:${CORREO_VENTAS}`} className="text-[#7A1428] underline">{CORREO_VENTAS}</a></p>
            <p>Teléfono: <a href="tel:7221340127" className="text-[#7A1428] underline">{TELEFONO_MATRIZ}</a></p>
          </div>
        </section>
      </div>
    </div>
  );
}

