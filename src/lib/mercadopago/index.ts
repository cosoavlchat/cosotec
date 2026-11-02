import crypto from "crypto";

export interface MercadoPagoPaymentResponse {
  id: number | string;
  status: "approved" | "in_process" | "pending" | "rejected" | "cancelled" | "refunded" | "charged_back";
  status_detail?: string;
  external_reference?: string;
  transaction_amount: number; // en pesos (float)
  currency_id?: string;
  date_approved?: string;
  payment_method_id?: string;
  payer?: {
    email?: string;
    first_name?: string;
    last_name?: string;
  };
}

export interface MercadoPagoOrderResponse {
  id: string; // ej: "ORD01K23219YK26BC6GK0HASE8VT6"
  type?: string; // "online"
  status: "created" | "processed" | "action_required" | "canceled" | "failed" | string;
  status_detail?: string;
  external_reference?: string; // ej: "CT-1124451-P1"
  total_amount: string | number; // Total de la orden en pesos
  checkout_url?: string;
  transactions?: {
    payments?: Array<{
      id: string | number;
      amount: string | number;
      status: string;
      status_detail?: string;
      payment_method?: {
        id?: string;
        type?: string;
        installments?: number;
      };
      date_approved?: string;
    }>;
  };
}

export interface CrearOrdenMercadoPagoParams {
  folio: string;
  externalReference: string; // ej: "CT-1124451-P1"
  token: string; // Token de seguridad para las back_urls
  items: Array<{
    id?: string;
    title: string;
    quantity: number;
    unit_price: number; // en pesos
  }>;
  payerEmail?: string;
  backUrlBase: string;
  notificationUrl?: string;
}

export type CrearPreferenciaParams = CrearOrdenMercadoPagoParams;

export interface OrdenMercadoPagoResultado {
  id: string; // ID de la orden en Mercado Pago (ORD...)
  checkoutUrl: string; // URL oficial de redirección Checkout Pro
  initPoint: string; // Alias para compatibilidad hacia atrás
  sandboxInitPoint: string; // Alias para compatibilidad hacia atrás
}

export type PreferenciaResultado = OrdenMercadoPagoResultado;

/**
 * Obtiene el token de acceso de Mercado Pago desde las variables de entorno / Secret Manager.
 */
export function getMercadoPagoAccessToken(): string | undefined {
  return process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN;
}

/**
 * Obtiene la clave pública de Mercado Pago para el checkout frontend.
 */
export function getMercadoPagoPublicKey(): string | undefined {
  return process.env.MP_PUBLIC_KEY || process.env.MERCADOPAGO_PUBLIC_KEY || process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;
}

/**
 * Obtiene la clave secreta para validación de firmas webhook.
 */
export function getMercadoPagoWebhookSecret(): string | undefined {
  return process.env.MP_WEBHOOK_SECRET || process.env.MERCADOPAGO_WEBHOOK_SECRET;
}

/**
 * Determina si la integración está operando en modo sandbox (pruebas).
 * No depende solo del prefijo del token (TEST- o APP_USR-):
 * Prioriza la variable de entorno MP_ENV ("sandbox" | "production").
 * Como respaldo heurístico, evalúa si el token inicia con "TEST-".
 */
export function isMercadoPagoSandbox(): boolean {
  const envVal = (process.env.MP_ENV || "").toLowerCase().trim();
  if (envVal === "sandbox") return true;
  if (envVal === "production") return false;

  const token = getMercadoPagoAccessToken() || "";
  return token.startsWith("TEST-");
}

/**
 * Valida la cabecera 'x-signature' enviada por el Webhook de Mercado Pago.
 * Especificación oficial MP:
 * - x-signature: "ts=[timestamp],v1=[hash_hmac_sha256]"
 * - Plantilla de manifiesto: "id:[data.id];request-id:[x-request-id];ts:[ts];"
 */
export function validarFirmaWebhook(
  signatureHeader: string | null,
  requestIdHeader: string | null,
  dataId: string,
  secretOverride?: string
): boolean {
  const secret = secretOverride || getMercadoPagoWebhookSecret();
  if (!secret) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[MP Webhook] MP_WEBHOOK_SECRET no configurado en entorno de desarrollo. Omitiendo validación.");
      return true;
    }
    return false;
  }

  if (!signatureHeader || !dataId) {
    return false;
  }

  // Parsear ts y v1 del header x-signature
  const parts = signatureHeader.split(",");
  let ts: string | undefined;
  let v1: string | undefined;

  for (const part of parts) {
    const [key, value] = part.trim().split("=");
    if (key === "ts") ts = value;
    if (key === "v1") v1 = value;
  }

  if (!ts || !v1) {
    return false;
  }

  // Plantilla oficial Mercado Pago:
  // Si x-request-id está presente: "id:[data.id];request-id:[x-request-id];ts:[ts];"
  // Si no está presente: "id:[data.id];ts:[ts];"
  let manifest = "";
  if (requestIdHeader) {
    manifest = `id:${dataId};request-id:${requestIdHeader};ts:${ts};`;
  } else {
    manifest = `id:${dataId};ts:${ts};`;
  }

  const expectedHash = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  const hashBuffer = Buffer.from(v1, "hex");
  const expectedBuffer = Buffer.from(expectedHash, "hex");

  if (hashBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(hashBuffer, expectedBuffer);
}

/**
 * Consulta la API de Mercado Pago Orders /v1/orders/{order_id} para obtener el estado inmutable de la orden.
 * Documentación oficial: developers.mercadopago.com/es/reference/orders/_orders_id/get
 */
export async function obtenerOrdenMercadoPago(
  orderId: string
): Promise<MercadoPagoOrderResponse> {
  const accessToken = getMercadoPagoAccessToken();

  if (!accessToken) {
    throw new Error(
      "[Mercado Pago] Falta MP_ACCESS_TOKEN en el entorno. No se puede consultar la orden."
    );
  }

  const res = await fetch(`https://api.mercadopago.com/v1/orders/${orderId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(
      `[Mercado Pago Orders API] Error al consultar orden ${orderId}: Status ${res.status} - ${errorBody}`
    );
  }

  return (await res.json()) as MercadoPagoOrderResponse;
}

/**
 * Consulta la API de Mercado Pago Payments /v1/payments/{id} (soporte para eventos de pago).
 * Documentación oficial: developers.mercadopago.com/es/reference/payments/_payments_id/get
 */
export async function obtenerPagoMercadoPago(
  paymentId: string | number
): Promise<MercadoPagoPaymentResponse> {
  const accessToken = getMercadoPagoAccessToken();

  if (!accessToken) {
    throw new Error(
      "[Mercado Pago] Falta MP_ACCESS_TOKEN en el entorno. No se puede consultar el pago."
    );
  }

  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(
      `[Mercado Pago API] Error al consultar pago ${paymentId}: Status ${res.status} - ${errorBody}`
    );
  }

  return (await res.json()) as MercadoPagoPaymentResponse;
}

/**
 * Patrón oficial para external_reference en Mercado Pago Orders API:
 * Longitud máxima: 64 caracteres.
 * Caracteres permitidos: Letras [a-zA-Z], números [0-9], guiones [-] y guiones bajos [_].
 * Enlace: https://www.mercadopago.com.mx/developers/es/reference/orders/_orders/post
 */
export const MP_EXTERNAL_REFERENCE_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;

export function validarExternalReferenceMP(ref: string): boolean {
  return MP_EXTERNAL_REFERENCE_REGEX.test(ref);
}

/**
 * Lista oficial exhaustiva de tipos de medio de pago en la API de Orders de Mercado Pago:
 * 'credit_card', 'debit_card', 'ticket', 'atm', 'bank_transfer', 'account_money', 'digital_currency', 'prepaid_card'
 */
export const MP_OFFICIAL_PAYMENT_METHOD_TYPES = [
  "credit_card",
  "debit_card",
  "ticket",
  "atm",
  "bank_transfer",
  "account_money",
  "digital_currency",
  "prepaid_card",
] as const;

/**
 * Tipos de pago no permitidos en CosoTec.
 * Excluye métodos en efectivo (ticket/atm), transferencias offline, dinero en cuenta y monedas digitales.
 * Permite ÚNICAMENTE: credit_card, debit_card y prepaid_card.
 */
export const MP_NOT_ALLOWED_PAYMENT_TYPES = [
  "ticket",
  "atm",
  "bank_transfer",
  "account_money",
  "digital_currency",
] as const;

/**
 * Crea una orden de pago en Mercado Pago Checkout Pro utilizando la API de Orders (/v1/orders).
 * Documentación oficial: developers.mercadopago.com/es/reference/orders/_orders/post
 *
 * Configuración de Calidad:
 * - type: "online"
 * - processing_mode: "manual" (específico para redirección Checkout Pro)
 * - capture_mode: "automatic" (captura inmediata)
 * - config.payment_method.not_allowed_types: exclusión estricta de efectivo, cheques, transferencias offline y wallets.
 *   Permite ÚNICAMENTE tarjetas de crédito, débito y prepagadas.
 * - config.online: URLs de retorno automáticas.
 * - X-Idempotency-Key: UUID único por intento para evitar duplicación.
 */
export async function crearOrdenMercadoPago(
  params: CrearOrdenMercadoPagoParams
): Promise<OrdenMercadoPagoResultado> {
  // Validación rigurosa del patrón oficial de external_reference antes de enviar
  if (!validarExternalReferenceMP(params.externalReference)) {
    throw new Error(
      `[Mercado Pago Orders] external_reference '${params.externalReference}' no cumple con el patrón oficial permitido (^[a-zA-Z0-9_-]{1,64}$).`
    );
  }

  const accessToken = getMercadoPagoAccessToken();

  if (!accessToken) {
    // Si no hay token configurado aún (modo simulado sin credenciales)
    console.warn("[Mercado Pago Orders] MP_ACCESS_TOKEN no configurado. Generando orden simulada de prueba.");
    const simulatedUrl = `${params.backUrlBase}/pedido/${params.folio}?t=${params.token}&mp_status=processing&sandbox=true`;
    const simulatedId = `ORD_sim_${params.externalReference.replace(/[-:]/g, "_")}`;
    return {
      id: simulatedId,
      checkoutUrl: simulatedUrl,
      initPoint: simulatedUrl,
      sandboxInitPoint: simulatedUrl,
    };
  }

  // Suma exacta de items para total_amount
  const totalPesos = params.items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );
  const totalAmountStr = totalPesos.toFixed(2);

  const body = {
    type: "online",
    processing_mode: "manual",
    capture_mode: "automatic",
    total_amount: totalAmountStr,
    external_reference: params.externalReference,
    payer: params.payerEmail ? { email: params.payerEmail } : undefined,
    config: {
      payment_method: {
        // Exclusión estricta según especificación oficial de Orders API.
        // Habilita tarjetas: credit_card, debit_card y prepaid_card.
        not_allowed_types: [...MP_NOT_ALLOWED_PAYMENT_TYPES],
        max_installments: 12,
      },
      online: {
        success_url: `${params.backUrlBase}/pedido/${params.folio}?t=${params.token}&mp_status=processing`,
        failure_url: `${params.backUrlBase}/pedido/${params.folio}?t=${params.token}&mp_status=failure`,
        pending_url: `${params.backUrlBase}/pedido/${params.folio}?t=${params.token}&mp_status=processing`,
        auto_return: "approved",
      },
    },
    items: params.items.map((it) => ({
      title: it.title,
      quantity: it.quantity,
      unit_price: Number(it.unit_price).toFixed(2),
    })),
  };

  const idempotencyKey = crypto.randomUUID();

  const res = await fetch("https://api.mercadopago.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `[Mercado Pago Orders API] Error al crear orden: Status ${res.status} - ${errText}`
    );
  }

  const data = await res.json();
  const checkoutUrl = data.checkout_url || data.init_point || "";

  return {
    id: data.id,
    checkoutUrl,
    initPoint: checkoutUrl,
    sandboxInitPoint: checkoutUrl,
  };
}

/**
 * Alias de compatibilidad hacia atrás para crearOrdenMercadoPago.
 */
export async function crearPreferenciaMercadoPago(
  params: CrearPreferenciaParams
): Promise<PreferenciaResultado> {
  return crearOrdenMercadoPago(params);
}
