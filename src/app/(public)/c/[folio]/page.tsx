import Link from "next/link";
import { Metadata } from "next";
import { ShieldAlert, ShieldX, Clock, CheckCircle2, AlertTriangle, FileText, ArrowRight, Printer, MessageCircle, Phone, Download, HelpCircle } from "lucide-react";
import { obtenerCotizacionPorFolio, validarTokenCotizacion } from "@/lib/quotes";
import { registrarAperturaCotizacion } from "@/lib/services/quotes-service";
import { formatMxn } from "@/lib/pricing";

interface PageProps {
  params: Promise<{ folio: string }>;
  searchParams: Promise<{ t?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { folio } = await params;
  return {
    title: `Cotización ${folio} | CosoTec`,
    description: `Cotización oficial emitida por CosoTec para soluciones telemáticas y rastreo GPS.`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function CotizacionPublicaPage({ params, searchParams }: PageProps) {
  const { folio } = await params;
  const { t: token } = await searchParams;

  // CASO 1: Sin token en el enlace
  if (!token) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#F5F3F2]">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-gray-200/80 shadow-md text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-9 h-9" />
          </div>
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
              Enlace Protegido
            </span>
            <h1 className="text-2xl font-extrabold text-[#1C1C1E] tracking-tight">
              Se requiere token de seguridad
            </h1>
            <p className="text-sm text-gray-600 leading-relaxed">
              Por privacidad y seguridad comercial, las cotizaciones de CosoTec no son accesibles mediante folios abiertos.
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600 text-left space-y-1.5 border border-gray-100">
            <p className="font-semibold text-gray-900">¿Cómo acceder?</p>
            <p>
              Abre el enlace completo que te enviamos por WhatsApp o correo electrónico, el cual incluye el parámetro de autorización (<code className="bg-gray-200 px-1 py-0.5 rounded text-[11px]">?t=...</code>).
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <a
              href="https://wa.me/527224322053?text=Hola,%20tengo%20un%20problema%20para%20abrir%20mi%20cotizaci%C3%B3n"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              Pedir enlace por WhatsApp
            </a>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs transition-colors"
            >
              Ir al Inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Cargar cotización desde Firestore
  const quote = await obtenerCotizacionPorFolio(folio);

  // CASO 2: Cotización no existe
  if (!quote) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#F5F3F2]">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-gray-200/80 shadow-md text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-500 flex items-center justify-center mx-auto">
            <FileText className="w-9 h-9" />
          </div>
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-700">
              No Encontrada
            </span>
            <h1 className="text-2xl font-extrabold text-[#1C1C1E]">
              Cotización no localizada
            </h1>
            <p className="text-sm text-gray-600">
              No existe ningún registro con el folio <strong className="text-gray-900">{folio}</strong>. Es posible que haya expirado o el número sea incorrecto.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/cotizar"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#7A1428] hover:bg-[#5C0F1E] text-white font-bold text-xs transition-colors shadow-xs"
            >
              Crear Nueva Cotización
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // CASO 3: Token inválido o alterado
  const esTokenValido = validarTokenCotizacion(quote.tokenHash, token);
  if (!esTokenValido) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#F5F3F2]">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-rose-200/80 shadow-md text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
            <ShieldX className="w-9 h-9" />
          </div>
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200">
              Acceso Denegado
            </span>
            <h1 className="text-2xl font-extrabold text-[#1C1C1E]">
              Token de seguridad no válido
            </h1>
            <p className="text-sm text-gray-600">
              El token de acceso proporcionado para la cotización <strong className="text-gray-900">{folio}</strong> es incorrecto o ha sido alterado.
            </p>
          </div>

          <div className="bg-rose-50/50 rounded-xl p-3 text-xs text-rose-700 text-left border border-rose-100">
            Si recibiste este enlace de un vendedor de CosoTec, solicita que te reenvíe el enlace oficial vigente.
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <a
              href={`https://wa.me/527224322053?text=Hola,%20tengo%20un%20error%20de%20token%20en%20el%20folio%20${folio}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              Contactar por WhatsApp
            </a>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs transition-colors"
            >
              Ir al Inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // CASO 4: Token válido -> Registrar apertura (PRIVACIDAD: SIN IP NI USER AGENT)
  await registrarAperturaCotizacion(folio).catch((err) =>
    console.error("[Cotización] Error al registrar apertura:", err)
  );

  // CASO 5: Cotización pendiente de autorización interna
  if (quote.estado === "pendiente_autorizacion") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#F5F3F2]">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-amber-200/80 shadow-md text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <Clock className="w-9 h-9" />
          </div>
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
              En Revisión Interna
            </span>
            <h1 className="text-2xl font-extrabold text-[#1C1C1E]">
              Cotización en Proceso de Aprobación
            </h1>
            <p className="text-sm text-gray-600 leading-relaxed">
              Esta cotización se encuentra en revisión interna por la gerencia para validar los descuentos y condiciones solicitadas.
            </p>
          </div>
          <p className="text-xs text-gray-500">
            Tu asesor comercial te compartirá el enlace activo en cuanto se complete la autorización.
          </p>
          <div className="pt-2">
            <a
              href={`https://wa.me/52${quote.vendedorWhatsapp || "7224322053"}?text=Hola%20${encodeURIComponent(quote.vendedorNombre || "Asesor")},%20consulto%20el%20estatus%20de%20mi%20cotizaci%C3%B3n%20${quote.folio}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              Consultar con mi Asesor
            </a>
          </div>
        </div>
      </div>
    );
  }

  // CASO 6: Token válido -> Renderizar cotización
  const venceAtTimestamp = quote.venceAt ? new Date(quote.venceAt).getTime() : Date.now() + 86400000;
  const vencida = venceAtTimestamp < Date.now();
  const esVersionObsoleta = quote.esVersionActiva === false;
  const estaPagada = quote.estado === "pagada" || quote.estado === "pagada_parcial";
  const puedePagar = !vencida && !esVersionObsoleta && !estaPagada && (quote.estado === "enviada" || quote.estado === "vista");

  const fechaEmision = new Date(quote.createdAt).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const fechaVencimiento = quote.venceAt
    ? new Date(quote.venceAt).toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "15 días naturales";

  const vendedorWa = quote.vendedorWhatsapp || "7224322053";
  const vendedorNombre = quote.vendedorNombre || "Asesor CoSoAVL";

  return (
    <div className="min-h-screen bg-[#F5F3F2] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Banner de versión anterior */}
        {esVersionObsoleta && (
          <div className="rounded-2xl bg-amber-50 border border-amber-300 p-4 sm:p-5 flex items-start justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs sm:text-sm text-amber-900">
                <p className="font-bold">Hay una versión más reciente de esta cotización</p>
                <p>
                  Esta versión ({quote.folio}) ha sido sustituida por una actualización posterior y ya no permite pagos directos.
                </p>
              </div>
            </div>
            {quote.versionMasRecienteFolio && (
              <Link
                href={`/c/${quote.versionMasRecienteFolio}?t=${token}`}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors"
              >
                Ver versión actual
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        )}

        {/* Banner de cotización vencida */}
        {vencida && (
          <div className="rounded-2xl bg-rose-50 border border-rose-300 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs sm:text-sm text-rose-900">
                <p className="font-bold">Esta cotización venció, solicita una actualización a tu asesor</p>
                <p>
                  La vigencia concluyó el {fechaVencimiento}. Solicita a tu asesor una reactivación con las condiciones actuales.
                </p>
              </div>
            </div>
            <a
              href={`https://wa.me/52${vendedorWa}?text=Hola%20${encodeURIComponent(vendedorNombre)},%20mi%20cotizaci%C3%B3n%20${quote.folio}%20ha%20vencido.%20%C2%BFMe%20apoyas%20a%20actualizarla?`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Actualizar por WhatsApp
            </a>
          </div>
        )}

        {/* Banner de cotización con pagos registrados */}
        {estaPagada && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-300 p-4 sm:p-5 flex items-start gap-3 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs sm:text-sm text-emerald-900">
              <p className="font-bold">
                {quote.estado === "pagada" ? "Cotización Liquidada" : "Anticipo Registrado"}
              </p>
              <p>
                Esta cotización cuenta con pagos registrados en el sistema y se encuentra en etapa de coordinación técnica.
              </p>
            </div>
          </div>
        )}

        {/* Tarjeta Principal de la Cotización */}
        <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm overflow-hidden print:border-none print:shadow-none">
          {/* Encabezado vino oficial */}
          <div className="bg-[#7A1428] text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-[#C9A15B] font-bold">
                  Cotización Oficial
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                    vencida
                      ? "bg-rose-400/20 text-rose-200 border border-rose-400/30"
                      : esVersionObsoleta
                      ? "bg-amber-400/20 text-amber-200 border border-amber-400/30"
                      : estaPagada
                      ? "bg-emerald-400/20 text-emerald-200 border border-emerald-400/30"
                      : "bg-emerald-400/20 text-emerald-200 border border-emerald-400/30"
                  }`}
                >
                  {estaPagada
                    ? quote.estado === "pagada" ? "Pagada" : "Anticipo Pagado"
                    : esVersionObsoleta
                    ? "Versión Anterior"
                    : vencida
                    ? "Vencida"
                    : "Vigente"}
                </span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight mt-1 font-mono">
                {quote.folio}
              </h1>
              <p className="text-xs text-gray-200 mt-1">
                Emitida el {fechaEmision} • Válida hasta el {fechaVencimiento}
              </p>
            </div>

            <div className="text-left sm:text-right text-xs text-gray-200 space-y-0.5">
              <p className="font-bold text-white text-sm">CosoTec by CoSoAVL</p>
              <p>Asesor: <strong className="text-white">{vendedorNombre}</strong></p>
              <p>Metepec, Estado de México • WhatsApp {vendedorWa}</p>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {/* Ficha del cliente y destino de instalación */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-gray-50/70 border border-gray-100 text-xs">
              <div>
                <p className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">Cliente</p>
                <p className="font-extrabold text-gray-900 text-sm mt-0.5">
                  {quote.cliente.nombre || "Cliente Particular / Empresa"}
                </p>
                {quote.cliente.empresa && (
                  <p className="text-gray-600 font-medium">{quote.cliente.empresa}</p>
                )}
                <p className="text-gray-500 mt-1">Tel: {quote.cliente.telefono || "No especificado"}</p>
                {quote.cliente.correo && <p className="text-gray-500">{quote.cliente.correo}</p>}
              </div>

              <div>
                <p className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">
                  Zona de Instalación
                </p>
                <p className="font-extrabold text-gray-900 text-sm mt-0.5">
                  {quote.estadoInstalacion?.nombre || "No especificada (Se cotiza)"}
                </p>
                <p className="text-gray-600 mt-1">
                  Estatus de viáticos:{" "}
                  <span className="font-semibold text-gray-900">
                    {quote.calculo.viaticosDescripcion}
                  </span>
                </p>
                {quote.calculo.viaticosPorConfirmar && (
                  <p className="text-[11px] text-amber-700 font-medium mt-1">
                    * Los viáticos quedan pendientes por confirmar con el técnico según municipio exacto.
                  </p>
                )}
              </div>
            </div>

            {/* Tabla de Equipos y Accesorios (Snapshot de Precios) */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Desglose de Equipos y Conceptos
              </h2>

              <div className="border border-gray-200/80 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Concepto</th>
                      <th className="py-3 px-3 text-center">Cant.</th>
                      <th className="py-3 px-3 text-right">Precio Unit. (s/IVA)</th>
                      <th className="py-3 px-4 text-right">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {quote.items.map((it, idx) => {
                      const totalRenglon = it.precioSinIvaCentavos * it.cantidad;
                      return (
                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-bold text-gray-900">{it.nombre}</p>
                            {it.modelo && (
                              <p className="text-[11px] text-gray-500">Modelo: {it.modelo}</p>
                            )}
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {it.incluyeInstalacion && (
                                <span className="inline-flex items-center text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                                  ✓ Instalación profesional incluida
                                </span>
                              )}
                              {it.incluyePlanPrimerAnio && (
                                <span className="inline-flex items-center text-[10px] font-semibold text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded">
                                  ✓ 1er año plataforma y datos incluido
                                </span>
                              )}
                              {it.incluyeInstalacion === false && (
                                <span className="inline-flex items-center text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                                  + Requiere instalación por separado
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-gray-800">
                            {it.cantidad}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-gray-600">
                            {formatMxn(it.precioSinIvaCentavos)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                            {formatMxn(totalRenglon)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Costos recurrentes si aplican */}
            {quote.calculo.costosRecurrentes && quote.calculo.costosRecurrentes.length > 0 && (
              <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200/80 text-xs space-y-1.5">
                <p className="font-bold text-sky-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-sky-700" />
                  Servicios Recurrentes Posteriores (Informativo)
                </p>
                <p className="text-sky-800 text-[11px]">
                  Estos conceptos no se cobran al momento de la compra inicial; aplican al término del periodo de cortesía incluido:
                </p>
                <div className="mt-2 space-y-1">
                  {quote.calculo.costosRecurrentes.map((cr, idx) => (
                    <div key={idx} className="flex justify-between text-sky-950 font-medium">
                      <span>• {cr.concepto} ({cr.periodo})</span>
                      <span className="font-bold font-mono">{cr.montoFormateado}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resumen Financiero e IVA */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
              <div className="text-xs text-gray-500 space-y-2 max-w-sm">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1 text-[11px]">
                  <p className="font-bold text-gray-800">Garantía de Integridad CosoTec:</p>
                  <p>
                    • Precios calculados al centavo exacto en servidor.
                  </p>
                  <p>
                    • Si requieres factura CFDI 4.0, se emitirá con desglose de IVA exacto al liquidar.
                  </p>
                </div>
              </div>

              <div className="w-full sm:w-80 bg-gray-50/80 rounded-2xl p-4 border border-gray-200/70 text-xs space-y-2.5 font-mono">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal Bruto:</span>
                  <span className="font-semibold">{quote.calculo.formato.subtotalBruto}</span>
                </div>

                {quote.calculo.aplicaDescuentoVolumen && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Descuento Volumen ({quote.calculo.porcentajeDescuentoVolumen}%):</span>
                    <span>-{quote.calculo.formato.descuentoVolumen}</span>
                  </div>
                )}

                {quote.calculo.descuentoVendedorPorcentaje > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Descuento Vendedor ({quote.calculo.descuentoVendedorPorcentaje}%):</span>
                    <span>-{quote.calculo.formato.descuentoVendedor}</span>
                  </div>
                )}

                {(quote.calculo.aplicaDescuentoVolumen || quote.calculo.descuentoVendedorPorcentaje > 0) && (
                  <div className="flex justify-between text-gray-700 border-t border-gray-200 pt-1.5">
                    <span>Subtotal c/Descuento:</span>
                    <span className="font-semibold">{quote.calculo.formato.subtotalConDescuento}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span>Viáticos de Instalación:</span>
                  <span className="font-semibold">{quote.calculo.formato.viaticos}</span>
                </div>

                <div className="flex justify-between text-gray-600 border-t border-gray-200 pt-1.5">
                  <span>IVA ({quote.calculo.ivaPorcentaje}%):</span>
                  <span className="font-semibold">{quote.calculo.formato.iva}</span>
                </div>

                <div className="flex justify-between text-sm sm:text-base font-extrabold text-[#7A1428] border-t-2 border-[#7A1428]/30 pt-2 font-sans">
                  <span>Total Oficial:</span>
                  <span className="font-mono">{quote.calculo.formato.total}</span>
                </div>
              </div>
            </div>

            {/* Esquemas de Pago Disponibles */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Opciones de Pago Disponibles
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.values(quote.calculo.planesPago).map((plan, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-gray-200 hover:border-[#7A1428]/40 bg-white transition-all space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A15B]">
                        Plan {idx + 1}
                      </span>
                      <h3 className="font-bold text-gray-900 text-xs sm:text-sm mt-0.5">
                        {plan.nombre}
                      </h3>
                      <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                        {plan.descripcion}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-gray-100 space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray-500">Primer Pago:</span>
                        <span className="font-bold text-gray-900 font-mono">
                          {formatMxn(plan.montoPrimerPagoCentavos)}
                        </span>
                      </div>
                      {plan.saldoRestanteCentavos > 0 && (
                        <div className="flex justify-between text-[11px]">
                          <span className="text-gray-500">Saldo:</span>
                          <span className="font-bold text-gray-600 font-mono">
                            {formatMxn(plan.saldoRestanteCentavos)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <a
                  href={`/api/cotizaciones/${quote.folio}/pdf?t=${token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs transition-colors shadow-xs"
                >
                  <Download className="w-4 h-4 text-gray-600" />
                  Descargar PDF
                </a>

                <a
                  href={`https://wa.me/52${vendedorWa}?text=Hola%20${encodeURIComponent(vendedorNombre)},%20tengo%20preguntas%20sobre%20mi%20cotizaci%C3%B3n%20${quote.folio}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp Asesor
                </a>

                {puedePagar ? (
                  <Link
                    href={`/checkout?cotizacion=${quote.folio}&t=${token}`}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#7A1428] hover:bg-[#5C0F1E] text-white font-bold text-xs transition-colors shadow-xs"
                  >
                    Pagar Cotización en Línea
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <button
                    disabled
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-200 text-gray-500 font-bold text-xs cursor-not-allowed"
                    title={
                      vencida
                        ? "Cotización vencida"
                        : esVersionObsoleta
                        ? "Versión anterior no pagable"
                        : estaPagada
                        ? "Cotización ya pagada"
                        : "No disponible para pago directo"
                    }
                  >
                    {estaPagada ? "Cotización Pagada" : "Pago no disponible"}
                  </button>
                )}
              </div>

              <div className="text-xs text-gray-500 flex items-center gap-4">
                <a
                  href="tel:7221340127"
                  className="hover:text-gray-900 inline-flex items-center gap-1 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  722 134 0127
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

