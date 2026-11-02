import { adminDb, recordAuditLog, isFirestoreReady } from "@/lib/firebase/admin";
import { PricingSettings, TravelFee, BankSettings } from "@/types/pricing";
import { PricingSettingsSchema, TravelFeeSchema } from "@/lib/validations/pricing";
import { initialPricingSettings, initialTravelFees, initialBankSettings } from "../../../scripts/seed-data";
import { initialZonasSinCosto, ZonaSinCostoItem } from "@/lib/pricing/zonas-sin-costo";

export async function getZonasSinCosto(): Promise<ZonaSinCostoItem[]> {
  if (!(await isFirestoreReady())) return initialZonasSinCosto;
  try {
    const snap = await adminDb.collection("zonasSinCosto").get();
    if (!snap.empty) {
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ZonaSinCostoItem));
    }
  } catch (e) {
    console.warn("[getZonasSinCosto] Error leyendo zonasSinCosto:", e);
  }
  return initialZonasSinCosto;
}

export async function updateZonaSinCosto(
  id: string,
  data: Partial<ZonaSinCostoItem>,
  user?: { uid: string; email: string }
): Promise<ZonaSinCostoItem> {
  const ref = adminDb.collection("zonasSinCosto").doc(id);
  const snap = await ref.get();
  const before = snap.exists ? snap.data() : null;
  const updated = {
    ...(before || {}),
    ...data,
    id,
    updatedAt: new Date().toISOString(),
  } as ZonaSinCostoItem;

  await ref.set(updated, { merge: true });

  if (user) {
    await recordAuditLog({
      userId: user.uid,
      userEmail: user.email,
      entity: "zonasSinCosto",
      entityId: id,
      action: "update",
      before,
      after: updated,
    });
  }

  return updated;
}

export async function getPricingSettings(): Promise<PricingSettings> {
  if (!(await isFirestoreReady())) return initialPricingSettings;
  try {
    const snap = await adminDb.collection("settings").doc("pricing").get();
    if (snap.exists && snap.data()) {
      return snap.data() as PricingSettings;
    }
  } catch {}
  return initialPricingSettings;
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
  if (!(await isFirestoreReady())) return initialTravelFees;
  try {
    const snap = await adminDb.collection("travelFees").orderBy("estadoNombre", "asc").get();
    if (!snap.empty) {
      return snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as TravelFee));
    }
  } catch {}
  return initialTravelFees;
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

export async function getBankSettings(): Promise<BankSettings> {
  if (!(await isFirestoreReady())) return initialBankSettings;
  try {
    const snap = await adminDb.collection("settings").doc("bank").get();
    if (snap.exists && snap.data()) {
      return snap.data() as BankSettings;
    }
  } catch {}
  return initialBankSettings;
}

export async function updateBankSettings(
  data: Partial<BankSettings>,
  user: { uid: string; email: string }
): Promise<BankSettings> {
  const current = await getBankSettings();
  const updated: BankSettings = {
    ...current,
    ...data,
  };

  await adminDb.collection("settings").doc("bank").set(updated, { merge: true });

  await recordAuditLog({
    userId: user.uid,
    userEmail: user.email,
    entity: "bank",
    entityId: "bank",
    action: "update",
    before: current,
    after: updated,
  });

  return updated;
}
