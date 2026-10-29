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
  modelo?: string;
  precioConIva?: string;
  cantidad?: number;
  pagina?: string;
  tipoConsulta?: "compra" | "cotizacion" | "general" | "instalacion" | "demo";
}

export function buildWhatsAppLink({
  producto,
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
  } else {
    mensaje += `me interesa cotizar:\n\n`;
  }

  if (producto) {
    mensaje += `📍 *Producto:* ${producto}${modelo ? ` (${modelo})` : ""}\n`;
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
