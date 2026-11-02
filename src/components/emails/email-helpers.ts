/**
 * Utilidades de formateo y configuración para plantillas de correo electrónico.
 */

export const DEFAULT_EMAIL_FOOTER =
  "CosoTec by CoSoAVL · Metepec, Estado de México · ventas@cosoavl.com · Tel. 722 134 0127 · WhatsApp 722 432 2053";

/**
 * 3. Saludo: Extrae el nombre sin títulos profesionales ni de cortesía.
 * Ejemplo: "Ing. Roberto Domínguez" -> "Roberto Domínguez"
 * Ejemplo: "Lic. María Elena" -> "María Elena"
 */
export function limpiarTituloSaludo(nombre?: string): string {
  if (!nombre || nombre.trim() === "") return "Cliente";
  const regex = /^(ing\.|lic\.|sr\.|sra\.|dr\.|dra\.|arq\.|prof\.|profa\.|mtro\.|mtra\.)\s+/i;
  const limpio = nombre.trim().replace(regex, "").trim();
  return limpio || "Cliente";
}

/**
 * 7. Fechas en español deterministas (no dependientes del locale del SO).
 * Ejemplo: "2026-11-12" -> "jueves 12 de noviembre de 2026"
 */
export function formatFechaEspanol(fechaIso?: string): string {
  if (!fechaIso) return "Por coordinar";
  const match = fechaIso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return fechaIso;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1; // 0-based
  const day = parseInt(match[3], 10);

  const date = new Date(Date.UTC(year, month, day, 12, 0, 0));
  const diasSemana = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const meses = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];

  const diaSemana = diasSemana[date.getUTCDay()];
  const mes = meses[month];
  return `${diaSemana} ${day} de ${mes} de ${year}`;
}

/**
 * 7. Formato de horario con 'ñ': "Mañana" / "Tarde" / "Día completo".
 */
export function formatHorarioEspanol(horario?: string): string {
  if (!horario) return "Por coordinar";
  const h = horario.toLowerCase().trim();
  if (h === "manana" || h === "mañana") return "Mañana (09:00 - 14:00 hrs)";
  if (h === "tarde") return "Tarde (14:00 - 18:00 hrs)";
  if (h === "completo" || h === "dia_completo") return "Día completo (09:00 - 18:00 hrs)";
  return horario;
}

/**
 * 7. Teléfonos con formato local (10 dígitos: XXX XXX XXXX).
 * Ejemplo: "7221340127" o "+527221340127" -> "722 134 0127"
 */
export function formatTelefonoLocal(tel?: string): string {
  if (!tel) return "—";
  const digits = tel.replace(/\D/g, "");
  const local = digits.startsWith("52") && digits.length === 12 ? digits.slice(2) : digits;
  if (local.length === 10) {
    return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6, 10)}`;
  }
  return tel;
}

/**
 * 8. Dominio y base URL: Lee APP_BASE_URL por defecto, evitando cosotec.com fijo.
 */
export function getAppBaseUrl(siteUrlOverride?: string): string {
  if (siteUrlOverride && siteUrlOverride.trim() !== "") {
    return siteUrlOverride.replace(/\/+$/, "");
  }
  return (
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://cosotec7.web.app"
  ).replace(/\/+$/, "");
}
