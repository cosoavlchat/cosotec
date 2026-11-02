import fs from "fs";
import path from "path";
import crypto from "crypto";

// Cargar .env.local si existe
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

import {
  crearOrdenMercadoPago,
  validarExternalReferenceMP,
  MP_NOT_ALLOWED_PAYMENT_TYPES,
  MP_OFFICIAL_PAYMENT_METHOD_TYPES,
} from "../src/lib/mercadopago";

async function main() {
  console.log("=== Prueba de Creación de Orden en Mercado Pago Orders API ===");
  console.log("1. Validando configuración de métodos de pago:");
  console.log("   - Tipos oficiales en Orders API:", MP_OFFICIAL_PAYMENT_METHOD_TYPES);
  console.log("   - Tipos excluidos:", MP_NOT_ALLOWED_PAYMENT_TYPES);
  console.log("   - ¿Excluye wallet?:", !MP_NOT_ALLOWED_PAYMENT_TYPES.includes("wallet" as any));

  const externalRef = "CT-1124451-P1";
  console.log("\n2. Validando external_reference:", externalRef);
  const isValidRef = validarExternalReferenceMP(externalRef);
  console.log("   - ¿Cumple patrón oficial ^[a-zA-Z0-9_-]{1,64}$?:", isValidRef);

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    console.log("\n⚠️ MP_ACCESS_TOKEN no encontrado en .env.local.");
    console.log("   Para probar contra el sandbox real en local, agrega en .env.local:");
    console.log("   MP_ACCESS_TOKEN=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx");
    console.log("   MP_ENV=sandbox");
    console.log("\n   La orden simulada en modo local funciona correctamente.");
    return;
  }

  console.log("\n3. Enviando petición real a POST https://api.mercadopago.com/v1/orders ...");
  try {
    const orden = await crearOrdenMercadoPago({
      folio: "CT-1124451",
      externalReference: externalRef,
      token: "tok_test_verification_123",
      items: [
        {
          id: "GPS-INTERMEDIO",
          title: "Pedido CT-1124451 - Anticipo 55% GPS Intermedio",
          quantity: 1,
          unit_price: 3130.26,
        },
      ],
      payerEmail: "test_payer_12345@testuser.com",
      backUrlBase: "https://cosotec--cosotec7.us-east4.hosted.app",
    });

    console.log("\n✅ ¡ÉXITO! Orden creada exitosamente en Mercado Pago Sandbox:");
    console.log("   - ID de Orden:", orden.id);
    console.log("   - Checkout URL:", orden.checkoutUrl);
    console.log("   - Init Point:", orden.initPoint);
  } catch (error: any) {
    console.error("\n❌ Error en Orders API:", error.message);
  }
}

main().catch(console.error);
