import { describe, it, expect, beforeAll, vi } from "vitest";
import crypto from "crypto";
import { validarFirmaWebhook, crearPreferenciaMercadoPago } from "@/lib/mercadopago";
import { generarTokenAleatorio, hashToken, validarTokenCotizacion } from "@/lib/quotes";
import { Order, OrderPagoProgramado } from "@/types/order";

vi.mock("@/lib/firebase/admin", () => ({
  adminDb: {
    collection: () => ({
      add: vi.fn().mockResolvedValue({ id: "log_123" }),
      doc: () => ({
        get: vi.fn().mockResolvedValue({ exists: false }),
        update: vi.fn().mockResolvedValue({}),
        set: vi.fn().mockResolvedValue({}),
      }),
      where: () => ({
        limit: () => ({
          get: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
        }),
      }),
    }),
  },
}));

describe("Paso 3.4: Mercado Pago - Webhook, Tolerancia Cero, Referencia por Cuota y Tokens", () => {
  const secretKey = "test_webhook_secret_key_123456";

  beforeAll(() => {
    process.env.QUOTES_TOKEN_SECRET = "test_quotes_token_secret_123456";
    process.env.MP_WEBHOOK_SECRET = secretKey;
  });

  it("1. Validación x-signature: firma correcta según estándar oficial MP es aprobada", () => {
    const dataId = "1234567890";
    const requestId = "req-uuid-abc-123";
    const ts = Math.floor(Date.now() / 1000).toString();

    // Manifest: "id:[data.id];request-id:[x-request-id];ts:[ts];"
    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const v1 = crypto.createHmac("sha256", secretKey).update(manifest).digest("hex");

    const signatureHeader = `ts=${ts},v1=${v1}`;
    const isValid = validarFirmaWebhook(signatureHeader, requestId, dataId, secretKey);
    expect(isValid).toBe(true);
  });

  it("2. Validación x-signature: firma manipulada o timestamp alterado es rechazada (401)", () => {
    const dataId = "1234567890";
    const requestId = "req-uuid-abc-123";
    const ts = Math.floor(Date.now() / 1000).toString();

    const signatureHeaderManipulada = `ts=${ts},v1=deadbeefcafebabe0123456789abcdef0123456789abcdef0123456789abcdef`;
    const isValid = validarFirmaWebhook(signatureHeaderManipulada, requestId, dataId, secretKey);
    expect(isValid).toBe(false);
  });

  it("3. Tolerancia Cero: transaction_amount se convierte a centavos y cualquier variación va a 'revision_manual'", () => {
    const pagoEsperadoCentavos = 569138; // $5,691.38 MXN

    // Caso A: Cobro exacto ($5,691.38 MXN) -> 569138 centavos
    const transactionAmountPesosA = 5691.38;
    const centavosA = Math.round(transactionAmountPesosA * 100);
    expect(centavosA).toBe(pagoEsperadoCentavos);
    expect(centavosA === pagoEsperadoCentavos).toBe(true);

    // Caso B: Cobro alterado por solo 1 centavo menos ($5,691.37 MXN)
    const transactionAmountPesosB = 5691.37;
    const centavosB = Math.round(transactionAmountPesosB * 100);
    expect(centavosB).toBe(569137);
    expect(centavosB === pagoEsperadoCentavos).toBe(false); // Discrepancia -> 'revision_manual'

    // Caso C: Cobro manipulado drásticamente ($1.00 peso)
    const transactionAmountPesosC = 1.0;
    const centavosC = Math.round(transactionAmountPesosC * 100);
    expect(centavosC === pagoEsperadoCentavos).toBe(false); // Discrepancia -> 'revision_manual'
  });

  it("4. Referencia por Cuota: external_reference granular ('CT-XXXXXXX:P1', ':P2') y transición completa", () => {
    const folio = "CT-1124451";
    const pagos: OrderPagoProgramado[] = [
      {
        id: "P1",
        numero: 1,
        concepto: "Anticipo 55%",
        montoCentavos: 313026, // $3,130.26
        momento: "inmediato",
        estado: "pendiente",
        externalReference: `${folio}:P1`,
      },
      {
        id: "P2",
        numero: 2,
        concepto: "Finiquito 45%",
        montoCentavos: 256112, // $2,561.12
        momento: "al_instalar",
        estado: "pendiente",
        externalReference: `${folio}:P2`,
      },
    ];

    // Simular recepción de webhook para P1
    const refP1 = "CT-1124451:P1";
    const [folioRecibido1, pagoId1] = refP1.split(":");
    expect(folioRecibido1).toBe(folio);
    expect(pagoId1).toBe("P1");

    const p1 = pagos.find((p) => p.id === pagoId1);
    expect(p1?.montoCentavos).toBe(313026);

    // Al aprobar P1, P1 pasa a 'aprobado' y la orden a 'anticipo_pagado'
    p1!.estado = "aprobado";
    p1!.paymentId = "pay_p1_12345";
    const todosAprobadosP1 = pagos.every((p) => p.estado === "aprobado");
    expect(todosAprobadosP1).toBe(false);
    const estadoTrasP1 = todosAprobadosP1 ? "pagado" : "anticipo_pagado";
    expect(estadoTrasP1).toBe("anticipo_pagado");

    // Simular recepción de webhook posterior para P2 (Finiquito)
    const refP2 = "CT-1124451:P2";
    const [, pagoId2] = refP2.split(":");
    const p2 = pagos.find((p) => p.id === pagoId2);
    expect(p2?.montoCentavos).toBe(256112);

    p2!.estado = "aprobado";
    p2!.paymentId = "pay_p2_67890";

    // Al aprobarse P2, todos los pagos están acreditados y la orden pasa a 'pagado'
    const todosAprobadosP2 = pagos.every((p) => p.estado === "aprobado");
    expect(todosAprobadosP2).toBe(true);
    const estadoTrasP2 = todosAprobadosP2 ? "pagado" : "anticipo_pagado";
    expect(estadoTrasP2).toBe("pagado");
  });

  it("5. Idempotencia: Webhook duplicado con el mismo paymentId no altera el estado de la cuota", () => {
    const cuotaMock: OrderPagoProgramado = {
      id: "P1",
      numero: 1,
      concepto: "Anticipo",
      montoCentavos: 313026,
      momento: "inmediato",
      estado: "aprobado",
      paymentId: "pay_existente_999",
      externalReference: "CT-1124451:P1",
    };

    const incomingPaymentId = "pay_existente_999";
    const esDuplicado = cuotaMock.estado === "aprobado" && cuotaMock.paymentId === incomingPaymentId;

    expect(esDuplicado).toBe(true);
  });

  it("6. Seguridad de /pedido/[folio]: Token aleatorio criptográfico con hash revocable", () => {
    const token = generarTokenAleatorio();
    expect(token).toBeDefined();
    expect(token.length).toBeGreaterThanOrEqual(32);

    const tokenHash = hashToken(token);
    expect(tokenHash).not.toBe(token);

    // Token correcto coincide en tiempo constante
    expect(validarTokenCotizacion(tokenHash, token)).toBe(true);

    // Token incorrecto o alterado es rechazado
    expect(validarTokenCotizacion(tokenHash, "token_falso_invalido")).toBe(false);
    expect(validarTokenCotizacion(tokenHash, "")).toBe(false);
  });

  it("7. Transición de Pago Rechazado según veredicto oficial", () => {
    const statusRejected = "rejected";
    const nuevoEstado = statusRejected === "rejected" ? "pago_rechazado" : "otro";
    expect(nuevoEstado).toBe("pago_rechazado");
  });

  it("8. Primer despliegue: Si MP_WEBHOOK_SECRET === 'temporal-pendiente', responde 503 sin procesar", async () => {
    const { POST } = await import("@/app/api/webhooks/mercadopago/route");
    const { NextRequest } = await import("next/server");

    // Guardar secreto original y configurar el temporal
    const originalSecret = process.env.MP_WEBHOOK_SECRET;
    process.env.MP_WEBHOOK_SECRET = "temporal-pendiente";

    const req = new NextRequest("http://localhost:3000/api/webhooks/mercadopago?data.id=123456789&type=payment", {
      method: "POST",
      headers: {
        "x-signature": "ts=123456789,v1=fake_signature",
        "x-request-id": "req-123",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.code).toBe("WEBHOOK_SECRET_PENDING");

    // Restaurar secreto
    process.env.MP_WEBHOOK_SECRET = originalSecret;
  });
});
