import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "fs";
import path from "path";
import { FichaInstalacionEmail } from "../src/components/emails/FichaInstalacionEmail";
import { ConfirmacionPedidoEmail } from "../src/components/emails/ConfirmacionPedidoEmail";
import { AvisoSpeiEmail } from "../src/components/emails/AvisoSpeiEmail";
import { CobroDiferidoEmail } from "../src/components/emails/CobroDiferidoEmail";
import { Order, OrderPagoProgramado } from "../src/types/order";

const sampleOrder: Order = {
  id: "CT-20261101",
  folio: "CT-20261101",
  cartId: "cart_preview_123",
  tokenHash: "hash_preview",
  estado: "anticipo_pagado",
  metodoPago: "mercadopago",
  planPago: "credi_contado",
  montoPrimerPagoCentavos: 313026,
  saldoRestanteCentavos: 256112,
  totalCentavos: 569138,
  contacto: {
    nombre: "Ing. Roberto Domínguez",
    empresa: "Logística del Centro S.A. de C.V.",
    telefono: "5551234567",
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
    referencias: "Entrar por portón trasero. Unidad en patio 2. Contacto en sitio: Carlos Méndez (5559876543)",
  },
  unidades: [
    {
      id: "u_1",
      equipoIndex: 0,
      equipoNombre: "GPS Tracker 4G Alta Precisión",
      tipoVehiculo: "Tractocamión",
      marca: "Kenworth",
      modelo: "T680",
      anio: "2024",
      placas: "789-XY-2",
      color: "Blanco",
      vin: "3AKJHGD8723654129",
      numeroEconomico: "ECO-101",
    },
    {
      id: "u_2",
      equipoIndex: 0,
      equipoNombre: "GPS Tracker 4G Alta Precisión",
      tipoVehiculo: "Camioneta 3.5 Tons",
      marca: "Ford",
      modelo: "F-350",
      anio: "2023",
      placas: "123-ZA-9",
      color: "Rojo",
      numeroEconomico: "ECO-102",
    },
  ],
  items: [
    {
      id: "gps-4g-flotas",
      nombre: "GPS Tracker 4G Alta Precisión",
      cantidad: 2,
      precioSinIvaCentavos: 245318,
      totalSinIvaCentavos: 490636,
      esEquipoPrincipal: true,
    },
  ],
  pagos: [
    {
      id: "P1",
      numero: 1,
      concepto: "Anticipo 55% al ordenar",
      montoCentavos: 313026,
      momento: "inmediato",
      estado: "aprobado",
      externalReference: "CT-20261101:P1",
    },
    {
      id: "P2",
      numero: 2,
      concepto: "Liquidación 45% al terminar la instalación",
      montoCentavos: 256112,
      momento: "al_instalar",
      estado: "pendiente",
      externalReference: "CT-20261101:P2",
    },
  ],
  createdAt: "2026-11-01T18:00:00.000Z",
  updatedAt: "2026-11-01T18:10:00.000Z",
};

const samplePagoP2: OrderPagoProgramado = {
  id: "P2",
  numero: 2,
  concepto: "Liquidación 45% al terminar la instalación",
  montoCentavos: 256112,
  momento: "al_instalar",
  estado: "pendiente",
  externalReference: "CT-20261101:P2",
};

const outDir = path.resolve(process.cwd(), "temp-previews");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. Ficha de Instalación
const htmlFicha = renderToStaticMarkup(<FichaInstalacionEmail order={sampleOrder} siteUrl="https://cosotec.com" />);
fs.writeFileSync(path.join(outDir, "ficha-instalacion.html"), `<!DOCTYPE html><html><body style="margin:0;padding:20px;background:#F5F3F2;">${htmlFicha}</body></html>`, "utf-8");

// 2. Confirmación de Pedido
const htmlConfirmacion = renderToStaticMarkup(<ConfirmacionPedidoEmail order={sampleOrder} token="ct_token_demo_98765" siteUrl="https://cosotec.com" />);
fs.writeFileSync(path.join(outDir, "confirmacion-pedido.html"), `<!DOCTYPE html><html><body style="margin:0;padding:20px;background:#F5F3F2;">${htmlConfirmacion}</body></html>`, "utf-8");

// 3. Aviso SPEI Aprobado
const htmlSpeiAprobado = renderToStaticMarkup(<AvisoSpeiEmail order={sampleOrder} token="ct_token_demo_98765" accion="aprobado" siteUrl="https://cosotec.com" />);
fs.writeFileSync(path.join(outDir, "aviso-spei-aprobado.html"), `<!DOCTYPE html><html><body style="margin:0;padding:20px;background:#F5F3F2;">${htmlSpeiAprobado}</body></html>`, "utf-8");

// 4. Aviso SPEI Rechazado
const htmlSpeiRechazado = renderToStaticMarkup(
  <AvisoSpeiEmail
    order={sampleOrder}
    token="ct_token_demo_98765"
    accion="rechazado"
    motivoRechazo="El comprobante no muestra la cuenta CLABE receptora ni la clave de rastreo de Banxico. Favor de adjuntar el PDF oficial de su banca en línea."
    siteUrl="https://cosotec.com"
  />
);
fs.writeFileSync(path.join(outDir, "aviso-spei-rechazado.html"), `<!DOCTYPE html><html><body style="margin:0;padding:20px;background:#F5F3F2;">${htmlSpeiRechazado}</body></html>`, "utf-8");

// 5. Cobro Diferido
const htmlCobroDiferido = renderToStaticMarkup(
  <CobroDiferidoEmail
    order={sampleOrder}
    pago={samplePagoP2}
    token="ct_token_demo_98765"
    linkCobro="https://cosotec.com/pedido/CT-20261101?t=ct_token_demo_98765&pago=P2"
    siteUrl="https://cosotec.com"
  />
);
fs.writeFileSync(path.join(outDir, "cobro-diferido.html"), `<!DOCTYPE html><html><body style="margin:0;padding:20px;background:#F5F3F2;">${htmlCobroDiferido}</body></html>`, "utf-8");

console.log("HTML previews generated successfully in temp-previews/");
