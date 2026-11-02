import React from "react";
import { Order } from "@/types/order";
import { formatMxn } from "@/lib/pricing";
import { EmailFooter } from "./EmailFooter";
import {
  limpiarTituloSaludo,
  getAppBaseUrl,
} from "./email-helpers";

interface AvisoSpeiEmailProps {
  order: Order;
  token: string;
  accion: "aprobado" | "rechazado";
  motivoRechazo?: string;
  siteUrl?: string;
  customFooter?: string;
  pagoId?: string;
}

export function AvisoSpeiEmail({
  order,
  token,
  accion,
  motivoRechazo,
  siteUrl,
  customFooter,
  pagoId,
}: AvisoSpeiEmailProps) {
  const { folio, contacto, totalCentavos, pagos = [], saldoRestanteCentavos, montoPrimerPagoCentavos } = order;
  const baseUrl = getAppBaseUrl(siteUrl);
  const trackingUrl = baseUrl ? `${baseUrl}/pedido/${folio}?t=${token}` : `/pedido/${folio}?t=${token}`;
  const nombreSaludo = limpiarTituloSaludo(contacto.nombre);

  const esAprobado = accion === "aprobado";

  // 4. Montos por pago: identificar el pago acreditado, lo pagado acumulado y el saldo pendiente
  const pagoActual = pagos.find((p) => p.id === pagoId) || pagos[0];
  const montoEstePago = pagoActual?.montoCentavos || montoPrimerPagoCentavos || totalCentavos;
  const pagadoAcumulado = pagos.length > 0
    ? pagos.filter((p) => p.estado === "aprobado").reduce((acc, p) => acc + p.montoCentavos, 0)
    : montoEstePago;
  const saldoPendiente = Math.max(0, totalCentavos - pagadoAcumulado);

  // Pagos restantes pendientes
  const pagosRestantes = pagos.filter((p) => p.estado === "pendiente");

  return (
    <div
      style={{
        backgroundColor: "#F5F3F2",
        padding: "30px 15px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <table
        align="center"
        width="100%"
        style={{
          maxWidth: "600px",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid #E5E7EB",
          borderCollapse: "separate",
        }}
      >
        {/* Header con color dependiente de la acción */}
        <tbody>
          <tr>
            <td
              style={{
                backgroundColor: esAprobado ? "#15803D" : "#991B1B",
                padding: "26px 30px",
                textAlign: "center",
              }}
            >
              <span
                style={{
                  color: "rgba(255, 255, 255, 0.8)",
                  fontSize: "11px",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                Validación de Transferencia Bancaria
              </span>
              <h1 style={{ color: "#ffffff", fontSize: "22px", margin: "6px 0 0 0", fontWeight: "800" }}>
                {esAprobado ? "¡Pago SPEI Acreditado con Éxito!" : "Atención: Comprobante SPEI No Acreditado"}
              </h1>
              <p style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "13px", margin: "4px 0 0 0" }}>
                Pedido Oficial #{folio}
              </p>
            </td>
          </tr>

          {/* Body */}
          <tr>
            <td style={{ padding: "30px" }}>
              <p style={{ fontSize: "15px", color: "#111827", margin: "0 0 16px 0", lineHeight: "1.6", fontWeight: "600" }}>
                Hola, {nombreSaludo}
              </p>

              {esAprobado ? (
                <div>
                  {/* Lenguaje neutro: sin 'departamento de contabilidad' */}
                  <p style={{ fontSize: "14px", color: "#374151", lineHeight: "1.6", margin: "0 0 20px 0" }}>
                    Hemos validado tu pago por <strong>{formatMxn(montoEstePago)}</strong> correspondiente a la exhibición <strong>{pagoActual?.concepto || "Pago de Orden"}</strong>.
                  </p>

                  {/* 4. Resumen financiero exacto de la exhibición */}
                  <div
                    style={{
                      backgroundColor: "#F0FDF4",
                      border: "1px solid #BBF7D0",
                      borderRadius: "12px",
                      padding: "18px",
                      marginBottom: "20px",
                    }}
                  >
                    <table width="100%" style={{ fontSize: "13px", color: "#166534" }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: "4px 0" }}>Monto Acreditado en este Pago:</td>
                          <td align="right" style={{ padding: "4px 0", fontWeight: "800", fontSize: "15px" }}>
                            {formatMxn(montoEstePago)}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: "4px 0" }}>Total Pagado Acumulado:</td>
                          <td align="right" style={{ padding: "4px 0", fontWeight: "700" }}>
                            {formatMxn(pagadoAcumulado)}
                          </td>
                        </tr>
                        <tr style={{ borderTop: "1px dashed #86EFAC" }}>
                          <td style={{ paddingTop: "8px", fontWeight: "bold" }}>Saldo Pendiente:</td>
                          <td align="right" style={{ paddingTop: "8px", fontWeight: "800" }}>
                            {formatMxn(saldoPendiente)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Calendario de pagos restantes si existen exhibiciones pendientes */}
                  {pagosRestantes.length > 0 && (
                    <div
                      style={{
                        backgroundColor: "#F9FAFB",
                        border: "1px solid #E5E7EB",
                        borderRadius: "12px",
                        padding: "16px",
                        marginBottom: "20px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "bold",
                          textTransform: "uppercase",
                          color: "#6B7280",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Próximas Exhibiciones Programadas
                      </span>
                      <table width="100%" style={{ fontSize: "12px", color: "#374151", marginTop: "8px" }}>
                        <tbody>
                          {pagosRestantes.map((pr) => (
                            <tr key={pr.id}>
                              <td style={{ padding: "4px 0" }}>{pr.concepto}</td>
                              <td align="right" style={{ padding: "4px 0", fontWeight: "700", color: "#7A1428" }}>
                                {formatMxn(pr.montoCentavos)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div style={{ textAlign: "center", margin: "25px 0" }}>
                    <a
                      href={trackingUrl}
                      style={{
                        backgroundColor: "#7A1428",
                        color: "#ffffff",
                        padding: "13px 26px",
                        borderRadius: "12px",
                        fontSize: "13px",
                        fontWeight: "bold",
                        textDecoration: "none",
                        display: "inline-block",
                      }}
                    >
                      Ver Estatus de mi Instalación →
                    </a>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: "14px", color: "#374151", lineHeight: "1.6", margin: "0 0 15px 0" }}>
                    Revisamos el comprobante de transferencia adjunto a tu pedido, pero no fue posible validar el abono en la cuenta bancaria.
                  </p>

                  {/* Caja de Motivo de Rechazo */}
                  <div
                    style={{
                      backgroundColor: "#FEF2F2",
                      border: "1px solid #FCA5A5",
                      borderRadius: "12px",
                      padding: "16px",
                      marginBottom: "20px",
                    }}
                  >
                    <span style={{ color: "#991B1B", fontSize: "11px", fontWeight: "bold", textTransform: "uppercase" }}>
                      Motivo reportado:
                    </span>
                    <p style={{ color: "#7F1D1D", fontSize: "14px", margin: "6px 0 0 0", fontWeight: "700" }}>
                      "{motivoRechazo || "El comprobante no es legible o el abono no se visualiza en el estado de cuenta."}"
                    </p>
                  </div>

                  <p style={{ fontSize: "13px", color: "#4B5563", lineHeight: "1.6", margin: "0 0 20px 0" }}>
                    Por favor asegúrate de que el archivo muestre claramente la <strong>clave de rastreo (SPEI)</strong>, la <strong>cuenta receptora de CoSoAVL</strong>, la <strong>fecha</strong> y el <strong>monto exacto</strong> transferido.
                  </p>

                  <div style={{ textAlign: "center", margin: "25px 0" }}>
                    <a
                      href={trackingUrl}
                      style={{
                        backgroundColor: "#991B1B",
                        color: "#ffffff",
                        padding: "13px 26px",
                        borderRadius: "12px",
                        fontSize: "13px",
                        fontWeight: "bold",
                        textDecoration: "none",
                        display: "inline-block",
                      }}
                    >
                      Subir Nuevo Comprobante Corregido →
                    </a>
                  </div>
                </div>
              )}

              {/* Ayuda y WhatsApp */}
              <div
                style={{
                  textAlign: "center",
                  paddingTop: "15px",
                  borderTop: "1px solid #F3F4F6",
                  fontSize: "12px",
                  color: "#6B7280",
                }}
              >
                ¿Dudas con tu transferencia? Escríbenos por WhatsApp al{" "}
                <a
                  href="https://wa.me/527224322053"
                  style={{ color: "#7A1428", fontWeight: "bold", textDecoration: "none" }}
                >
                  722 432 2053
                </a>
              </div>
            </td>
          </tr>

          {/* Footer Único y Común */}
          <EmailFooter customText={customFooter} />
        </tbody>
      </table>
    </div>
  );
}
