/**
 * CosoTec - Módulo de Privacidad para Analítica (GA4 y Meta Pixel)
 * REGLA: Los tokens de seguridad (?t=...), folios y datos personales del cliente
 * jamás deben filtrarse en page_location, page_path ni eventos analíticos.
 */

export const SENSITIVE_ROUTES_PREFIXES = ["/c/", "/checkout", "/pedido/"];

/**
 * Determina si una ruta es sensible (contiene cotizaciones, checkout o pedidos).
 */
export function isSensitiveRoute(pathname: string): boolean {
  if (!pathname) return false;
  return SENSITIVE_ROUTES_PREFIXES.some(
    (prefix) => pathname.startsWith(prefix) || pathname === "/checkout"
  );
}

/**
 * Sanitiza la URL para GA4 y Meta Pixel:
 * En rutas sensibles, elimina estrictamente el query string (incluyendo ?t=... y parámetros de cliente).
 */
export function sanitizeAnalyticsUrl(
  origin: string,
  pathname: string,
  search: string = ""
): { page_path: string; page_location: string } {
  if (isSensitiveRoute(pathname)) {
    return {
      page_path: pathname,
      page_location: `${origin}${pathname}`, // Sin query string
    };
  }
  return {
    page_path: `${pathname}${search}`,
    page_location: `${origin}${pathname}${search}`,
  };
}

/**
 * Remueve claves sensibles (teléfono, correo, token, etc.) de los parámetros de eventos.
 */
export function sanitizeAnalyticsParams(
  params?: Record<string, any>
): Record<string, any> | undefined {
  if (!params) return undefined;

  const SENSITIVE_KEYS = new Set([
    "t",
    "token",
    "tokenhash",
    "telefono",
    "phone",
    "correo",
    "email",
    "nombre",
    "name",
    "cliente",
    "direccion",
    "address",
    "rfc",
    "curp",
    "clabe",
    "cuenta",
    "password",
  ]);

  const sanitized: Record<string, any> = {};
  for (const [key, val] of Object.entries(params)) {
    if (!SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

