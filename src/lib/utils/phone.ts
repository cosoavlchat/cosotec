/**
 * Utilidades para manejo, validación y formateo de números telefónicos
 * según la norma E.164 (+52XXXXXXXXXX) y formato local mexicano.
 */

/**
 * Normaliza un número telefónico a formato E.164 (+52XXXXXXXXXX).
 * Elimina caracteres no numéricos y prefijos redundantes (como el antiguo 1 de móviles 521).
 */
export function normalizePhoneE164(input: string): string {
  if (!input) return "";

  // Remover todo lo que no sea dígito
  let digits = input.replace(/\D/g, "");

  // Si comienza con 521 y tiene 13 dígitos (antiguo formato telcel móvil 52 1 XX...)
  if (digits.startsWith("521") && digits.length === 13) {
    digits = "52" + digits.slice(3);
  }

  // Si comienza con 52 y tiene 12 dígitos (+52XXXXXXXXXX)
  if (digits.startsWith("52") && digits.length === 12) {
    return `+${digits}`;
  }

  // Si tiene exactamente 10 dígitos (número nacional estándar)
  if (digits.length === 10) {
    return `+52${digits}`;
  }

  // Fallback si ya tiene formato internacional pero longitud distinta
  if (input.trim().startsWith("+")) {
    return `+${digits}`;
  }

  return `+52${digits}`;
}

/**
 * Formatea un teléfono E.164 o de 10 dígitos a formato legible local:
 * - Lada 2 dígitos (CDMX 55/56, GDL 33, MTY 81): (55) 5000-0000
 * - Lada 3 dígitos (Toluca 722, Querétaro 442, etc.): (722) 432-2053
 */
export function formatPhoneLocal(input: string): string {
  if (!input) return "";

  let digits = input.replace(/\D/g, "");

  // Eliminar prefijo 52 si está presente al inicio
  if (digits.startsWith("521") && digits.length === 13) {
    digits = digits.slice(3);
  } else if (digits.startsWith("52") && digits.length === 12) {
    digits = digits.slice(2);
  }

  // Si no son exactamente 10 dígitos, regresar input limpio
  if (digits.length !== 10) {
    return input;
  }

  const lada2 = ["55", "56", "33", "81"];
  const prefix2 = digits.slice(0, 2);

  if (lada2.includes(prefix2)) {
    // Formato (XX) XXXX-XXXX
    return `(${prefix2}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  } else {
    // Formato (XXX) XXX-XXXX
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
}

/**
 * Valida si un string corresponde a un teléfono nacional mexicano válido de 10 dígitos.
 */
export function isValidMexicanPhone(input: string): boolean {
  if (!input) return false;
  let digits = input.replace(/\D/g, "");

  if (digits.startsWith("521") && digits.length === 13) {
    digits = digits.slice(3);
  } else if (digits.startsWith("52") && digits.length === 12) {
    digits = digits.slice(2);
  }

  return digits.length === 10;
}

