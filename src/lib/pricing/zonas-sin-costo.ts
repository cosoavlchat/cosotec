/**
 * Delimitación inicial de Zonas Metropolitanas oficiales (INEGI / CONAPO / SEDATU)
 * para viáticos sin costo en CosoTec.
 * Marcadas como "por validar" hasta confirmación definitiva del cliente.
 */

export interface ZonaSinCostoItem {
  id: string; // e.g. "zm-toluca"
  nombreZona: string;
  estadoId: string; // Clave INEGI (MEX, CDMX, NLE, JAL, QRO)
  estadoNombre: string;
  estatus: "por_validar" | "confirmada";
  notas: string;
  municipios: string[];
}

export const initialZonasSinCosto: ZonaSinCostoItem[] = [
  {
    id: "zm-valle-toluca",
    nombreZona: "Zona Metropolitana del Valle de Toluca",
    estadoId: "MEX",
    estadoNombre: "Estado de México",
    estatus: "por_validar",
    notas: "Sin costo en municipios metropolitanos del Valle de Toluca; resto del estado se cotiza.",
    municipios: [
      "Toluca",
      "Metepec",
      "Lerma",
      "San Mateo Atenco",
      "Zinacantepec",
      "Almoloya de Juárez",
      "Calimaya",
      "Chapultepec",
      "Mexicaltzingo",
      "Ocoyoacac",
      "Otzolotepec",
      "Rayón",
      "San Antonio la Isla",
      "Temoaya",
      "Tenango del Valle",
      "Xonacatlán",
    ],
  },
  {
    id: "zm-valle-mexico-edomex",
    nombreZona: "Zona Metropolitana del Valle de México (Edomex Conurbado)",
    estadoId: "MEX",
    estadoNombre: "Estado de México",
    estatus: "por_validar",
    notas: "Sin costo en municipios conurbados del Valle de México; resto del estado se cotiza.",
    municipios: [
      "Naucalpan de Juárez",
      "Tlalnepantla de Baz",
      "Huixquilucan",
      "Atizapán de Zaragoza",
      "Cuautitlán Izcalli",
      "Cuautitlán",
      "Tultitlán",
      "Coacalco de Berriozábal",
      "Ecatepec de Morelos",
      "Nezahualcóyotl",
      "Chimalhuacán",
      "Chicoloapan",
      "La Paz",
      "Ixtapaluca",
      "Chalco",
      "Valle de Chalco Solidaridad",
      "Nicolás Romero",
      "Tecámac",
      "Tepotzotlán",
      "Tultepec",
    ],
  },
  {
    id: "zm-valle-mexico-cdmx",
    nombreZona: "Zona Metropolitana de la Ciudad de México (16 Alcaldías)",
    estadoId: "CDMX",
    estadoNombre: "Ciudad de México",
    estatus: "por_validar",
    notas: "Sin costo en las 16 alcaldías de la Ciudad de México.",
    municipios: [
      "Álvaro Obregón",
      "Azcapotzalco",
      "Benito Juárez",
      "Coyoacán",
      "Cuajimalpa de Morelos",
      "Cuauhtémoc",
      "Gustavo A. Madero",
      "Iztacalco",
      "Iztapalapa",
      "La Magdalena Contreras",
      "Miguel Hidalgo",
      "Milpa Alta",
      "Tláhuac",
      "Tlalpan",
      "Venustiano Carranza",
      "Xochimilco",
    ],
  },
  {
    id: "zm-monterrey",
    nombreZona: "Zona Metropolitana de Monterrey",
    estadoId: "NLE",
    estadoNombre: "Nuevo León",
    estatus: "por_validar",
    notas: "Sin costo en el área metropolitana de Monterrey; resto del estado se cotiza.",
    municipios: [
      "Monterrey",
      "San Pedro Garza García",
      "San Nicolás de los Garza",
      "Guadalupe",
      "Apodaca",
      "General Escobedo",
      "Santa Catarina",
      "García",
      "Juárez",
      "Santiago",
      "Cadereyta Jiménez",
      "Salinas Victoria",
      "Pesquería",
    ],
  },
  {
    id: "zm-guadalajara",
    nombreZona: "Zona Metropolitana de Guadalajara",
    estadoId: "JAL",
    estadoNombre: "Jalisco",
    estatus: "por_validar",
    notas: "Sin costo en el área conurbada de Guadalajara; resto del estado se cotiza.",
    municipios: [
      "Guadalajara",
      "Zapopan",
      "San Pedro Tlaquepaque",
      "Tonalá",
      "Tlajomulco de Zúñiga",
      "El Salto",
      "Ixtlahuacán de los Membrillos",
      "Juanacatlán",
      "Zapotlanejo",
    ],
  },
  {
    id: "zm-queretaro",
    nombreZona: "Zona Metropolitana de Querétaro",
    estadoId: "QRO",
    estadoNombre: "Querétaro",
    estatus: "por_validar",
    notas: "Sin costo en la zona metropolitana de Querétaro capital; resto del estado se cotiza.",
    municipios: [
      "Querétaro",
      "Corregidora",
      "El Marqués",
      "Huimilpan",
    ],
  },
];

/**
 * Normaliza nombres de municipios para comparación insensible a mayúsculas y acentos.
 */
export function normalizeString(str: string): string {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

/**
 * Retorna todos los municipios sin costo para un estado dado (MEX, CDMX, NLE, JAL, QRO).
 */
export function getMunicipiosSinCosto(estadoId: string, zonas: ZonaSinCostoItem[] = initialZonasSinCosto): string[] {
  const zonasEstado = zonas.filter((z) => z.estadoId === estadoId);
  const municipiosSet = new Set<string>();
  for (const z of zonasEstado) {
    for (const m of z.municipios) {
      municipiosSet.add(m);
    }
  }
  return Array.from(municipiosSet).sort((a, b) => a.localeCompare(b, "es"));
}

/**
 * Evalúa si un municipio específico dentro de un estado goza de instalación sin costo de viáticos.
 */
export function esMunicipioSinCosto(
  estadoId: string,
  municipioNombre: string,
  zonas: ZonaSinCostoItem[] = initialZonasSinCosto
): boolean {
  if (!estadoId || !municipioNombre) return false;
  const target = normalizeString(municipioNombre);
  if (target === "otro" || target.includes("resto del estado") || target.includes("por cotizar")) {
    return false;
  }
  const municipiosSinCosto = getMunicipiosSinCosto(estadoId, zonas);
  return municipiosSinCosto.some((m) => normalizeString(m) === target);
}
