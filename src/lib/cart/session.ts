import crypto from "crypto";

export const CART_SESSION_COOKIE_NAME = "cosotec_cart_session";

function getCartSecret(): string {
  return (
    process.env.CART_SESSION_SECRET ||
    process.env.QUOTES_TOKEN_SECRET ||
    "cosotec_cart_session_secure_hmac_secret_2026_blaze"
  );
}

/**
 * Genera un cartId criptográfico aleatorio, no adivinable (24 bytes base64url).
 */
export function generarCartId(): string {
  return crypto.randomBytes(24).toString("base64url");
}

/**
 * Firma un cartId para guardarlo en una cookie httpOnly de sesión.
 * Formato: `${cartId}.${hmacSignature}`
 */
export function signCartSession(cartId: string): string {
  const secret = getCartSecret();
  const signature = crypto.createHmac("sha256", secret).update(cartId).digest("base64url");
  return `${cartId}.${signature}`;
}

/**
 * Verifica la firma de la cookie de sesión del carrito usando comparación en tiempo constante.
 * Retorna el cartId válido o null si la firma no coincide o es inválida.
 */
export function verifyCartSession(cookieValue: string | undefined | null): string | null {
  if (!cookieValue || typeof cookieValue !== "string") {
    return null;
  }

  const parts = cookieValue.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [cartId, providedSignature] = parts;
  if (!cartId || !providedSignature) {
    return null;
  }

  const secret = getCartSecret();
  const expectedSignature = crypto.createHmac("sha256", secret).update(cartId).digest("base64url");

  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (providedBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
    return cartId;
  }

  return null;
}

