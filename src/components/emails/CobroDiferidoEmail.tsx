import React from "react";
import { Order, OrderPagoProgramado } from "@/types/order";
import { formatMxn } from "@/lib/pricing";

interface CobroDiferidoEmailProps {
  order: Order;
  pago: OrderPagoProgramado;
  token: string;
  linkCobro: string;
  siteUrl?: string;
}

export function CobroDiferidoEmail({
  order,
  pago,
  token,
  linkCobro,
  siteUrl = "https://cosotec.com",
}: CobroDiferidoEmailProps) {
  const { folio, contacto } = order;

  return (
    <div style={{ backgroundColor: "#F5F3F2", padding: "30px 15px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <table align="center" width="100%" style={{ maxWidth: "600px", backgroundColor: "#ffffff", borderRadius: "16px", overflow: "hidden", border: "1px solid #E5E7EB", borderCollapse: "separate" }}>
        {/* Header */}
        <tbody>
          <tr>
            <td style={{ backgroundColor: "#7A1428", padding: "26px 30px", textAlign: "center" }}>
              <span style={{ color: "#C9A15B", fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px" }}>
                Calendario de Pagos Programados
              </span>
              <h1 style={{ color: "#ffffff", fontSize: "22px", margin: "6px 0 0 0", fontWeight: "800" }}>
                {pago.concepto}
              </h1>
              <p style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "13px", margin: "4px 0 0 0" }}>
                Pedido Oficial #{folio}
              </p>
            </td>
          </tr>

          {/* Body */}
          <tr>
            <td style={{ padding: "30px" }}>
              <p style={{ fontSize: "14px", color: "#374151", margin: "0 0 20px 0", lineHeight: "1.6" }}>
                Estimado(a) <strong>{contacto.nombre}</strong>,
              </p>
              <p style={{ fontSize: "14px", color: "#374151", margin: "0 0 20px 0", lineHeight: "1.6" }}>
                Te compartimos el enlace seguro para realizar la liquidación de la exhibición correspondiente a tu pedido:
              </p>

              {/* Tarjeta de Pago */}
              <div style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: "12px", padding: "20px", marginBottom: "25px", textAlign: "center" }}>
                <span style={{ fontSize: "12px", color: "#6B7280", textTransform: "uppercase", fontWeight: "600" }}>
                  Monto a Liquidar ({pago.id})
                </span>
                <p style={{ fontSize: "28px", color: "#7A1428", fontWeight: "900", margin: "8px 0" }}>
                  {formatMxn(pago.montoCentavos)}
                </p>
                <p style={{ fontSize: "12px", color: "#4B5563", margin: "0" }}>
                  Concepto: <strong>{pago.concepto}</strong>
                </p>
                {pago.fechaEstimada && (
                  <p style={{ fontSize: "11px", color: "#9CA3AF", margin: "4px 0 0 0" }}>
                    Vencimiento / Programación: {pago.fechaEstimada}
                  </p>
                )}
              </div>

              {/* Botón de Pago */}
              <div style={{ textAlign: "center", margin: "25px 0" }}>
                <a
                  href={linkCobro}
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
                  Pagar en Línea con Tarjeta / Consultar SPEI →
                </a>
                <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "8px" }}>
                  Acepta Tarjeta de Crédito, Débito o Transferencia Interbancaria
                </p>
              </div>

              {/* WhatsApp */}
              <div style={{ textAlign: "center", paddingTop: "15px", borderTop: "1px solid #F3F4F6", fontSize: "12px", color: "#6B7280" }}>
                ¿Requieres asistencia o comprobante fiscal? Escríbenos al{" "}
                <a href="https://wa.me/527224322053" style={{ color: "#7A1428", fontWeight: "bold", textDecoration: "none" }}>
                  722 432 2053
                </a>
              </div>
            </td>
          </tr>

          {/* Footer */}
          <tr>
            <td style={{ backgroundColor: "#F9FAFB", padding: "16px 30px", borderTop: "1px solid #E5E7EB", textAlign: "center", fontSize: "11px", color: "#9CA3AF" }}>
              CosoTec by CoSoAVL · Soluciones de Rastreo e Ingeniería · {siteUrl}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
