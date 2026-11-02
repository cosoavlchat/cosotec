import React from "react";
import { Order } from "@/types/order";
import { formatMxn } from "@/lib/pricing";

interface AvisoSpeiEmailProps {
  order: Order;
  token: string;
  accion: "aprobado" | "rechazado";
  motivoRechazo?: string;
  siteUrl?: string;
}

export function AvisoSpeiEmail({
  order,
  token,
  accion,
  motivoRechazo,
  siteUrl = "https://cosotec.com",
}: AvisoSpeiEmailProps) {
  const { folio, contacto, totalCentavos } = order;
  const trackingUrl = `${siteUrl}/pedido/${folio}?t=${token}`;

  const esAprobado = accion === "aprobado";

  return (
    <div style={{ backgroundColor: "#F5F3F2", padding: "30px 15px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <table align="center" width="100%" style={{ maxWidth: "600px", backgroundColor: "#ffffff", borderRadius: "16px", overflow: "hidden", border: "1px solid #E5E7EB", borderCollapse: "separate" }}>
        {/* Header con color dependiente del estado */}
        <tbody>
          <tr>
            <td style={{ backgroundColor: esAprobado ? "#15803D" : "#991B1B", padding: "26px 30px", textAlign: "center" }}>
              <span style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px" }}>
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
              <p style={{ fontSize: "14px", color: "#374151", margin: "0 0 20px 0", lineHeight: "1.6" }}>
                Hola <strong>{contacto.nombre}</strong>,
              </p>

              {esAprobado ? (
                <div>
                  <p style={{ fontSize: "14px", color: "#374151", lineHeight: "1.6", margin: "0 0 20px 0" }}>
                    Nuestro departamento de contabilidad ha validado favorablemente tu transferencia SPEI en el estado de cuenta por un monto de <strong>{formatMxn(totalCentavos)}</strong>.
                  </p>
                  <div style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "12px", padding: "16px", marginBottom: "25px" }}>
                    <p style={{ color: "#166534", fontSize: "13px", margin: "0", fontWeight: "600" }}>
                      ✓ Tu cita técnica de instalación ha quedado formalmente programada.
                    </p>
                  </div>
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
                    Revisamos el comprobante de transferencia adjunto a tu pedido, pero la institución bancaria o administración no pudo validar el movimiento.
                  </p>

                  {/* Caja de Motivo de Rechazo */}
                  <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
                    <span style={{ color: "#991B1B", fontSize: "11px", fontWeight: "bold", textTransform: "uppercase" }}>
                      Motivo reportado por administración:
                    </span>
                    <p style={{ color: "#7F1D1D", fontSize: "14px", margin: "6px 0 0 0", fontWeight: "700" }}>
                      "{motivoRechazo || "El comprobante no es legible o el abono no se visualiza en el estado de cuenta."}"
                    </p>
                  </div>

                  <p style={{ fontSize: "13px", color: "#4B5563", lineHeight: "1.6", margin: "0 0 20px 0" }}>
                    Por favor asegúrate de que el archivo muestre claramente la <strong>clave de rastreo (SPEI)</strong>, la <strong>fecha</strong> y el <strong>monto exacto</strong> transferido.
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
              <div style={{ textAlign: "center", paddingTop: "15px", borderTop: "1px solid #F3F4F6", fontSize: "12px", color: "#6B7280" }}>
                ¿Dudas con tu transferencia? Escríbenos por WhatsApp al{" "}
                <a href="https://wa.me/527224322053" style={{ color: "#7A1428", fontWeight: "bold", textDecoration: "none" }}>
                  722 432 2053
                </a>
              </div>
            </td>
          </tr>

          {/* Footer */}
          <tr>
            <td style={{ backgroundColor: "#F9FAFB", padding: "16px 30px", borderTop: "1px solid #E5E7EB", textAlign: "center", fontSize: "11px", color: "#9CA3AF" }}>
              CosoTec by CoSoAVL · Monitoreo y Finanzas · {siteUrl}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
