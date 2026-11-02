import { adminDb } from "@/lib/firebase/admin";

export interface TurnoDetalle {
  id: string;
  nombre: string;
  horario: string; // ej. "09:00–14:00"
  etiqueta: string; // ej. "Mañana (09:00–14:00)"
}

export interface TurnosSettings {
  manana: TurnoDetalle;
  tarde: TurnoDetalle;
  completo: TurnoDetalle;
}

export const DEFAULT_TURNOS_SETTINGS: TurnosSettings = {
  manana: {
    id: "manana",
    nombre: "Mañana",
    horario: "09:00–14:00",
    etiqueta: "Mañana (09:00–14:00)",
  },
  tarde: {
    id: "tarde",
    nombre: "Tarde",
    horario: "14:00–18:00",
    etiqueta: "Tarde (14:00–18:00)",
  },
  completo: {
    id: "completo",
    nombre: "Día completo",
    horario: "09:00–18:00",
    etiqueta: "Día completo (09:00–18:00)",
  },
};

/**
 * 3. Horarios de turno: se leen de settings/shifts (editables desde el admin).
 */
export async function getTurnosSettings(): Promise<TurnosSettings> {
  try {
    const snap = await adminDb.collection("settings").doc("shifts").get();
    if (snap.exists) {
      const data = snap.data() as Partial<TurnosSettings>;
      return {
        manana: { ...DEFAULT_TURNOS_SETTINGS.manana, ...(data?.manana || {}) },
        tarde: { ...DEFAULT_TURNOS_SETTINGS.tarde, ...(data?.tarde || {}) },
        completo: { ...DEFAULT_TURNOS_SETTINGS.completo, ...(data?.completo || {}) },
      };
    }
  } catch (err) {
    console.warn("[getTurnosSettings] No se pudo leer settings/shifts, usando defaults:", err);
  }
  return DEFAULT_TURNOS_SETTINGS;
}
