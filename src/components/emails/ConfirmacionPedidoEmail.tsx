import React from "react";
import { Order } from "@/types/order";
import { formatMxn } from "@/lib/pricing";
import { EmailFooter } from "./EmailFooter";
import {
  limpiarTituloSaludo,
  formatTelefonoLocal,
  formatFechaEspanol,
  getAppBaseUrl,
} from "./email-helpers";

interface ConfirmacionPedidoEmailProps {
  order: Order;
  token: string;
  siteUrl?: string;
  customFooter?: string;
}

export function ConfirmacionPedidoEmail({
  order,
  token,
  siteUrl,
  customFooter,
}: ConfirmacionPedidoEmailProps) {
  const {
    folio,
    contacto,
    items = [],
    totalCentavos,
    saldoRestanteCentavos,
    montoPrimerPagoCentavos,
    planPago,
    metodoPago,
    estado,
    pagos = [],
  } = order;

  const baseUrl = getAppBaseUrl(siteUrl);
  const trackingUrl = `${baseUrl}/pedido/${folio}?t=${token}`;
  const nombreSaludo = limpiarTituloSaludo(contacto.nombre);
  const telefonoCliente = formatTelefonoLocal(contacto.telefono);

  // Determinar versión del correo: SPEI pendiente vs Pago con tarjeta acreditado
  const esSpeiPendiente =
    metodoPago === "spei" &&
    (estado === "pendiente_comprobante" || estado === "comprobante_subido");

  const esCrediContado = planPago === "credi_contado" || saldoRestanteCentavos > 0;
  const montoAnticipo = montoPrimerPagoCentavos || pagos[0]?.montoCentavos || totalCentavos;

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
        {/* Brand Header */}
        <tbody>
          <tr>
            <td
              style={{
                backgroundColor: esSpeiPendiente ? "#1E293B" : "#7A1428",
                padding: "30px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  backgroundColor: "rgba(0, 0, 0, 0.2)",
                  border: "1px solid rgba(201, 161, 91, 0.4)",
                  borderRadius: "8px",
                  padding: "5px 12px",
                  marginBottom: "12px",
                }}
              >
                <span style={{ color: "#ffffff", fontWeight: "900", fontSize: "15px" }}>
                  Coso<span style={{ color: "#C9A15B" }}>Tec</span>
                </span>
              </div>
              <h1 style={{ color: "#ffffff", fontSize: "21px", margin: "0", fontWeight: "800" }}>
                {esSpeiPendiente
                  ? "Pedido Registrado · Pendiente de Pago SPEI"
                  : "¡Pago Confirmado y Pedido en Proceso!"}
              </h1>
              <p style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "13px", margin: "6px 0 0 0" }}>
                Pedido Oficial #{folio}
              </p>
            </td>
          </tr>

          {/* Main Body */}
          <tr>
            <td style={{ padding: "30px" }}>
              <p style={{ fontSize: "15px", color: "#111827", lineHeight: "1.6", margin: "0 0 16px 0", fontWeight: "600" }}>
                Hola, {nombreSaludo}
              </p>

              {/* Mensaje principal según versión */}
              {esSpeiPendiente ? (
                <div>
                  <p style={{ fontSize: "14px", color: "#374151", lineHeight: "1.6", margin: "0 0 20px 0" }}>
                    Hemos registrado tu pedido <strong>#{folio}</strong>. Para proceder con la asignación de tus equipos y programar la fecha de instalación, realiza tu transferencia bancaria y sube tu comprobante mediante tu enlace seguro:
                  </p>

                  {/* Datos Bancarios Oficiales */}
                  <div
                    style={{
                      backgroundColor: "#F8FAFC",
                      border: "1px solid #CBD5E1",
                      borderRadius: "12px",
                      padding: "18px",
                      marginBottom: "25px",
                    }}
                  >
                    <span
                      style={{
                        color: "#0F172A",
                        fontSize: "11px",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Datos de Transferencia Bancaria (SPEI)
                    </span>
                    <table width="100%" style={{ fontSize: "13px", color: "#334155", marginTop: "10px" }}>
                      <tbody>
                        <tr>
                          <td width="38%" style={{ padding: "4px 0", color: "#64748B" }}>Banco Receptor:</td>
                          <td style={{ padding: "4px 0", fontWeight: "700" }}>BBVA México</td>
                        </tr>
                        <tr>
                          <td style={{ padding: "4px 0", color: "#64748B" }}>Beneficiario:</td>
                          <td style={{ padding: "4px 0", fontWeight: "700" }}>CoSoAVL</td>
                        </tr>
                        <tr>
                          <td style={{ padding: "4px 0", color: "#64748B" }}>CLABE Interbancaria:</td>
                          <td style={{ padding: "4px 0", fontWeight: "800", fontFamily: "monospace", fontSize: "14px", color: "#0F172A" }}>
                            012 420 001155998877
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: "4px 0", color: "#64748B" }}>Concepto / Referencia:</td>
                          <td style={{ padding: "4px 0", fontWeight: "800", fontFamily: "monospace", color: "#7A1428" }}>
                            {folio}
                          </td>
                        </tr>
                        <tr style={{ borderTop: "1px dashed #CBD5E1" }}>
                          <td style={{ paddingTop: "8px", color: "#64748B", fontWeight: "bold" }}>
                            Monto a Transferir:
                          </td>
                          <td style={{ paddingTop: "8px", fontWeight: "900", fontSize: "16px", color: "#0F172A" }}>
                            {formatMxn(montoAnticipo)}
                            {esCrediContado && (
                              <span style={{ fontSize: "11px", fontWeight: "normal", color: "#64748B", marginLeft: "6px" }}>
                                (Anticipo 55%)
                              </span>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Botón Subir Comprobante */}
                  <div style={{ textAlign: "center", margin: "25px 0" }}>
                    <a
                      href={trackingUrl}
                      style={{
                        backgroundColor: "#0F172A",
                        color: "#ffffff",
                        padding: "14px 28px",
                        borderRadius: "12px",
                        fontSize: "13px",
                        fontWeight: "bold",
                        textDecoration: "none",
                        display: "inline-block",
                      }}
                    >
                      Subir Comprobante de Pago →
                    </a>
                    <p style={{ fontSize: "11px", color: "#64748B", marginTop: "8px" }}>
                      Una vez recibido tu comprobante, validaremos el pago para programar la cita técnica.
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: "14px", color: "#374151", lineHeight: "1.6", margin: "0 0 20px 0" }}>
                    Hemos validado tu pago con éxito. A continuación te presentamos el resumen oficial de tu compra y los datos de tu pedido:
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
                      }}
                    >
                      Ver Seguimiento de mi Pedido →
                    </a>
                    <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "8px" }}>
                      Enlace privado con token de seguridad
                    </p>
                  </div>
                </div>
              )}

              {/* Resumen del Pedido (Común a ambas versiones) */}
              <div
                style={{
                  backgroundColor: "#F9FAFB",
                  padding: "18px",
                  borderRadius: "12px",
                  border: "1px solid #E5E7EB",
                  marginBottom: "25px",
                }}
              >
                <h3
                  style={{
                    fontSize: "12px",
                    color: "#7A1428",
                    textTransform: "uppercase",
                    margin: "0 0 10px 0",
                    letterSpacing: "0.5px",
                  }}
                >
                  Resumen del Pedido
                </h3>
                <table width="100%" style={{ fontSize: "13px", color: "#374151" }}>
                  <tbody>
                    {items.map((it) => (
                      <tr key={it.id}>
                        <td style={{ padding: "4px 0" }}>
                          {it.cantidad}× {it.nombre}
                        </td>
                        <td align="right" style={{ padding: "4px 0", fontWeight: "600" }}>
                          {formatMxn(it.totalSinIvaCentavos)}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ borderTop: "1px solid #E5E7EB" }}>
                      <td style={{ paddingTop: "10px", fontWeight: "bold" }}>Total del Pedido (con IVA):</td>
                      <td
                        align="right"
                        style={{
                          paddingTop: "10px",
                          fontWeight: "800",
                          color: "#111827",
                          fontSize: "14px",
                        }}
                      >
                        {formatMxn(totalCentavos)}
                      </td>
                    </tr>

                    {/* Desglose de anticipo y saldo en esquema Credi-Contado */}
                    {esCrediContado && (
                      <>
                        <tr>
                          <td style={{ color: "#15803D", fontSize: "12px", fontWeight: "bold" }}>
                            Anticipo Cubierto:
                          </td>
                          <td align="right" style={{ color: "#15803D", fontSize: "12px", fontWeight: "bold" }}>
                            {formatMxn(montoAnticipo)}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ color: "#B91C1C", fontSize: "12px", fontWeight: "bold" }}>
                            Saldo Pendiente (al terminar instalación):
                          </td>
                          <td align="right" style={{ color: "#B91C1C", fontSize: "12px", fontWeight: "bold" }}>
                            {formatMxn(saldoRestanteCentavos)}
                          </td>
                        </tr>
                      </>
                    )}

                    <tr>
                      <td style={{ color: "#6B7280", fontSize: "12px", paddingTop: "6px" }}>Método y Esquema:</td>
                      <td align="right" style={{ color: "#6B7280", fontSize: "12px", paddingTop: "6px" }}>
                        {metodoPago === "spei" ? "Transferencia SPEI" : "Mercado Pago"} ·{" "}
                        {planPago ? planPago.replace("_", " ") : "Contado"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Pasos Siguientes (solo cuando el pago ya está validado) */}
              {!esSpeiPendiente && (
                <div style={{ marginBottom: "25px" }}>
                  <h3 style={{ fontSize: "13px", color: "#111827", margin: "0 0 12px 0", fontWeight: "700" }}>
                    ¿Cuáles son los pasos siguientes?
                  </h3>
                  <table width="100%" style={{ fontSize: "12px", color: "#4B5563" }}>
                    <tbody>
                      <tr>
                        <td width="28" valign="top" style={{ fontWeight: "bold", color: "#7A1428" }}>
                          1.
                        </td>
                        <td style={{ paddingBottom: "10px" }}>
                          <strong>Preparación de Equipos:</strong> Verificamos tus dispositivos GPS y líneas de comunicación.
                        </td>
                      </tr>
                      <tr>
                        <td width="28" valign="top" style={{ fontWeight: "bold", color: "#7A1428" }}>
                          2.
                        </td>
                        <td style={{ paddingBottom: "10px" }}>
                          <strong>Coordinación de Cita:</strong> Un asesor se comunicará contigo al{" "}
                          <strong>{telefonoCliente}</strong> para afinar detalles y confirmar el horario de llegada.
                        </td>
                      </tr>
                      <tr>
                        <td width="28" valign="top" style={{ fontWeight: "bold", color: "#7A1428" }}>
                          3.
                        </td>
                        <td>
                          <strong>Instalación:</strong> El técnico acude con la orden de servicio para montar los equipos y validar la recepción de señal.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Contacto Directo */}
              <div
                style={{
                  textAlign: "center",
                  padding: "14px",
                  backgroundColor: "#FEF2F2",
                  borderRadius: "12px",
                  border: "1px solid #FEE2E2",
                }}
              >
                <p style={{ margin: "0", fontSize: "12px", color: "#991B1B" }}>
                  ¿Tienes dudas con tu pedido?
                </p>
                <p style={{ margin: "4px 0 0 0", fontSize: "12px" }}>
                  Escríbenos directamente a WhatsApp:{" "}
                  <a
                    href="https://wa.me/527224322053"
                    style={{ color: "#7A1428", fontWeight: "bold", textDecoration: "none" }}
                  >
                    722 432 2053
                  </a>
                </p>
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
