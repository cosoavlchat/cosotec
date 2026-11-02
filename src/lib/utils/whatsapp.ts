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

