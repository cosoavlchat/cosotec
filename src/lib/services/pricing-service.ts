import { adminDb, recordAuditLog } from "@/lib/firebase/admin";
import { PricingSettings, TravelFee } from "@/types/pricing";
import { PricingSettingsSchema, TravelFeeSchema } from "@/lib/validations/pricing";

export async function getPricingSettings(): Promise<PricingSettings> {
  const snap = await adminDb.collection("settings").doc("pricing").get();
  if (!snap.exists) {
    throw new Error("Configuración de precios (settings/pricing) no encontrada en Firestore");
  }
  return snap.data() as PricingSettings;
}

export async function updatePricingSettings(
  rawData: unknown,
  user: { uid: string; email: string }
): Promise<PricingSettings> {
  const validated = PricingSettingsSchema.parse(rawData);

  let beforeData: any = null;
  const snap = await adminDb.collection("settings").doc("pricing").get();
  if (snap.exists) {
    beforeData = snap.data();
  }

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

  return validated;
}

export async function getTravelFees(): Promise<TravelFee[]> {
  const snap = await adminDb.collection("travelFees").orderBy("estadoNombre", "asc").get();
  return snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as TravelFee));
}

export async function updateTravelFee(
  id: string,
  rawData: unknown,
  user: { uid: string; email: string }
): Promise<TravelFee> {
  const validated = TravelFeeSchema.parse(rawData);
  const now = new Date().toISOString();

  let beforeData: any = null;
  const snap = await adminDb.collection("travelFees").doc(id).get();
  if (snap.exists) {
    beforeData = snap.data();
  }

  const feeData: TravelFee = {
    id,
    ...validated,
    updatedAt: now,
  };

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

  return feeData;
}
