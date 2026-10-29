import { adminDb, recordAuditLog } from "@/lib/firebase/admin";
import { PricingSettings, TravelFee } from "@/types/pricing";
import { PricingSettingsSchema, TravelFeeSchema } from "@/lib/validations/pricing";
import { getLocalFallbackData, saveLocalFallbackData } from "./data-store";

export async function getPricingSettings(): Promise<PricingSettings> {
  try {
    const snap = await adminDb.collection("settings").doc("pricing").get();
    if (snap.exists) {
      return snap.data() as PricingSettings;
    }
  } catch (e) {}

  return getLocalFallbackData().pricing;
}

export async function updatePricingSettings(
  rawData: unknown,
  user: { uid: string; email: string }
): Promise<PricingSettings> {
  const validated = PricingSettingsSchema.parse(rawData);

  let beforeData: any = null;
  try {
    const snap = await adminDb.collection("settings").doc("pricing").get();
    if (snap.exists) {
      beforeData = snap.data();
    }
  } catch (e) {}

  try {
    await adminDb.collection("settings").doc("pricing").set(validated, { merge: true });

    await recordAuditLog({
      userId: user.uid,
      userEmail: user.email,
      entity: "pricing",
      entityId: "pricing",
      action: "update",
      before: beforeData,
      after: validated,
    });
  } catch (e) {
    console.warn("Error guardando settings/pricing en Firestore, usando fallback local.", e);
  }

  saveLocalFallbackData({ pricing: validated });
  return validated;
}

export async function getTravelFees(): Promise<TravelFee[]> {
  try {
    const snap = await adminDb.collection("travelFees").orderBy("estadoNombre", "asc").get();
    if (!snap.empty) {
      return snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as TravelFee));
    }
  } catch (e) {}

  return getLocalFallbackData().travelFees;
}

export async function updateTravelFee(
  id: string,
  rawData: unknown,
  user: { uid: string; email: string }
): Promise<TravelFee> {
  const validated = TravelFeeSchema.parse(rawData);
  const now = new Date().toISOString();

  let beforeData: any = null;
  try {
    const snap = await adminDb.collection("travelFees").doc(id).get();
    if (snap.exists) {
      beforeData = snap.data();
    }
  } catch (e) {}

  const feeData: TravelFee = {
    id,
    ...validated,
    updatedAt: now,
  };

  try {
    await adminDb.collection("travelFees").doc(id).set(feeData, { merge: true });

    await recordAuditLog({
      userId: user.uid,
      userEmail: user.email,
      entity: "travelFee",
      entityId: id,
      action: "update",
      before: beforeData,
      after: feeData,
    });
  } catch (e) {
    console.warn("Error actualizando travelFee en Firestore, usando fallback local.", e);
  }

  const local = getLocalFallbackData();
  const updatedFees = local.travelFees.map((f) => (f.id === id ? feeData : f));
  saveLocalFallbackData({ travelFees: updatedFees });

  return feeData;
}
