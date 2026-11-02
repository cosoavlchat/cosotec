/**
 * Generador de enlaces a WhatsApp oficial (722 432 2053) con mensaje prellenado
 * para cotización o compra durante la Fase 2.
 */

export const WHATSAPP_NUMERO = "5217224322053";
export const WHATSAPP_DISPLAY = "722 432 2053";
export const TELEFONO_MATRIZ = "722 134 0127";
export const CORREO_VENTAS = "ventas@cosoavl.com";

export interface WhatsAppLinkParams {
  producto?: string;
  equipo?: string;
  modelo?: string;
  precioConIva?: string;
  cantidad?: number;
  pagina?: string;
  tipoConsulta?: "compra" | "cotizacion" | "general" | "instalacion" | "demo" | "asesoria";
}

export function buildWhatsAppLink({
  producto,
  equipo,
  modelo,
  precioConIva,
  cantidad = 1,
  pagina,
  tipoConsulta = "cotizacion",
}: WhatsAppLinkParams): string {
  let mensaje = "Hola CoSoAVL, ";

  if (tipoConsulta === "compra") {
    mensaje += `deseo adquirir el equipo:\n\n`;
  } else if (tipoConsulta === "instalacion") {
    mensaje += `solicito información sobre cobertura y tiempos de instalación:\n\n`;
  } else if (tipoConsulta === "demo") {
    mensaje += `me gustaría solicitar una demostración de la plataforma:\n\n`;
  } else if (tipoConsulta === "asesoria") {
    mensaje += `solicito asesoría técnica sobre:\n\n`;
  } else {
    mensaje += `me interesa cotizar:\n\n`;
  }

  const prodNombre = producto || equipo;
  if (prodNombre) {
    mensaje += `📍 *Producto:* ${prodNombre}${modelo ? ` (${modelo})` : ""}\n`;
  }
  if (cantidad > 1) {
    mensaje += `🔢 *Cantidad de unidades:* ${cantidad}\n`;
  }
  if (precioConIva) {
    mensaje += `💰 *Precio catálogo:* ${precioConIva}\n`;
  }
  if (pagina) {
    mensaje += `🌐 *Página:* ${pagina}\n`;
  }

  mensaje += `\n¿Podrían brindarme asesoría?`;

  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`;
}

export interface WhatsAppCartFallbackParams {
  errorId?: string;
  cartId?: string;
  items?: Array<{ nombre: string; cantidad: number }>;
  totalFormateado?: string;
  contactoNombre?: string;
}

export function buildWhatsAppCartFallbackLink({
  errorId,
  cartId,
  items,
  totalFormateado,
  contactoNombre,
}: WhatsAppCartFallbackParams): string {
  let mensaje = "Hola CosoTec, ";
  if (contactoNombre) {
    mensaje = `Hola CosoTec, soy ${contactoNombre}. `;
  }
  mensaje += `Tuve un inconveniente al generar mi orden en el sitio web${errorId ? ` (Código de incidencia: ${errorId})` : ""}.\n\n`;
  mensaje += `*Detalle de mi carrito:*\n`;
  if (items && items.length > 0) {
    items.forEach((it) => {
      mensaje += `• ${it.cantidad}x ${it.nombre}\n`;
    });
  }
  if (totalFormateado) {
    mensaje += `\n*Total:* ${totalFormateado}\n`;
  }
  if (cartId) {
    mensaje += `*ID Carrito:* ${cartId}\n`;
  }
  mensaje += `\n¿Me pueden apoyar para concluir mi compra por este medio?`;

  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`;
}

/**
 * Normaliza un número telefónico a 10 dígitos limpios para México.
 * Ejemplo: "+52 1 (722) 432-2053" -> "7224322053"
 */
export function normalizarWhatsapp(input: string): string {
  if (!input) return "";
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("521") && digits.length === 13) {
    digits = digits.slice(3);
  } else if (digits.startsWith("52") && digits.length === 12) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("1")) {
    digits = digits.slice(1);
  }
  return digits;
}

/**
 * Formatea un número de 10 dígitos para visualización limpia (ej. "722 432 2053").
 */
export function formatearWhatsapp(input: string): string {
  const norm = normalizarWhatsapp(input);
  if (norm.length !== 10) return input;
  return `${norm.slice(0, 3)} ${norm.slice(3, 6)} ${norm.slice(6)}`;
}

/**
 * Genera el enlace de WhatsApp que el vendedor envía al cliente con la cotización lista.
 */
export function buildEnvioCotizacionWhatsAppLink({
  clienteWhatsapp,
  clienteNombre,
  folio,
  token,
  totalFormateado,
  baseUrl = "https://cosotec--cosotec7.us-east4.hosted.app",
}: {
  clienteWhatsapp: string;
  clienteNombre: string;
  folio: string;
  token: string;
  totalFormateado: string;
  baseUrl?: string;
}): string {
  const norm = normalizarWhatsapp(clienteWhatsapp);
  const linkWeb = `${baseUrl}/c/${folio}?t=${token}`;

  const mensaje =
    `Hola ${clienteNombre}, te comparto tu cotización oficial de *CoSoAVL - CosoTec* con folio *${folio}*:\n\n` +
    `💰 *Inversión Total:* ${totalFormateado} (IVA e instalación profesional incluidos)\n\n` +
    `📄 *Puedes consultar el detalle completo y pagar en línea aquí:*\n` +
    `${linkWeb}\n\n` +
    `Quedo a tus órdenes para cualquier duda o para agendar la fecha de instalación de tus unidades.`;

  return `https://wa.me/521${norm}?text=${encodeURIComponent(mensaje)}`;
}

