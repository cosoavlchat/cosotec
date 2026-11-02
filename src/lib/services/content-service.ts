import { adminDb, isFirestoreReady } from "@/lib/firebase/admin";
import { initialContentData, initialPricingSettings, initialContactSettings } from "../../../scripts/seed-data";

export async function getContentStats(): Promise<typeof initialContentData.stats> {
  if (!(await isFirestoreReady())) return initialContentData.stats;
  try {
    const snap = await adminDb.collection("content").doc("stats").get();
    if (snap.exists && snap.data()) return { ...initialContentData.stats, ...snap.data() } as any;
  } catch {}
  return initialContentData.stats;
}

export async function getContentHero(): Promise<typeof initialContentData.hero> {
  if (!(await isFirestoreReady())) return initialContentData.hero;
  try {
    const snap = await adminDb.collection("content").doc("hero").get();
    if (snap.exists && snap.data()) return { ...initialContentData.hero, ...snap.data() } as any;
  } catch {}
  return initialContentData.hero;
}

export async function getContentFaq(): Promise<typeof initialContentData.faq> {
  if (!(await isFirestoreReady())) return initialContentData.faq;
  try {
    const snap = await adminDb.collection("content").doc("faq").get();
    if (snap.exists && snap.data()?.items) return snap.data()?.items;
  } catch {}
  return initialContentData.faq;
}

export async function getContentAccesos(): Promise<typeof initialContentData.accesos> {
  if (!(await isFirestoreReady())) return initialContentData.accesos;
  try {
    const snap = await adminDb.collection("content").doc("accesos").get();
    if (snap.exists && snap.data()) return { ...initialContentData.accesos, ...snap.data() } as any;
  } catch {}
  return initialContentData.accesos;
}

export async function getContentLegales(): Promise<typeof initialContentData.legales> {
  if (!(await isFirestoreReady())) return initialContentData.legales;
  try {
    const snap = await adminDb.collection("content").doc("legales").get();
    if (snap.exists && snap.data()) return { ...initialContentData.legales, ...snap.data() } as any;
  } catch {}
  return initialContentData.legales;
}

export async function getTestimoniosActivos() {
  if (!(await isFirestoreReady())) return [];
  try {
    const snap = await adminDb
      .collection("content")
      .doc("testimonios")
      .collection("items")
      .where("activo", "==", true)
      .get();
    if (!snap.empty) {
      return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }
  } catch {}
  return []; // REGLA 2: Vacío si no hay testimonios reales aprobados
}

export async function getContactSettings() {
  if (!(await isFirestoreReady())) return initialContactSettings;
  try {
    const snap = await adminDb.collection("settings").doc("contact").get();
    if (snap.exists) return snap.data();
  } catch {}
  return initialContactSettings;
}

export async function getFeatureSettings() {
  if (!(await isFirestoreReady())) return { modoCotizadorWhatsapp: false };
  try {
    const snap = await adminDb.collection("settings").doc("features").get();
    if (snap.exists) return snap.data();
  } catch {}
  return { modoCotizadorWhatsapp: false };
}
