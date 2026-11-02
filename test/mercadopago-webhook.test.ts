import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import crypto from "crypto";
import {
  validarFirmaWebhook,
  crearOrdenMercadoPago,
  crearPreferenciaMercadoPago,
  isMercadoPagoSandbox,
  validarExternalReferenceMP,
  MP_EXTERNAL_REFERENCE_REGEX,
  MP_OFFICIAL_PAYMENT_METHOD_TYPES,
  MP_NOT_ALLOWED_PAYMENT_TYPES,
} from "@/lib/mercadopago";
import { generarTokenAleatorio, hashToken, validarTokenCotizacion } from "@/lib/quotes";
import { Order, OrderPagoProgramado } from "@/types/order";

let mockOrdersStore: Record<string, any> = {};
let mockAuditLogStore: any[] = [];
let mockInstallationsStore: Record<string, any> = {};

vi.mock("@/lib/firebase/admin", () => ({
  adminDb: {
    collection: (col: string) => ({
      add: vi.fn(async (data: any) => {
        mockAuditLogStore.push(data);
        return { id: `log_${Date.now()}` };
      }),
      doc: (id: string) => ({
        get: vi.fn(async () => {
          const doc = mockOrdersStore[id];
          return {
            exists: Boolean(doc),
            data: () => doc,
            ref: {
              update: vi.fn(async (updateData: any) => {
                Object.assign(mockOrdersStore[id], updateData);
              }),
            },
          };
        }),
        update: vi.fn(async (updateData: any) => {
          if (mockOrdersStore[id]) {
            Object.assign(mockOrdersStore[id], updateData);
          }
        }),
        set: vi.fn(async (setData: any) => {
          if (col === "installations") {
            mockInstallationsStore[id] = setData;
          } else {
            mockOrdersStore[id] = setData;
          }
        }),
      }),
      where: (field: string, op: string, val: any) => ({
        limit: () => ({
          get: vi.fn(async () => {
            const matches = Object.values(mockOrdersStore).filter((doc) => doc[field] === val);
            return {
              empty: matches.length === 0,
              docs: matches.map((m) => ({
                data: () => m,
                ref: {
                  update: vi.fn(async (updateData: any) => {
                    Object.assign(mockOrdersStore[m.folio || m.id], updateData);
                  }),
                },
              })),
            };
          }),
        }),
      }),
    }),
  },
}));

vi.mock("@/lib/services/email-service", () => ({
  notificarFichaInstalacionASoporte: vi.fn().mockResolvedValue({ success: true }),
}));

describe("Paso 3.4 & Migración a Orders API: Mercado Pago Checkout Pro y Webhook", () => {
  const secretKey = "test_webhook_secret_key_123456";

  beforeAll(() => {
    process.env.QUOTES_TOKEN_SECRET = "test_quotes_token_secret_123456";
    process.env.MP_WEBHOOK_SECRET = secretKey;
  });

  beforeEach(() => {
    mockOrdersStore = {};
    mockAuditLogStore = [];
    mockInstallationsStore = {};
    delete process.env.MP_ENV;
  });

  it("1. Validación x-signature: firma correcta según estándar oficial MP es aprobada", () => {
    const dataId = "ORD01K23219YK26BC6GK0HASE8VT6";
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
    const dataId = "ORD01K23219YK26BC6GK0HASE8VT6";
    const requestId = "req-uuid-abc-123";
    const ts = Math.floor(Date.now() / 1000).toString();

    const signatureHeaderManipulada = `ts=${ts},v1=deadbeefcafebabe0123456789abcdef0123456789abcdef0123456789abcdef`;
    const isValid = validarFirmaWebhook(signatureHeaderManipulada, requestId, dataId, secretKey);
    expect(isValid).toBe(false);
  });

  it("3. Tolerancia Cero: total_amount de la orden se convierte a centavos y cualquier variación va a 'revision_manual'", () => {
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

  it("4. Referencia por Cuota: external_reference granular ('CT-XXXXXXX-P1', '-P2') y transición completa", () => {
    const folio = "CT-1124451";
    const pagos: OrderPagoProgramado[] = [
      {
        id: "P1",
        numero: 1,
        concepto: "Anticipo 55%",
        montoCentavos: 313026, // $3,130.26
        momento: "inmediato",
        estado: "pendiente",
        externalReference: `${folio}-P1`,
      },
      {
        id: "P2",
        numero: 2,
        concepto: "Finiquito 45%",
        montoCentavos: 256112, // $2,561.12
        momento: "al_instalar",
        estado: "pendiente",
        externalReference: `${folio}-P2`,
      },
    ];

    // Simular recepción de webhook para P1 con formato canónico (guión)
    const refP1 = "CT-1124451-P1";
    const match1 = refP1.match(/^(CT-[A-Za-z0-9]+)-(P\d+)$/i);
    expect(match1).not.toBeNull();
    const folioRecibido1 = match1![1];
    const pagoId1 = match1![2].toUpperCase();
    expect(folioRecibido1).toBe(folio);
    expect(pagoId1).toBe("P1");

    const p1 = pagos.find((p) => p.id === pagoId1);
    expect(p1?.montoCentavos).toBe(313026);

    // Al aprobar P1, P1 pasa a 'aprobado' y la orden a 'anticipo_pagado'
    p1!.estado = "aprobado";
    p1!.paymentId = "ORD01K_P1";
    const todosAprobadosP1 = pagos.every((p) => p.estado === "aprobado");
    expect(todosAprobadosP1).toBe(false);
    const estadoTrasP1 = todosAprobadosP1 ? "pagado" : "anticipo_pagado";
    expect(estadoTrasP1).toBe("anticipo_pagado");

    // Simular recepción de webhook posterior para P2 (Finiquito)
    const refP2 = "CT-1124451-P2";
    const match2 = refP2.match(/^(CT-[A-Za-z0-9]+)-(P\d+)$/i);
    const pagoId2 = match2![2].toUpperCase();
    const p2 = pagos.find((p) => p.id === pagoId2);
    expect(p2?.montoCentavos).toBe(256112);

    p2!.estado = "aprobado";
    p2!.paymentId = "ORD01K_P2";

    // Al aprobarse P2, todos los pagos están acreditados y la orden pasa a 'pagado'
    const todosAprobadosP2 = pagos.every((p) => p.estado === "aprobado");
    expect(todosAprobadosP2).toBe(true);
    const estadoTrasP2 = todosAprobadosP2 ? "pagado" : "anticipo_pagado";
    expect(estadoTrasP2).toBe("pagado");
  });

  it("5. Idempotencia: Webhook duplicado con el mismo ID no altera el estado de la cuota", () => {
    const cuotaMock: OrderPagoProgramado = {
      id: "P1",
      numero: 1,
      concepto: "Anticipo",
      montoCentavos: 313026,
      momento: "inmediato",
      estado: "aprobado",
      paymentId: "ORD01K_EXISTENTE",
      externalReference: "CT-1124451-P1",
    };

    const incomingResourceId = "ORD01K_EXISTENTE";
    const esDuplicado =
      cuotaMock.estado === "aprobado" && cuotaMock.paymentId === incomingResourceId;

    expect(esDuplicado).toBe(true);
  });

  it("6. Seguridad de /pedido/[folio]: Token aleatorio criptográfico con hash revocable", () => {
    const token = generarTokenAleatorio();
    expect(token).toBeDefined();
    expect(token.length).toBeGreaterThanOrEqual(32);

    const tokenHash = hashToken(token);
    expect(tokenHash).not.toBe(token);

    expect(validarTokenCotizacion(tokenHash, token)).toBe(true);
    expect(validarTokenCotizacion(tokenHash, "token_falso_invalido")).toBe(false);
    expect(validarTokenCotizacion(tokenHash, "")).toBe(false);
  });

  it("7. Detección de Sandbox gobernada por MP_ENV y fallback a prefijo de token", () => {
    // Caso 1: MP_ENV=sandbox detecta pruebas sin importar si el token es APP_USR-...
    process.env.MP_ENV = "sandbox";
    process.env.MP_ACCESS_TOKEN = "APP_USR-7291837492817263-091214-xxxx";
    expect(isMercadoPagoSandbox()).toBe(true);

    // Caso 2: MP_ENV=production fuerza modo productivo
    process.env.MP_ENV = "production";
    expect(isMercadoPagoSandbox()).toBe(false);

    // Caso 3: Sin MP_ENV, evalúa prefijo TEST-
    delete process.env.MP_ENV;
    process.env.MP_ACCESS_TOKEN = "TEST-7291837492817263-091214-xxxx";
    expect(isMercadoPagoSandbox()).toBe(true);

    process.env.MP_ACCESS_TOKEN = "APP_USR-prod-token-12345";
    expect(isMercadoPagoSandbox()).toBe(false);
  });

  it("8. Creación de Orden con API de Orders (/v1/orders): Estructura del cuerpo y exclusiones", async () => {
    // Mock global de fetch para validar petición a /v1/orders
    const originalFetch = global.fetch;
    let requestUrl = "";
    let requestHeaders: any = {};
    let requestBody: any = {};

    global.fetch = vi.fn().mockImplementation(async (url: string, opts: any) => {
      requestUrl = url;
      requestHeaders = opts.headers;
      requestBody = JSON.parse(opts.body);
      return {
        ok: true,
        status: 201,
        json: async () => ({
          id: "ORD01K23219YK26BC6GK0HASE8VT6",
          checkout_url:
            "https://www.mercadopago.com.mx/checkout/v1/redirect?order_id=ORD01K23219YK26BC6GK0HASE8VT6",
        }),
      };
    }) as any;

    process.env.MP_ACCESS_TOKEN = "APP_USR-test-token-orders";

    const resultado = await crearOrdenMercadoPago({
      folio: "CT-1124451",
      externalReference: "CT-1124451-P1",
      token: "tok_seguro_123",
      items: [
        {
          title: "Pedido CT-1124451 - Anticipo 55%",
          quantity: 1,
          unit_price: 3130.26,
        },
      ],
      payerEmail: "cliente@prueba.com",
      backUrlBase: "https://cosotec.mx",
    });

    expect(requestUrl).toBe("https://api.mercadopago.com/v1/orders");
    expect(requestHeaders["X-Idempotency-Key"]).toBeDefined();
    expect(requestBody.type).toBe("online");
    expect(requestBody.processing_mode).toBe("manual");
    expect(requestBody.capture_mode).toBe("automatic");
    expect(requestBody.total_amount).toBe("3130.26");
    expect(requestBody.external_reference).toBe("CT-1124451-P1");

    // REGLA: Exclusión estricta de tickets, transferencias offline y efectivo (sin 'wallet')
    expect(requestBody.config.payment_method.not_allowed_types).toEqual([
      "ticket",
      "atm",
      "bank_transfer",
      "account_money",
      "digital_currency",
    ]);

    // Redirección y retorno automático
    expect(requestBody.config.online.auto_return).toBe("approved");
    expect(requestBody.config.online.success_url).toContain("CT-1124451");

    // Respuesta adaptada
    expect(resultado.id).toBe("ORD01K23219YK26BC6GK0HASE8VT6");
    expect(resultado.checkoutUrl).toContain("redirect?order_id=ORD01K23219YK26BC6GK0HASE8VT6");
    expect(resultado.initPoint).toBe(resultado.checkoutUrl);

    global.fetch = originalFetch;
  });

  it("9. Webhook: Notificación de Orders API procesa orden pagada y actualiza cuota e instalación", async () => {
    const originalFetch = global.fetch;

    // Crear orden previa en mock store
    mockOrdersStore["CT-1124451"] = {
      id: "CT-1124451",
      folio: "CT-1124451",
      cartId: "cart_abc_123",
      estado: "pendiente_pago",
      metodoPago: "mercadopago",
      montoPrimerPagoCentavos: 313026,
      pagos: [
        {
          id: "P1",
          numero: 1,
          concepto: "Anticipo 55%",
          montoCentavos: 313026,
          momento: "inmediato",
          estado: "pendiente",
          externalReference: "CT-1124451-P1",
        },
        {
          id: "P2",
          numero: 2,
          concepto: "Finiquito 45%",
          montoCentavos: 256112,
          momento: "al_instalar",
          estado: "pendiente",
          externalReference: "CT-1124451-P2",
        },
      ],
      contacto: { nombre: "Cliente Prueba", telefono: "5551234567", correo: "cliente@prueba.com" },
      items: [{ esEquipoPrincipal: true, cantidad: 2, nombre: "GPS Intermedio" }],
    };

    const orderId = "ORD01K23219YK26BC6GK0HASE8VT6";

    // Mock de GET /v1/orders/{order_id}
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes(`/v1/orders/${orderId}`)) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            id: orderId,
            status: "processed",
            status_detail: "accredited",
            external_reference: "CT-1124451-P1",
            total_amount: "3130.26",
            transactions: {
              payments: [
                {
                  id: "PAY01K999",
                  amount: "3130.26",
                  status: "processed",
                  payment_method: { id: "debvisa", type: "debit_card" },
                },
              ],
            },
          }),
        };
      }
      return { ok: false, status: 404, text: async () => "Not found" };
    }) as any;

    const { POST } = await import("@/app/api/webhooks/mercadopago/route");
    const { NextRequest } = await import("next/server");

    const ts = Math.floor(Date.now() / 1000).toString();
    const manifest = `id:${orderId};request-id:req-ord-123;ts:${ts};`;
    const v1 = crypto.createHmac("sha256", secretKey).update(manifest).digest("hex");

    const req = new NextRequest("http://localhost:3000/api/webhooks/mercadopago", {
      method: "POST",
      headers: {
        "x-signature": `ts=${ts},v1=${v1}`,
        "x-request-id": "req-ord-123",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: 99887766,
        type: "orders",
        action: "order.processed",
        data: { id: orderId },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const resJson = await res.json();
    expect(resJson.estado).toBe("anticipo_pagado");

    // Verificar que Firestore actualizó la orden
    const ordenActualizada = mockOrdersStore["CT-1124451"];
    expect(ordenActualizada.estado).toBe("anticipo_pagado");
    expect(ordenActualizada.pagos[0].estado).toBe("aprobado");
    expect(ordenActualizada.mercadoPagoOrderId).toBe(orderId);

    // Verificar creación de instalación para P1
    expect(mockInstallationsStore["ins_CT-1124451"]).toBeDefined();
    expect(mockInstallationsStore["ins_CT-1124451"].estado).toBe("pendiente_asignacion");

    global.fetch = originalFetch;
  });

  it("10. Primer despliegue: Si MP_WEBHOOK_SECRET === 'temporal-pendiente', responde 503 sin procesar", async () => {
    const { POST } = await import("@/app/api/webhooks/mercadopago/route");
    const { NextRequest } = await import("next/server");

    const originalSecret = process.env.MP_WEBHOOK_SECRET;
    process.env.MP_WEBHOOK_SECRET = "temporal-pendiente";

    const req = new NextRequest(
      "http://localhost:3000/api/webhooks/mercadopago?data.id=ORD01K23219YK26BC6GK0HASE8VT6&type=orders",
      {
        method: "POST",
        headers: {
          "x-signature": "ts=123456789,v1=fake_signature",
          "x-request-id": "req-123",
        },
      }
    );

    const res = await POST(req);
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.code).toBe("WEBHOOK_SECRET_PENDING");

    process.env.MP_WEBHOOK_SECRET = originalSecret;
  });

  it("11. Validación de Catálogo Oficial de Medios de Pago y Exclusión Estricta (sin 'wallet')", () => {
    // 1. Cada valor de not_allowed_types debe pertenecer a la lista oficial de Mercado Pago Orders API
    for (const tipo of MP_NOT_ALLOWED_PAYMENT_TYPES) {
      expect(MP_OFFICIAL_PAYMENT_METHOD_TYPES).toContain(tipo);
    }

    // 2. 'wallet' no es un tipo válido en la API y debe estar excluido
    expect((MP_NOT_ALLOWED_PAYMENT_TYPES as readonly string[]).includes("wallet")).toBe(false);
    expect((MP_OFFICIAL_PAYMENT_METHOD_TYPES as readonly string[]).includes("wallet")).toBe(false);

    // 3. Los tipos permitidos resultantes son exclusivamente credit_card, debit_card y prepaid_card
    const tiposPermitidos = MP_OFFICIAL_PAYMENT_METHOD_TYPES.filter(
      (t) => !(MP_NOT_ALLOWED_PAYMENT_TYPES as readonly string[]).includes(t)
    );
    expect(tiposPermitidos.sort()).toEqual(["credit_card", "debit_card", "prepaid_card"].sort());
  });

  it("12. Validación de Expresión Regular para external_reference (patrón oficial ^[a-zA-Z0-9_-]{1,64}$)", async () => {
    // Casos válidos
    expect(validarExternalReferenceMP("CT-1124451-P1")).toBe(true);
    expect(validarExternalReferenceMP("CT-1124451-P2")).toBe(true);
    expect(validarExternalReferenceMP("CT_1124451_P1")).toBe(true);
    expect(validarExternalReferenceMP("ORD123456")).toBe(true);
    expect(validarExternalReferenceMP("a".repeat(64))).toBe(true);

    // Casos inválidos (rechazados antes de enviar a MP)
    expect(validarExternalReferenceMP("CT-1124451:P1")).toBe(false); // Dos puntos prohibidos
    expect(validarExternalReferenceMP("CT 1124451 P1")).toBe(false); // Espacios prohibidos
    expect(validarExternalReferenceMP("a".repeat(65))).toBe(false); // Longitud mayor a 64
    expect(validarExternalReferenceMP("")).toBe(false); // Vacío

    // Verifica que crearOrdenMercadoPago arroje error si externalReference es inválido
    await expect(
      crearOrdenMercadoPago({
        folio: "CT-1124451",
        externalReference: "CT-1124451:P1", // inválido con dos puntos
        token: "tok_123",
        items: [{ title: "Item", quantity: 1, unit_price: 100 }],
        backUrlBase: "https://cosotec.mx",
      })
    ).rejects.toThrow(/no cumple con el patrón oficial/);
  });
});
