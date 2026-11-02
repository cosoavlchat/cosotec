import React from "react";
import { Order } from "@/types/order";
import { formatMxn } from "@/lib/pricing";
import { EmailFooter } from "./EmailFooter";
import {
  limpiarTituloSaludo,
  formatFechaEspanol,
  formatHorarioEspanol,
  formatTelefonoLocal,
  getAppBaseUrl,
} from "./email-helpers";

interface FichaInstalacionEmailProps {
  order: Order;
  siteUrl?: string;
  customFooter?: string;
}

export function FichaInstalacionEmail({
  order,
  siteUrl,
  customFooter,
}: FichaInstalacionEmailProps) {
  const {
    folio,
    contacto,
    instalacion,
    unidades = [],
    items = [],
    totalCentavos,
    saldoRestanteCentavos,
    estado,
    planPago,
  } = order;

  const baseUrl = getAppBaseUrl(siteUrl);
  const nombreCliente = limpiarTituloSaludo(contacto.nombre);
  const telefonoCliente = formatTelefonoLocal(contacto.telefono);
  const totalEquipos = items
    .filter((i) => i.esEquipoPrincipal)
    .reduce((acc, curr) => acc + curr.cantidad, 0);

  const pagadoTexto = estado === "pagado" ? "100% Liquidado" : "Anticipo Cubierto";

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
          maxWidth: "640px",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid #E5E7EB",
          borderCollapse: "separate",
        }}
      >
        {/* Header */}
        <tbody>
          <tr>
            <td style={{ backgroundColor: "#7A1428", padding: "24px 30px", textAlign: "left" }}>
              <table width="100%">
                <tbody>
                  <tr>
                    <td>
                      <span
                        style={{
                          color: "#C9A15B",
                          fontSize: "11px",
                          fontWeight: "bold",
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                        }}
                      >
                        Ficha Técnica de Instalación
                      </span>
                      <h1 style={{ color: "#ffffff", fontSize: "22px", margin: "4px 0 0 0", fontWeight: "800" }}>
                        Pedido #{folio}
                      </h1>
                    </td>
                    <td align="right">
                      <span
                        style={{
                          backgroundColor: "#5C0F1E",
                          color: "#ffffff",
                          padding: "6px 12px",
                          borderRadius: "8px",
                          fontSize: "11px",
                          fontWeight: "bold",
                        }}
                      >
                        {pagadoTexto}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          {/* Body */}
          <tr>
            <td style={{ padding: "24px 30px" }}>
              {/* Sección 1: Cliente */}
              <div style={{ marginBottom: "20px" }}>
                <h3
                  style={{
                    fontSize: "13px",
                    color: "#7A1428",
                    textTransform: "uppercase",
                    margin: "0 0 10px 0",
                    borderBottom: "1px solid #F3F4F6",
                    paddingBottom: "6px",
                  }}
                >
                  1. Datos del Cliente
                </h3>
                <table width="100%" style={{ fontSize: "13px", color: "#374151" }}>
                  <tbody>
                    <tr>
                      <td width="35%" style={{ padding: "4px 0", color: "#6B7280" }}>
                        Nombre:
                      </td>
                      <td style={{ padding: "4px 0", fontWeight: "600" }}>{nombreCliente}</td>
                    </tr>
                    {contacto.empresa && (
                      <tr>
                        <td style={{ padding: "4px 0", color: "#6B7280" }}>Empresa / Razón:</td>
                        <td style={{ padding: "4px 0" }}>{contacto.empresa}</td>
                      </tr>
                    )}
                    <tr>
                      <td style={{ padding: "4px 0", color: "#6B7280" }}>Teléfono:</td>
                      <td style={{ padding: "4px 0", fontWeight: "600" }}>
                        <a
                          href={`tel:${contacto.telefono || ""}`}
                          style={{ color: "#7A1428", textDecoration: "none" }}
                        >
                          {telefonoCliente}
                        </a>
                        {contacto.telefono ? (
                          <span>
                            {" "}
                            (
                            <a
                              href={`https://wa.me/${contacto.telefono.replace(/\D/g, "")}`}
                              style={{ color: "#059669", textDecoration: "none", fontWeight: "bold" }}
                            >
                              WhatsApp
                            </a>
                            )
                          </span>
                        ) : null}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "4px 0", color: "#6B7280" }}>Correo:</td>
                      <td style={{ padding: "4px 0" }}>{contacto.correo || "—"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Sección 2: Cita y Ubicación */}
              <div style={{ marginBottom: "20px" }}>
                <h3
                  style={{
                    fontSize: "13px",
                    color: "#7A1428",
                    textTransform: "uppercase",
                    margin: "0 0 10px 0",
                    borderBottom: "1px solid #F3F4F6",
                    paddingBottom: "6px",
                  }}
                >
                  2. Cita de Instalación y Ubicación
                </h3>
                <table width="100%" style={{ fontSize: "13px", color: "#374151" }}>
                  <tbody>
                    <tr>
                      <td width="35%" style={{ padding: "4px 0", color: "#6B7280" }}>
                        Fecha Tentativa:
                      </td>
                      <td style={{ padding: "4px 0", fontWeight: "700", color: "#111827" }}>
                        {formatFechaEspanol(instalacion.fechaTentativa)}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "4px 0", color: "#6B7280" }}>Horario de Atención:</td>
                      <td style={{ padding: "4px 0", fontWeight: "600" }}>
                        {formatHorarioEspanol(instalacion.horarioTentativo)}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "4px 0", color: "#6B7280" }}>Modalidad:</td>
                      <td style={{ padding: "4px 0", fontWeight: "600" }}>
                        {instalacion.tipoLugar === "domicilio" ? "A Domicilio / Taller Cliente" : "Taller CoSoAVL"}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "4px 0", color: "#6B7280" }}>Dirección:</td>
                      <td style={{ padding: "4px 0" }}>
                        {instalacion.direccion || "—"},{" "}
                        {instalacion.municipio ? `${instalacion.municipio}, ` : ""}
                        {instalacion.estadoNombre || instalacion.estadoClave || ""}
                      </td>
                    </tr>
                    {instalacion.referencias && (
                      <tr>
                        <td style={{ padding: "4px 0", color: "#6B7280" }}>Referencias / Acceso:</td>
                        <td style={{ padding: "4px 0", color: "#4B5563", fontStyle: "italic" }}>
                          {instalacion.referencias}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Sección 3: Unidades Vehiculares (Con VIN, No. Económico, Color y Placas sin cortes) */}
              {unidades.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <h3
                    style={{
                      fontSize: "13px",
                      color: "#7A1428",
                      textTransform: "uppercase",
                      margin: "0 0 10px 0",
                      borderBottom: "1px solid #F3F4F6",
                      paddingBottom: "6px",
                    }}
                  >
                    3. Unidades a Instalar ({unidades.length})
                  </h3>
                  <div style={{ overflowX: "auto" }}>
                    <table
                      width="100%"
                      style={{
                        fontSize: "12px",
                        borderCollapse: "collapse",
                        border: "1px solid #E5E7EB",
                        minWidth: "560px",
                      }}
                    >
                      <thead>
                        <tr style={{ backgroundColor: "#F9FAFB", color: "#4B5563" }}>
                          <th style={{ padding: "8px 6px", border: "1px solid #E5E7EB", textAlign: "left" }}>#</th>
                          <th style={{ padding: "8px 6px", border: "1px solid #E5E7EB", textAlign: "left" }}>
                            Vehículo / Marca
                          </th>
                          <th style={{ padding: "8px 6px", border: "1px solid #E5E7EB", textAlign: "left" }}>
                            Modelo / Año
                          </th>
                          <th style={{ padding: "8px 6px", border: "1px solid #E5E7EB", textAlign: "left" }}>Color</th>
                          <th style={{ padding: "8px 6px", border: "1px solid #E5E7EB", textAlign: "left" }}>
                            No. Económico
                          </th>
                          <th style={{ padding: "8px 6px", border: "1px solid #E5E7EB", textAlign: "left" }}>VIN</th>
                          <th
                            style={{
                              padding: "8px 6px",
                              border: "1px solid #E5E7EB",
                              textAlign: "left",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Placas
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {unidades.map((u, i) => (
                          <tr key={i}>
                            <td style={{ padding: "8px 6px", border: "1px solid #E5E7EB" }}>{i + 1}</td>
                            <td style={{ padding: "8px 6px", border: "1px solid #E5E7EB", fontWeight: "600" }}>
                              {u.tipoVehiculo || "Vehículo"} - {u.marca || "—"}
                            </td>
                            <td style={{ padding: "8px 6px", border: "1px solid #E5E7EB" }}>
                              {u.modelo || "—"} ({u.anio || "—"})
                            </td>
                            <td style={{ padding: "8px 6px", border: "1px solid #E5E7EB" }}>{u.color || "—"}</td>
                            <td style={{ padding: "8px 6px", border: "1px solid #E5E7EB" }}>
                              {u.numeroEconomico || "—"}
                            </td>
                            <td
                              style={{
                                padding: "8px 6px",
                                border: "1px solid #E5E7EB",
                                fontFamily: "monospace",
                                fontSize: "11px",
                              }}
                            >
                              {u.vin || "—"}
                            </td>
                            <td
                              style={{
                                padding: "8px 6px",
                                border: "1px solid #E5E7EB",
                                whiteSpace: "nowrap",
                              }}
                            >
                              <span
                                style={{
                                  display: "inline-block",
                                  backgroundColor: "#F3F4F6",
                                  padding: "3px 7px",
                                  borderRadius: "4px",
                                  fontFamily: "monospace",
                                  fontWeight: "700",
                                  letterSpacing: "0.5px",
                                  whiteSpace: "nowrap",
                                  border: "1px solid #E5E7EB",
                                }}
                              >
                                {u.placas || "SIN PLACAS"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sección 4: Equipos */}
              <div style={{ marginBottom: "20px" }}>
                <h3
                  style={{
                    fontSize: "13px",
                    color: "#7A1428",
                    textTransform: "uppercase",
                    margin: "0 0 10px 0",
                    borderBottom: "1px solid #F3F4F6",
                    paddingBottom: "6px",
                  }}
                >
                  4. Equipos y Componentes a Instalar
                </h3>
                <ul
                  style={{
                    margin: "0",
                    paddingLeft: "20px",
                    fontSize: "13px",
                    color: "#374151",
                    lineHeight: "1.6",
                  }}
                >
                  {items.map((it) => (
                    <li key={it.id}>
                      <strong>{it.cantidad}×</strong> {it.nombre}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sección 5: Liquidación e Importe para el Técnico */}
              <div
                style={{
                  backgroundColor: "#F9FAFB",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid #E5E7EB",
                }}
              >
                <table width="100%" style={{ fontSize: "13px" }}>
                  <tbody>
                    <tr>
                      <td style={{ color: "#6B7280" }}>Esquema de Pago:</td>
                      <td align="right" style={{ fontWeight: "600", textTransform: "capitalize" }}>
                        {planPago ? planPago.replace("_", " ") : "Contado"}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ color: "#6B7280" }}>Total Pedido (con IVA):</td>
                      <td align="right" style={{ fontWeight: "700" }}>
                        {formatMxn(totalCentavos)}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ color: "#15803D", fontWeight: "bold" }}>Monto Ya Cubierto:</td>
                      <td align="right" style={{ color: "#15803D", fontWeight: "bold" }}>
                        {formatMxn(totalCentavos - saldoRestanteCentavos)}
                      </td>
                    </tr>
                    {saldoRestanteCentavos > 0 && (
                      <tr style={{ borderTop: "1px dashed #D1D5DB" }}>
                        <td
                          style={{
                            paddingTop: "8px",
                            color: "#B91C1C",
                            fontWeight: "bold",
                            fontSize: "12px",
                          }}
                        >
                          Saldo pendiente (se cobra al cliente por link de pago; el técnico no cobra):
                        </td>
                        <td
                          align="right"
                          style={{
                            paddingTop: "8px",
                            color: "#B91C1C",
                            fontWeight: "800",
                            fontSize: "15px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatMxn(saldoRestanteCentavos)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
