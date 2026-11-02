import React from "react";
import fs from "fs";
import path from "path";
import QRCode from "qrcode";
import sharp from "sharp";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  renderToBuffer,
} from "@react-pdf/renderer";
import { Quote } from "@/types/quote";
import { formatMxn } from "@/lib/pricing";
import { adminDb } from "@/lib/firebase/admin";
import { getProductImage } from "@/lib/catalog/product-image";

function formatearWhatsapp(tel?: string) {
  if (!tel) return "";
  const clean = tel.replace(/\D/g, "");
  if (clean.length === 10) {
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
  }
  if (clean.length === 12 && clean.startsWith("52")) {
    return `+52 ${clean.slice(2, 5)} ${clean.slice(5, 8)} ${clean.slice(8)}`;
  }
  return tel;
}

const styles = StyleSheet.create({
  page: {
    size: "LETTER",
    paddingTop: 28,
    paddingBottom: 28,
    paddingHorizontal: 32,
    fontFamily: "Helvetica",
    fontSize: 8.5,
    color: "#1C1C1E",
    backgroundColor: "#FFFFFF",
  },
  watermark: {
    position: "absolute",
    top: 320,
    left: 40,
    width: 520,
    transform: "rotate(-30deg)",
    opacity: 0.1,
    fontSize: 30,
    color: "#B91C1C",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  logo: {
    width: 140,
    height: 42,
    objectFit: "contain",
  },
  folioBox: {
    alignItems: "flex-end",
  },
  folioTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#7A1428",
    letterSpacing: 0.5,
  },
  folioSubtitle: {
    fontSize: 7.5,
    color: "#6B7280",
    marginTop: 2,
  },
  badge: {
    backgroundColor: "#F3F4F6",
    color: "#374151",
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginTop: 3,
    textTransform: "uppercase",
  },
  badgeActive: {
    backgroundColor: "#ECFDF5",
    color: "#065F46",
  },
  badgeExpired: {
    backgroundColor: "#FEF2F2",
    color: "#991B1B",
  },
  dividerBar: {
    height: 2.5,
    backgroundColor: "#7A1428",
    marginVertical: 6,
  },
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
  },
  infoCol: {
    flex: 1,
    paddingHorizontal: 4,
  },
  infoColTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#7A1428",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  infoTextBold: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  infoText: {
    fontSize: 7.5,
    color: "#4B5563",
    marginTop: 1,
  },
  table: {
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#7A1428",
    color: "#FFFFFF",
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderColor: "#E5E7EB",
    paddingVertical: 5,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  tableRowAlt: {
    backgroundColor: "#F9FAFB",
  },
  colConcepto: {
    flex: 5,
  },
  itemConceptoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemThumb: {
    width: 26,
    height: 26,
    objectFit: "contain",
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    marginRight: 6,
  },
  itemDetails: {
    flex: 1,
  },
  colCant: {
    flex: 1,
    textAlign: "center",
  },
  colPrecio: {
    flex: 2,
    textAlign: "right",
  },
  colTotal: {
    flex: 2,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
  },
  itemTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  itemModel: {
    fontSize: 6.8,
    color: "#6B7280",
    marginTop: 1,
  },
  itemBullet: {
    fontSize: 6.5,
    color: "#059669",
    marginTop: 1,
  },
  itemBulletWarn: {
    fontSize: 6.5,
    color: "#D97706",
    marginTop: 1,
  },
  totalsSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  planBox: {
    flex: 5.5,
    backgroundColor: "#F9FAFB",
    borderRadius: 6,
    padding: 8,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
    marginRight: 10,
  },
  planTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#7A1428",
    marginBottom: 3,
  },
  planDesc: {
    fontSize: 7.5,
    color: "#4B5563",
    lineHeight: 1.3,
  },
  planHighlight: {
    fontSize: 7.8,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginTop: 4,
  },
  recurringBox: {
    marginTop: 6,
    paddingTop: 5,
    borderTopWidth: 0.5,
    borderColor: "#E5E7EB",
  },
  recurringTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#1F2937",
  },
  recurringText: {
    fontSize: 7,
    color: "#6B7280",
    marginTop: 1,
  },
  totalsBox: {
    flex: 4.5,
    backgroundColor: "#F9FAFB",
    borderRadius: 6,
    padding: 8,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 1.5,
  },
  totalLabel: {
    fontSize: 7.5,
    color: "#4B5563",
  },
  totalVal: {
    fontSize: 7.5,
    color: "#111827",
    fontFamily: "Helvetica",
  },
  totalDiscount: {
    fontSize: 7.5,
    color: "#059669",
    fontFamily: "Helvetica-Bold",
  },
  totalOfficialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1.5,
    borderColor: "#7A1428",
    paddingTop: 4,
    marginTop: 3,
  },
  totalOfficialLabel: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#7A1428",
  },
  totalOfficialVal: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#7A1428",
  },
  qrAndTermsSection: {
    flexDirection: "row",
    backgroundColor: "#FAFAFA",
    borderRadius: 6,
    padding: 8,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
    marginBottom: 8,
    alignItems: "center",
  },
  qrImage: {
    width: 60,
    height: 60,
    marginRight: 8,
  },
  qrDescBox: {
    flex: 1,
  },
  qrTitle: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 2,
  },
  qrSubtitle: {
    fontSize: 7,
    color: "#4B5563",
    lineHeight: 1.3,
  },
  termsBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    padding: 7,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
    marginBottom: 8,
  },
  notasBox: {
    backgroundColor: "#FEFCE8",
    borderRadius: 6,
    padding: 7,
    borderWidth: 0.5,
    borderColor: "#FEF08A",
    marginBottom: 8,
  },
  notasTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#854D0E",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  notasText: {
    fontSize: 6.8,
    color: "#713F12",
    lineHeight: 1.25,
  },
  termsTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#374151",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  termItem: {
    fontSize: 6.8,
    color: "#4B5563",
    lineHeight: 1.25,
    marginBottom: 1.5,
  },
  footer: {
    borderTopWidth: 0.5,
    borderColor: "#E5E7EB",
    paddingTop: 5,
    alignItems: "center",
  },
  footerText: {
    fontSize: 6.8,
    color: "#6B7280",
    textAlign: "center",
  },
  footerContact: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#1F2937",
    marginTop: 1,
    textAlign: "center",
  },
});

interface QuotePdfDocumentProps {
  quote: Quote;
  qrDataUrl?: string;
  logoDataUrl?: string;
  itemThumbs?: Record<string, string>;
  esPrueba?: boolean;
}

export function QuotePdfDocument({
  quote,
  qrDataUrl,
  logoDataUrl,
  itemThumbs = {},
  esPrueba = false,
}: QuotePdfDocumentProps) {
  const vencida = quote.venceAt ? new Date(quote.venceAt).getTime() < Date.now() : false;
  const fechaEmision = new Date(quote.createdAt).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const vigenciaDias = quote.condiciones?.vigenciaDias || 15;
  const fechaVigencia = quote.venceAt
    ? new Date(quote.venceAt).toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : `${vigenciaDias} días naturales`;

  const planSeleccionadoKey = quote.condiciones?.planSeleccionado || "contado";
  const planInfo =
    quote.calculo?.planesPago?.[planSeleccionadoKey] ||
    quote.calculo?.planesPago?.["contado"];

  const estadoInstalacion =
    quote.instalacion?.estadoNombre ||
    quote.estadoInstalacion?.nombre ||
    quote.instalacion?.estadoClave ||
    "Zona no especificada";
  const municipioInstalacion = quote.instalacion?.municipio;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Marca de agua si son datos bancarios de prueba */}
        {esPrueba && (
          <Text style={styles.watermark}>DATOS BANCARIOS DE PRUEBA</Text>
        )}

        {/* Encabezado Superior */}
        <View style={styles.headerRow}>
          {logoDataUrl ? (
            <Image src={logoDataUrl} style={styles.logo} />
          ) : (
            <Text style={{ fontSize: 18, fontFamily: "Helvetica-Bold", color: "#7A1428" }}>
              CosoTec by CoSoAVL
            </Text>
          )}

          <View style={styles.folioBox}>
            <Text style={styles.folioTitle}>Cotización {quote.folio}</Text>
            <Text style={styles.folioSubtitle}>
              Emisión: {fechaEmision} • Válida hasta: {fechaVigencia}
            </Text>
            <Text
              style={[
                styles.badge,
                vencida ? styles.badgeExpired : styles.badgeActive,
              ]}
            >
              {vencida ? "Cotización Vencida" : "Cotización Vigente"}
            </Text>
          </View>
        </View>

        {/* Barra vino divisoria */}
        <View style={styles.dividerBar} />

        {/* Grilla Informativa de 3 Columnas */}
        <View style={styles.infoGrid}>
          {/* Col 1: Cliente */}
          <View style={styles.infoCol}>
            <Text style={styles.infoColTitle}>Cliente</Text>
            <Text style={styles.infoTextBold}>
              {quote.cliente.nombre || "Cliente"}
            </Text>
            {Boolean(quote.cliente.empresa) && (
              <Text style={styles.infoText}>{quote.cliente.empresa}</Text>
            )}
            {Boolean(quote.cliente.telefono) && (
              <Text style={styles.infoText}>WhatsApp: {quote.cliente.telefono}</Text>
            )}
            {Boolean(quote.cliente.correo) && (
              <Text style={styles.infoText}>Correo: {quote.cliente.correo}</Text>
            )}
            {Boolean(quote.cliente.rfc) && (
              <Text style={styles.infoText}>RFC: {quote.cliente.rfc}</Text>
            )}
          </View>

          {/* Col 2: Asesor */}
          <View style={styles.infoCol}>
            <Text style={styles.infoColTitle}>Asesor Comercial</Text>
            <Text style={styles.infoTextBold}>
              {quote.vendedorNombre || "Asesor CoSoAVL"}
            </Text>
            {Boolean(quote.vendedorWhatsapp) && (
              <Text style={styles.infoText}>
                WhatsApp: {formatearWhatsapp(quote.vendedorWhatsapp)}
              </Text>
            )}
            {Boolean(quote.vendedorEmail) && (
              <Text style={styles.infoText}>
                Correo: {quote.vendedorEmail}
              </Text>
            )}
            <Text style={styles.infoText}>CosoTec by CoSoAVL</Text>
            <Text style={styles.infoText}>Metepec, Estado de México</Text>
          </View>

          {/* Col 3: Instalación */}
          <View style={styles.infoCol}>
            <Text style={styles.infoColTitle}>Instalación y Viáticos</Text>
            <Text style={styles.infoTextBold}>{estadoInstalacion}</Text>
            {Boolean(municipioInstalacion) && (
              <Text style={styles.infoText}>
                Municipio: {municipioInstalacion}
              </Text>
            )}
            <Text style={styles.infoText}>
              Estatus: {quote.calculo?.viaticosDescripcion || "Sin costo en zona metropolitana"}
            </Text>
          </View>
        </View>

        {/* Tabla de Conceptos */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colConcepto}>Concepto / Descripción</Text>
            <Text style={styles.colCant}>Cant.</Text>
            <Text style={styles.colPrecio}>P. Unit. (s/IVA)</Text>
            <Text style={styles.colTotal}>Importe</Text>
          </View>

          {quote.items.map((it, idx) => {
            const rowTotal = it.precioSinIvaCentavos * it.cantidad;
            const isAlt = idx % 2 === 1;
            const thumb = (it.id && itemThumbs[it.id]) || itemThumbs[it.nombre];
            return (
              <View
                key={idx}
                style={[styles.tableRow, isAlt ? styles.tableRowAlt : {}]}
              >
                <View style={styles.colConcepto}>
                  <View style={styles.itemConceptoRow}>
                    {thumb ? <Image src={thumb} style={styles.itemThumb} /> : null}
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemTitle}>{it.nombre}</Text>
                      {it.modeloConfirmado && it.modelo ? (
                        <Text style={styles.itemModel}>Modelo: {it.modelo}</Text>
                      ) : null}
                      {it.incluyeInstalacion && (
                        <Text style={styles.itemBullet}>
                          ✓ Instalación profesional incluida
                        </Text>
                      )}
                      {it.incluyePlanPrimerAnio && (
                        <Text style={styles.itemBullet}>
                          ✓ 1er año de plataforma y datos SIM 4G incluido
                        </Text>
                      )}
                      {it.incluyeInstalacion === false && (
                        <Text style={styles.itemBulletWarn}>
                          + Requiere instalación por separado
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
                <Text style={styles.colCant}>{it.cantidad}</Text>
                <Text style={styles.colPrecio}>
                  {formatMxn(it.precioSinIvaCentavos)}
                </Text>
                <Text style={styles.colTotal}>{formatMxn(rowTotal)}</Text>
              </View>
            );
          })}
        </View>

        {/* Resumen de Plan y Totales */}
        <View style={styles.totalsSection}>
          {/* Plan de Pago y Costos Posteriores */}
          <View style={styles.planBox}>
            <Text style={styles.planTitle}>
              Plan de Pago: {planInfo?.nombre || "Contado"}
            </Text>
            <Text style={styles.planDesc}>
              {planInfo?.descripcion ||
                (planSeleccionadoKey === "credi_contado"
                  ? "55% al confirmar y 45% al instalar (pagado por link)"
                  : "100% de contado al confirmar el pedido.")}
            </Text>

            {planInfo && (
              <View style={{ marginTop: 4 }}>
                <Text style={styles.planHighlight}>
                  Primer Pago: {formatMxn(planInfo.montoPrimerPagoCentavos)}
                </Text>
                {planInfo.saldoRestanteCentavos > 0 && (
                  <Text style={styles.planHighlight}>
                    Saldo Restante: {formatMxn(planInfo.saldoRestanteCentavos)}
                  </Text>
                )}
              </View>
            )}

            {/* Costos Recurrentes si existen */}
            {quote.calculo?.costosRecurrentes &&
              quote.calculo.costosRecurrentes.length > 0 && (
                <View style={styles.recurringBox}>
                  <Text style={styles.recurringTitle}>
                    Servicios Recurrentes Posteriores (A partir del 2° año):
                  </Text>
                  {quote.calculo.costosRecurrentes.map((cr, idx) => (
                    <Text key={idx} style={styles.recurringText}>
                      • {cr.concepto}: {cr.montoFormateado} ({cr.periodo})
                    </Text>
                  ))}
                </View>
              )}
          </View>

          {/* Bloque Financiero y Totales */}
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal Bruto:</Text>
              <Text style={styles.totalVal}>
                {quote.calculo?.formato?.subtotalBruto ||
                  formatMxn(quote.calculo?.subtotalBrutoCentavos || 0)}
              </Text>
            </View>

            {Boolean(quote.calculo?.aplicaDescuentoVolumen) && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  Desc. Volumen ({quote.calculo?.porcentajeDescuentoVolumen}%):
                </Text>
                <Text style={styles.totalDiscount}>
                  -{quote.calculo?.formato?.descuentoVolumen}
                </Text>
              </View>
            )}

            {Boolean(
              quote.calculo?.descuentoVendedorPorcentaje &&
                quote.calculo.descuentoVendedorPorcentaje > 0
            ) && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  Desc. Adicional ({quote.calculo?.descuentoVendedorPorcentaje}%):
                </Text>
                <Text style={styles.totalDiscount}>
                  -{quote.calculo?.formato?.descuentoVendedor}
                </Text>
              </View>
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Viáticos Instalación:</Text>
              <Text style={styles.totalVal}>
                {quote.calculo?.formato?.viaticos ||
                  formatMxn(quote.calculo?.viaticosCentavos || 0)}
              </Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                IVA ({quote.calculo?.ivaPorcentaje || 16}%):
              </Text>
              <Text style={styles.totalVal}>
                {quote.calculo?.formato?.iva ||
                  formatMxn(quote.calculo?.ivaCentavos || 0)}
              </Text>
            </View>

            <View style={styles.totalOfficialRow}>
              <Text style={styles.totalOfficialLabel}>Total Oficial:</Text>
              <Text style={styles.totalOfficialVal}>
                {quote.calculo?.formato?.total ||
                  formatMxn(quote.calculo?.totalCentavos || 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Sección de QR y Pago en Línea */}
        {qrDataUrl && (
          <View style={styles.qrAndTermsSection}>
            <Image src={qrDataUrl} style={styles.qrImage} />
            <View style={styles.qrDescBox}>
              <Text style={styles.qrTitle}>
                Acceso Digital y Pago Seguro en Línea
              </Text>
              <Text style={styles.qrSubtitle}>
                Escanea este código QR con la cámara de tu celular para consultar esta cotización en la plataforma web oficial, ver el desglose en tiempo real y realizar tu pago de forma segura con tarjeta de crédito/débito o transferencia SPEI.
              </Text>
            </View>
          </View>
        )}

        {/* Notas para el Cliente si existen */}
        {Boolean(quote.condiciones?.notasCliente) && (
          <View style={styles.notasBox}>
            <Text style={styles.notasTitle}>Notas e Instrucciones para el Cliente</Text>
            <Text style={styles.notasText}>{quote.condiciones?.notasCliente}</Text>
          </View>
        )}

        {/* Términos Comerciales Oficiales */}
        <View style={styles.termsBox}>
          <Text style={styles.termsTitle}>Condiciones Comerciales y de Servicio</Text>
          <Text style={styles.termItem}>
            1. Precios expresados en Pesos Mexicanos (MXN). Los conceptos desglosan el 16% de Impuesto al Valor Agregado (IVA).
          </Text>
          <Text style={styles.termItem}>
            2. Cotización válida por {vigenciaDias} días naturales a partir de la fecha de emisión indicada en el encabezado.
          </Text>
          <Text style={styles.termItem}>
            3. Instalación profesional sin costo de viáticos en las zonas metropolitanas de Toluca, Metepec, CDMX, Monterrey, Guadalajara y Querétaro capital. Fuera de las zonas metropolitanas indicadas, los viáticos se cotizan por separado.
          </Text>
          <Text style={styles.termItem}>
            4. Para confirmar el pedido y programar la visita técnica de instalación se requiere el cumplimiento del esquema de pago acordado.
          </Text>
          <Text style={styles.termItem}>
            5. Los precios y condiciones quedan congelados durante la vigencia de la cotización; posterior a su vencimiento, se requiere actualización de propuesta comercial.
          </Text>
        </View>

        {/* Pie Oficial CoSoAVL */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            CoSoAVL · Consultoría y Soluciones AVL Telecomunicaciones · Metepec, Estado de México
          </Text>
          <Text style={styles.footerContact}>
            Matriz: 722 134 0127 • WhatsApp: 722 432 2053 • ventas@cosoavl.com
          </Text>
        </View>
      </Page>
    </Document>
  );
}

/**
 * Genera el Buffer binario del PDF oficial para la cotización dada.
 */
export async function generarCotizacionPdfBuffer(
  quote: Quote,
  appBaseUrl?: string
): Promise<Buffer> {
  // 1. Cargar Logo en Base64
  let logoDataUrl: string | undefined;
  try {
    const logoPath = path.join(process.cwd(), "public", "logo-cosotec.png");
    if (fs.existsSync(logoPath)) {
      const buf = fs.readFileSync(logoPath);
      logoDataUrl = `data:image/png;base64,${buf.toString("base64")}`;
    }
  } catch (err) {
    console.warn("[PDF] No se pudo cargar el logo:", err);
  }

  // 2. Comprobar si settings/bank tiene esPrueba
  let esPrueba = false;
  try {
    const bankSnap = await adminDb.collection("settings").doc("bank").get();
    if (bankSnap.exists) {
      esPrueba = Boolean(bankSnap.data()?.esPrueba);
    }
  } catch {
    esPrueba = false;
  }

  // 3. Cargar miniaturas de productos para la tabla
  const itemThumbs: Record<string, string> = {};
  for (const it of quote.items || []) {
    try {
      let imgRel = it.fotoUrl;
      if (!imgRel) {
        imgRel = getProductImage({ slug: it.nombre, categoria: it.categoria });
      }
      const filename = path.basename(imgRel);
      let absPath = path.join(process.cwd(), "public", "products", filename);
      if (!fs.existsSync(absPath) && filename.endsWith(".webp")) {
        const pngCandidate = path.join(process.cwd(), "public", "products", filename.replace(/\.webp$/, ".png"));
        if (fs.existsSync(pngCandidate)) {
          absPath = pngCandidate;
        }
      }
      if (fs.existsSync(absPath)) {
        const thumbBuf = await sharp(absPath)
          .resize(56, 56, {
            fit: "contain",
            background: { r: 255, g: 255, b: 255, alpha: 1 },
          })
          .png()
          .toBuffer();
        const dataUrl = `data:image/png;base64,${thumbBuf.toString("base64")}`;
        if (it.id) itemThumbs[it.id] = dataUrl;
        itemThumbs[it.nombre] = dataUrl;
      }
    } catch (err) {
      console.warn(`[PDF] No se pudo cargar miniatura para ${it.nombre}:`, err);
    }
  }

  // 4. Generar Código QR apuntando a la URL pública de la cotización
  let qrDataUrl: string | undefined;
  try {
    const baseUrl =
      appBaseUrl ||
      process.env.APP_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://cosotec--cosotec7.us-east4.hosted.app";

    const token = quote.token || "";
    const publicUrl = `${baseUrl}/c/${quote.folio}${token ? `?t=${token}` : ""}`;
    qrDataUrl = await QRCode.toDataURL(publicUrl, {
      margin: 1,
      width: 140,
    });
  } catch (err) {
    console.warn("[PDF] No se pudo generar el QR:", err);
  }

  // 5. Renderizar a Buffer
  const doc = (
    <QuotePdfDocument
      quote={quote}
      qrDataUrl={qrDataUrl}
      logoDataUrl={logoDataUrl}
      itemThumbs={itemThumbs}
      esPrueba={esPrueba}
    />
  );

  return (await renderToBuffer(doc)) as Buffer;
}
