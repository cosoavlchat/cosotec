import React from "react";
import { Order } from "@/types/order";
import { formatMxn } from "@/lib/pricing";

interface ConfirmacionPedidoEmailProps {
  order: Order;
  token: string;
  siteUrl?: string;
}

export function ConfirmacionPedidoEmail({
  order,
  token,
  siteUrl = "https://cosotec.com",
}: ConfirmacionPedidoEmailProps) {
  const { folio, contacto, items = [], totalCentavos, planPago, metodoPago } = order;
  const trackingUrl = `${siteUrl}/pedido/${folio}?t=${token}`;

  return (
    <div style={{ backgroundColor: "#F5F3F2", padding: "30px 15px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <table align="center" width="100%" style={{ maxWidth: "600px", backgroundColor: "#ffffff", borderRadius: "16px", overflow: "hidden", border: "1px solid #E5E7EB", borderCollapse: "separate" }}>
        {/* Brand Header */}
        <tbody>
          <tr>
            <td style={{ backgroundColor: "#7A1428", padding: "30px", textAlign: "center" }}>
              <div style={{ display: "inline-block", backgroundColor: "#5C0F1E", border: "1px solid rgba(201, 161, 91, 0.4)", borderRadius: "8px", padding: "6px 14px", marginBottom: "12px" }}>
                <span style={{ color: "#ffffff", fontWeight: "900", fontSize: "16px" }}>Coso<span style={{ color: "#C9A15B" }}>Tec</span></span>
              </div>
              <h1 style={{ color: "#ffffff", fontSize: "22px", margin: "0", fontWeight: "800" }}>
                ¡Gracias por tu compra, {contacto?.nombre ? contacto.nombre.split(" ")[0] : "Cliente"}!
              </h1>
              <p style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "13px", margin: "6px 0 0 0" }}>
                Hemos registrado con éxito tu orden técnica #{folio}
              </p>
            </td>
          </tr>

          {/* Main Body */}
          <tr>
            <td style={{ padding: "30px" }}>
              <p style={{ fontSize: "14px", color: "#374151", lineHeight: "1.6", margin: "0 0 20px 0" }}>
                Tu pedido se encuentra confirmado en nuestra plataforma de ingeniería satelital. Nuestro equipo ya inició la programación y preparación de tus dispositivos.
              </p>

              {/* Botón Principal de Seguimiento */}
              <div style={{ textAlign: "center", margin: "25px 0" }}>
                <a
                  href={trackingUrl}
                  style={{
                    backgroundColor: "#7A1428",
                    color: "#ffffff",
                    padding: "14px 28px",
                    borderRadius: "12px",
                    fontSize: "13px",
                    fontWeight: "bold",
                    textDecoration: "none",
                    display: "inline-block",
                    boxShadow: "0 2px 4px rgba(122, 20, 40, 0.2)",
                  }}
                >
                  Ver Seguimiento de mi Pedido →
                </a>
                <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "8px" }}>
                  Enlace seguro y privado con token de verificación
                </p>
              </div>

              {/* Resumen del Pedido */}
              <div style={{ backgroundColor: "#F9FAFB", padding: "18px", borderRadius: "12px", border: "1px solid #E5E7EB", marginBottom: "25px" }}>
                <h3 style={{ fontSize: "12px", color: "#7A1428", textTransform: "uppercase", margin: "0 0 10px 0", letterSpacing: "0.5px" }}>
                  Resumen de tu Inversión
                </h3>
                <table width="100%" style={{ fontSize: "13px", color: "#374151" }}>
                  <tbody>
                    {items.map((it) => (
                      <tr key={it.id}>
                        <td style={{ padding: "4px 0" }}>{it.cantidad}× {it.nombre}</td>
                        <td align="right" style={{ padding: "4px 0", fontWeight: "600" }}>
                          {formatMxn(it.totalSinIvaCentavos)}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ borderTop: "1px solid #E5E7EB" }}>
                      <td style={{ paddingTop: "10px", fontWeight: "bold" }}>Total (con IVA):</td>
                      <td align="right" style={{ paddingTop: "10px", fontWeight: "800", color: "#7A1428", fontSize: "15px" }}>
                        {formatMxn(totalCentavos)}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ color: "#6B7280", fontSize: "12px" }}>Método:</td>
                      <td align="right" style={{ color: "#6B7280", fontSize: "12px", textTransform: "uppercase" }}>
                        {metodoPago === "spei" ? "Transferencia SPEI" : "Mercado Pago"} ({planPago ? planPago.replace("_", " ") : "Contado"})
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Pasos Siguientes */}
              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "13px", color: "#111827", margin: "0 0 12px 0", fontWeight: "700" }}>
                  ¿Cuáles son los pasos siguientes?
                </h3>
                <table width="100%" style={{ fontSize: "12px", color: "#4B5563" }}>
                  <tbody>
                    <tr>
                      <td width="28" valign="top" style={{ fontWeight: "bold", color: "#7A1428" }}>1.</td>
                      <td style={{ paddingBottom: "10px" }}>
                        <strong>Configuración y Pruebas:</strong> Homologamos las SIM cards M2M multicarrier y configuramos tus equipos en la plataforma.
                      </td>
                    </tr>
                    <tr>
                      <td width="28" valign="top" style={{ fontWeight: "bold", color: "#7A1428" }}>2.</td>
                      <td style={{ paddingBottom: "10px" }}>
                        <strong>Llamada de Coordinación:</strong> Un asesor de soporte técnico te contactará al <strong>{contacto.telefono}</strong> para confirmar horario y técnico asignado.
                      </td>
                    </tr>
                    <tr>
                      <td width="28" valign="top" style={{ fontWeight: "bold", color: "#7A1428" }}>3.</td>
                      <td>
                        <strong>Instalación Certificada:</strong> Nuestro técnico arriba al punto convenido con herramienta y materiales para entrega lista.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Contacto Directo */}
              <div style={{ textAlign: "center", padding: "16px", backgroundColor: "#FEF2F2", borderRadius: "12px", border: "1px solid #FEE2E2" }}>
                <p style={{ margin: "0", fontSize: "12px", color: "#991B1B" }}>
                  ¿Tienes dudas o requieres ajustar la fecha?
                </p>
                <p style={{ margin: "4px 0 0 0", fontSize: "12px" }}>
                  Escríbenos directamente a WhatsApp:{" "}
                  <a href="https://wa.me/527224322053" style={{ color: "#7A1428", fontWeight: "bold", textDecoration: "none" }}>
                    722 432 2053
                  </a>
                </p>
              </div>
            </td>
          </tr>

          {/* Footer */}
          <tr>
            <td style={{ backgroundColor: "#F9FAFB", padding: "20px 30px", borderTop: "1px solid #E5E7EB", textAlign: "center", fontSize: "11px", color: "#9CA3AF" }}>
              <p style={{ margin: "0 0 4px 0" }}>CoSoAVL Telecomunicaciones · Metepec, Estado de México</p>
              <p style={{ margin: "0" }}>ventas@cosoavl.com · Tel. Matriz: 722 134 0127</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
