import { adminDb } from "@/lib/firebase/admin";
import { BankSettings } from "@/types/pricing";

export const DEFAULT_BANK_SETTINGS: BankSettings = {
  banco: "Banco de prueba",
  titular: "CUENTA DE PRUEBA – NO TRANSFERIR",
  clabe: "012180001234567897",
  cuenta: "0123456789",
  convenio: "PRUEBA-1234",
  esPrueba: true,
};

/**
 * Obtiene la configuración bancaria actual desde settings/bank en Firestore.
 * Si esPrueba es true, las interfaces públicas y PDFs deben mostrar obligatoriamente
 * el banner de advertencia para evitar depósitos reales accidentales.
 */
export async function getBankSettings(): Promise<BankSettings> {
  try {
    const snap = await adminDb.collection("settings").doc("bank").get();
    if (snap.exists) {
      const data = snap.data() as Partial<BankSettings>;
      return {
        ...DEFAULT_BANK_SETTINGS,
        ...data,
      };
    }
  } catch (err) {
    console.warn("[getBankSettings] No se pudo leer settings/bank de Firestore, usando defaults:", err);
  }
  return DEFAULT_BANK_SETTINGS;
}

