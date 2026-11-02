import React from "react";
import { DEFAULT_EMAIL_FOOTER } from "./email-helpers";

interface EmailFooterProps {
  customText?: string;
}

/**
 * 1. Pie único y común a todos los correos (leído de settings/contact o valor por defecto).
 * "CosoTec by CoSoAVL · Metepec, Estado de México · ventas@cosoavl.com · Tel. 722 134 0127 · WhatsApp 722 432 2053"
 */
export function EmailFooter({ customText }: EmailFooterProps) {
  const texto = customText || DEFAULT_EMAIL_FOOTER;

  return (
    <tr>
      <td
        style={{
          backgroundColor: "#F9FAFB",
          padding: "20px 30px",
          borderTop: "1px solid #E5E7EB",
          textAlign: "center",
          fontSize: "11px",
          color: "#6B7280",
          lineHeight: "1.6",
        }}
      >
        <p style={{ margin: "0 0 4px 0", fontWeight: "600", color: "#374151" }}>
          {texto}
        </p>
        <p style={{ margin: "0", fontSize: "10px", color: "#9CA3AF" }}>
          <a href="mailto:ventas@cosoavl.com" style={{ color: "#7A1428", textDecoration: "none" }}>
            ventas@cosoavl.com
          </a>{" "}
          · Tel.{" "}
          <a href="tel:7221340127" style={{ color: "#7A1428", textDecoration: "none" }}>
            722 134 0127
          </a>{" "}
          · WhatsApp{" "}
          <a href="https://wa.me/527224322053" style={{ color: "#059669", textDecoration: "none", fontWeight: "bold" }}>
            722 432 2053
          </a>
        </p>
      </td>
    </tr>
  );
}

