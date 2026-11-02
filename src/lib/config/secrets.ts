/**
 * CosoTec - Gestor de Secretos del Servidor
 * REGLA: Los secretos críticos deben existir en Secret Manager / variables de entorno.
 * Si falta un secreto obligatorio, la aplicación debe fallar al arrancar sin valores por defecto.
 */

export function getRequiredSecret(name: string): string {
  const value = process.env[name];

  if (!value || value.trim() === "") {
    // Si estamos en producción o en un entorno de nube (Cloud Run, App Hosting, K_SERVICE)
    const isProduction =
      process.env.NODE_ENV === "production" ||
      Boolean(process.env.K_SERVICE) ||
      Boolean(process.env.FIREBASE_CONFIG) ||
      process.env.VERCEL === "1";

    if (isProduction) {
      throw new Error(
        `[FATAL - SECRET MANAGER] El secreto obligatorio '${name}' no está definido en el entorno. La aplicación no puede arrancar sin sus credenciales oficiales.`
      );
    }

    // En desarrollo local (.env.local), advertir o requerir explícitamente
    throw new Error(
      `[CONFIG LOCAL] Falta la variable de entorno obligatoria '${name}'. Por favor configúrala en tu archivo .env.local o entorno de ejecución.`
    );
  }

  return value;
}

/**
 * Obtiene el secreto de firmado y hash de cotizaciones.
 */
export function getQuotesTokenSecret(): string {
  return getRequiredSecret("QUOTES_TOKEN_SECRET");
}

/**
 * Obtiene el secreto de sesión de carritos.
 */
export function getCartSessionSecret(): string {
  return getRequiredSecret("CART_SESSION_SECRET");
}

/**
 * Obtiene el Access Token de Mercado Pago.
 */
export function getMercadoPagoAccessTokenSecret(): string {
  return getRequiredSecret("MP_ACCESS_TOKEN");
}

/**
 * Obtiene el Secret de validación de Webhooks de Mercado Pago.
 */
export function getMercadoPagoWebhookSecretKey(): string {
  return getRequiredSecret("MP_WEBHOOK_SECRET");
}
