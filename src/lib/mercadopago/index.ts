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

export interface CrearPreferenciaParams {
  folio: string;
  externalReference: string; // ej: "CT-1124451:P1"
  token: string; // Token de seguridad para las back_urls
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    unit_price: number; // en pesos
  }>;
  payerEmail?: string;
  backUrlBase: string;
  notificationUrl?: string;
}

export interface PreferenciaResultado {
  id: string;
  initPoint: string;
  sandboxInitPoint: string;
}

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
    // Si no está configurado el secreto en entorno de pruebas, advertir pero permitir sólo en DEV
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
 * Consulta la API de Mercado Pago /v1/payments/{id} para obtener el estado real e inmutable del pago.
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
 * Crea una preferencia de pago en Mercado Pago Checkout Pro (Sandbox o Producción).
 */
export async function crearPreferenciaMercadoPago(
  params: CrearPreferenciaParams
): Promise<PreferenciaResultado> {
  const accessToken = getMercadoPagoAccessToken();

  if (!accessToken) {
    // Si no hay token configurado aún (modo sandbox simulado sin credenciales)
    console.warn("[Mercado Pago] MP_ACCESS_TOKEN no configurado. Generando preferencia simulada de prueba.");
    return {
      id: `pref_simulada_${params.externalReference.replace(":", "_")}`,
      initPoint: `${params.backUrlBase}/pedido/${params.folio}?t=${params.token}&mp_status=processing`,
      sandboxInitPoint: `${params.backUrlBase}/pedido/${params.folio}?t=${params.token}&mp_status=processing&sandbox=true`,
    };
  }

  const notificationUrl =
    params.notificationUrl || `${params.backUrlBase}/api/webhooks/mercadopago`;

  const body = {
    items: params.items,
    payer: params.payerEmail ? { email: params.payerEmail } : undefined,
    external_reference: params.externalReference,
    notification_url: notificationUrl,
    binary_mode: true, // REGLA: Sólo veredictos inmediatos approved/rejected (sin estados pendientes)
    payment_methods: {
      excluded_payment_types: [
        { id: "ticket" },
        { id: "bank_transfer" },
        { id: "atm" },
      ],
    },
    back_urls: {
      success: `${params.backUrlBase}/pedido/${params.folio}?t=${params.token}&mp_status=processing`,
      pending: `${params.backUrlBase}/pedido/${params.folio}?t=${params.token}&mp_status=processing`,
      failure: `${params.backUrlBase}/pedido/${params.folio}?t=${params.token}&mp_status=failure`,
    },
    auto_return: "approved",
    statement_descriptor: "COSOTEC GPS",
  };

  const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `[Mercado Pago API] Error al crear preferencia: Status ${res.status} - ${errText}`
    );
  }

  const data = await res.json();
  const isTestMode = accessToken.startsWith("TEST-");

  return {
    id: data.id,
    initPoint: isTestMode ? (data.sandbox_init_point || data.init_point) : data.init_point,
    sandboxInitPoint: data.sandbox_init_point || data.init_point,
  };
}

