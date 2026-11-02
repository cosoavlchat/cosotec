import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "fs";
import path from "path";
import { FichaInstalacionEmail } from "../src/components/emails/FichaInstalacionEmail";
import { ConfirmacionPedidoEmail } from "../src/components/emails/ConfirmacionPedidoEmail";
import { AvisoSpeiEmail } from "../src/components/emails/AvisoSpeiEmail";
import { CobroDiferidoEmail } from "../src/components/emails/CobroDiferidoEmail";
import { Order, OrderPagoProgramado } from "../src/types/order";

// 9. Pedido con formato real CT-1124451 y producto real del catálogo (GPS Intermedio)
const sampleOrder: Order = {
  id: "CT-1124451",
  folio: "CT-1124451",
  cartId: "cart_preview_real",
  tokenHash: "hash_preview_real",
  estado: "anticipo_pagado",
  metodoPago: "mercadopago",
  planPago: "credi_contado",
  montoPrimerPagoCentavos: 1017865, // Anticipo 55% de $18,506.64
  saldoRestanteCentavos: 832799,   // Saldo 45%
  totalCentavos: 1850664,          // $18,506.64 MXN con IVA
  contacto: {
    nombre: "Ing. Roberto Domínguez", // El helper limpiarTituloSaludo mostrará "Roberto Domínguez"
    empresa: "Logística del Centro S.A. de C.V.",
    telefono: "7221340127",
    correo: "r.dominguez@logisticacentro.mx",
  },
  instalacion: {
    tipoLugar: "domicilio",
    direccion: "Av. Tollocan Poniente 1250, Bodega 4",
    municipio: "Toluca",
    estadoClave: "MEX",
    estadoNombre: "Estado de México",
    fechaTentativa: "2026-11-12",
    horarioTentativo: "manana",
    referencias: "Entrar por portón trasero. Unidades en patio 2.",
  },
  unidades: [
    {
      id: "u_1",
      equipoIndex: 0,
      equipoNombre: "GPS Intermedio",
      tipoVehiculo: "Tractocamión",
      marca: "Kenworth",
      modelo: "T680",
      anio: "2024",
      color: "Blanco",
      numeroEconomico: "ECO-101",
      vin: "3AKJHGD8723654129",
      placas: "789-XY-2",
    },
    {
      id: "u_2",
      equipoIndex: 0,
      equipoNombre: "GPS Intermedio",
      tipoVehiculo: "Camioneta 3.5 Tons",
      marca: "Ford",
      modelo: "F-350",
      anio: "2023",
      color: "Rojo",
      numeroEconomico: "ECO-102",
      vin: "3FRTG872365412001",
      placas: "123-ZA-9",
    },
  ],
  items: [
    {
      id: "gps-intermedio",
      nombre: "GPS Intermedio",
      cantidad: 2,
      precioSinIvaCentavos: 797700,
      totalSinIvaCentavos: 1595400,
      esEquipoPrincipal: true,
    },
  ],
  pagos: [
    {
      id: "P1",
      numero: 1,
      concepto: "Anticipo 55% al ordenar",
      montoCentavos: 1017865,
      momento: "inmediato",
      estado: "aprobado",
      externalReference: "CT-1124451:P1",
    },
    {
      id: "P2",
      numero: 2,
      concepto: "Liquidación 45% al terminar la instalación",
      montoCentavos: 832799,
      momento: "al_instalar",
      estado: "pendiente",
      externalReference: "CT-1124451:P2",
    },
  ],
  createdAt: "2026-11-01T18:00:00.000Z",
  updatedAt: "2026-11-01T18:10:00.000Z",
};

// Pedido SPEI pendiente de validación
const sampleOrderSpeiPendiente: Order = {
  ...sampleOrder,
  metodoPago: "spei",
  estado: "pendiente_comprobante",
};

const samplePagoP2: OrderPagoProgramado = {
  id: "P2",
  numero: 2,
  concepto: "Liquidación 45% al terminar la instalación",
  montoCentavos: 832799,
  momento: "al_instalar",
  estado: "pendiente",
  externalReference: "CT-1124451:P2",
};

const outDir = path.resolve(process.cwd(), "temp-previews");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. Ficha de Instalación para Soporte
const htmlFicha = renderToStaticMarkup(<FichaInstalacionEmail order={sampleOrder} siteUrl="https://cosotec7.web.app" />);
fs.writeFileSync(path.join(outDir, "ficha-instalacion.html"), `<!DOCTYPE html><html><body style="margin:0;padding:20px;background:#F5F3F2;">${htmlFicha}</body></html>`, "utf-8");

// 2. Confirmación de Pedido - Versión Pago con Tarjeta Aprobado
const htmlConfirmacionAprobado = renderToStaticMarkup(<ConfirmacionPedidoEmail order={sampleOrder} token="ct_token_demo_98765" siteUrl="https://cosotec7.web.app" />);
fs.writeFileSync(path.join(outDir, "confirmacion-pedido.html"), `<!DOCTYPE html><html><body style="margin:0;padding:20px;background:#F5F3F2;">${htmlConfirmacionAprobado}</body></html>`, "utf-8");

// 3. Confirmación de Pedido - Versión SPEI Pendiente
const htmlConfirmacionSpei = renderToStaticMarkup(<ConfirmacionPedidoEmail order={sampleOrderSpeiPendiente} token="ct_token_demo_98765" siteUrl="https://cosotec7.web.app" />);
fs.writeFileSync(path.join(outDir, "confirmacion-spei-pendiente.html"), `<!DOCTYPE html><html><body style="margin:0;padding:20px;background:#F5F3F2;">${htmlConfirmacionSpei}</body></html>`, "utf-8");

// 4. Aviso SPEI Acreditado con Desglose Exacto
const htmlSpeiAprobado = renderToStaticMarkup(<AvisoSpeiEmail order={sampleOrder} token="ct_token_demo_98765" accion="aprobado" siteUrl="https://cosotec7.web.app" />);
fs.writeFileSync(path.join(outDir, "aviso-spei-aprobado.html"), `<!DOCTYPE html><html><body style="margin:0;padding:20px;background:#F5F3F2;">${htmlSpeiAprobado}</body></html>`, "utf-8");

// 5. Aviso SPEI Rechazado con Motivo Detallado
const htmlSpeiRechazado = renderToStaticMarkup(
  <AvisoSpeiEmail
    order={sampleOrder}
    token="ct_token_demo_98765"
    accion="rechazado"
    motivoRechazo="El comprobante no muestra la cuenta CLABE receptora ni la clave de rastreo de Banxico. Favor de adjuntar el PDF oficial de su banca en línea."
    siteUrl="https://cosotec7.web.app"
  />
);
fs.writeFileSync(path.join(outDir, "aviso-spei-rechazado.html"), `<!DOCTYPE html><html><body style="margin:0;padding:20px;background:#F5F3F2;">${htmlSpeiRechazado}</body></html>`, "utf-8");

// 6. Cobro Diferido P2
const htmlCobroDiferido = renderToStaticMarkup(
  <CobroDiferidoEmail
    order={sampleOrder}
    pago={samplePagoP2}
    token="ct_token_demo_98765"
    linkCobro="https://cosotec7.web.app/pedido/CT-1124451?t=ct_token_demo_98765&pago=P2"
    siteUrl="https://cosotec7.web.app"
  />
);
fs.writeFileSync(path.join(outDir, "cobro-diferido.html"), `<!DOCTYPE html><html><body style="margin:0;padding:20px;background:#F5F3F2;">${htmlCobroDiferido}</body></html>`, "utf-8");

console.log("Previsualizaciones HTML generadas con éxito en temp-previews/ con producto GPS Intermedio y folio CT-1124451.");
