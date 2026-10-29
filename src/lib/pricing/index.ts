/**
 * CosoTec - Motor de Precios y Manejo de Moneda
 * REGLA 1: Todos los montos se almacenan y calculan en CENTAVOS enteros (ej. $100.00 MXN = 10000 centavos).
 * REGLA 2: En base de datos sólo se guarda el precio sin IVA.
 */

export const DEFAULT_IVA_PERCENT = 16;

/**
 * Calcula el IVA en centavos redondeado a entero.
 */
export function calcularIvaCentavos(
  precioSinIvaCentavos: number,
  ivaPercent: number = DEFAULT_IVA_PERCENT
): number {
  if (!Number.isInteger(precioSinIvaCentavos)) {
    throw new TypeError(
      `precioSinIvaCentavos debe ser un entero en centavos. Recibido: ${precioSinIvaCentavos}`
    );
  }
  return Math.round(precioSinIvaCentavos * (ivaPercent / 100));
}

/**
 * Retorna el precio total con IVA en centavos.
 * Garantiza: totalCentavos === precioSinIvaCentavos + ivaCentavos.
 */
export function precioConIva(
  precioSinIvaCentavos: number,
  ivaPercent: number = DEFAULT_IVA_PERCENT
): number {
  const iva = calcularIvaCentavos(precioSinIvaCentavos, ivaPercent);
  return precioSinIvaCentavos + iva;
}

/**
 * Retorna el desglose exacto (subtotal, IVA y total con IVA) en centavos.
 */
export function desglosePrecio(
  precioSinIvaCentavos: number,
  ivaPercent: number = DEFAULT_IVA_PERCENT
): {
  precioSinIvaCentavos: number;
  ivaCentavos: number;
  totalConIvaCentavos: number;
} {
  const ivaCentavos = calcularIvaCentavos(precioSinIvaCentavos, ivaPercent);
  return {
    precioSinIvaCentavos,
    ivaCentavos,
    totalConIvaCentavos: precioSinIvaCentavos + ivaCentavos,
  };
}

/**
 * Formatea un entero en centavos al estándar de moneda mexicana:
 * Ej: 550000 -> "$5,500.00"
 */
export function formatMxn(centavos: number, incluirSimbolo: boolean = true): string {
  if (!Number.isFinite(centavos)) return "$0.00";
  const esNegativo = centavos < 0;
  const absCentavos = Math.abs(Math.round(centavos));
  const pesos = Math.floor(absCentavos / 100);
  const residuoCentavos = absCentavos % 100;

  const pesosStr = pesos.toLocaleString("es-MX");
  const centavosStr = residuoCentavos.toString().padStart(2, "0");

  const formateado = `${pesosStr}.${centavosStr}`;
  if (esNegativo) {
    return incluirSimbolo ? `-$${formateado}` : `-${formateado}`;
  }
  return incluirSimbolo ? `$${formateado}` : formateado;
}

/**
 * Convierte un número o string con formato (ej. "5,500.50" o 5500.5) a centavos enteros.
 */
export function parseToCentavos(valor: string | number): number {
  if (typeof valor === "number") {
    return Math.round(valor * 100);
  }
  const limpio = valor.replace(/[^0-9.-]/g, "");
  const num = parseFloat(limpio);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}
