import { adminDb, recordAuditLog } from "@/lib/firebase/admin";
import { Product, Package } from "@/types/catalog";
import { ProductSchema, PackageSchema } from "@/lib/validations/catalog";
import { getLocalFallbackData, saveLocalFallbackData } from "./data-store";

export async function getProducts(includeInactive: boolean = true): Promise<Product[]> {
  try {
    let query = adminDb.collection("products") as any;
    if (!includeInactive) {
      query = query.where("activo", "==", true);
    }
    const snap = await query.orderBy("orden", "asc").get();
    if (!snap.empty) {
      return snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Product));
    }
  } catch (error) {
    // Modo fallback local si no hay emulador/conexión
  }

  const local = getLocalFallbackData();
  return includeInactive ? local.products : local.products.filter((p) => p.activo);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const doc = await adminDb.collection("products").doc(slug).get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data() } as Product;
    }
  } catch (e) {
    // Fallback
  }

  const local = getLocalFallbackData();
  return local.products.find((p) => p.slug === slug) || null;
}

export async function saveProduct(
  rawData: unknown,
  user: { uid: string; email: string }
): Promise<Product> {
  const validated = ProductSchema.parse(rawData);
  const now = new Date().toISOString();

  let beforeData: any = null;
  try {
    const docSnap = await adminDb.collection("products").doc(validated.slug).get();
    if (docSnap.exists) {
      beforeData = docSnap.data();
    }
  } catch (e) {
    // Fallback
  }

  const productData: Product = {
    id: validated.slug,
    ...validated,
    updatedAt: now,
    createdAt: beforeData?.createdAt || now,
  };

  // Guardar en Firestore
  try {
    await adminDb.collection("products").doc(validated.slug).set(productData, { merge: true });

    await recordAuditLog({
      userId: user.uid,
      userEmail: user.email,
      entity: "product",
      entityId: validated.slug,
      action: beforeData ? "update" : "create",
      before: beforeData,
      after: productData,
    });
  } catch (error) {
    console.warn("No se pudo escribir en Firestore, guardando en store local.", error);
  }

  // Sincronizar en store local
  const local = getLocalFallbackData();
  const existingIdx = local.products.findIndex((p) => p.slug === validated.slug);
  let updatedProducts: Product[];
  if (existingIdx >= 0) {
    updatedProducts = [...local.products];
    updatedProducts[existingIdx] = productData;
  } else {
    updatedProducts = [...local.products, productData];
  }
  saveLocalFallbackData({ products: updatedProducts });

  return productData;
}

export async function toggleProductStatus(
  slug: string,
  activo: boolean,
  user: { uid: string; email: string }
): Promise<boolean> {
  let beforeData: any = null;
  try {
    const ref = adminDb.collection("products").doc(slug);
    const snap = await ref.get();
    if (snap.exists) {
      beforeData = snap.data();
      await ref.update({ activo, updatedAt: new Date().toISOString() });
    }

    await recordAuditLog({
      userId: user.uid,
      userEmail: user.email,
      entity: "product",
      entityId: slug,
      action: "toggle_status",
      before: { activo: beforeData?.activo },
      after: { activo },
    });
  } catch (e) {
    // Fallback
  }

  const local = getLocalFallbackData();
  const updated = local.products.map((p) => (p.slug === slug ? { ...p, activo } : p));
  saveLocalFallbackData({ products: updated });

  return true;
}

export async function getPackages(includeInactive: boolean = true): Promise<Package[]> {
  try {
    let query = adminDb.collection("packages") as any;
    if (!includeInactive) {
      query = query.where("activo", "==", true);
    }
    const snap = await query.get();
    if (!snap.empty) {
      return snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Package));
    }
  } catch (error) {
    // Fallback
  }

  const local = getLocalFallbackData();
  return includeInactive ? local.packages : local.packages.filter((p) => p.activo);
}

export async function savePackage(
  rawData: unknown,
  user: { uid: string; email: string }
): Promise<Package> {
  const validated = PackageSchema.parse(rawData);
  const now = new Date().toISOString();

  let beforeData: any = null;
  try {
    const docSnap = await adminDb.collection("packages").doc(validated.slug).get();
    if (docSnap.exists) {
      beforeData = docSnap.data();
    }
  } catch (e) {}

  const packageData: Package = {
    id: validated.slug,
    ...validated,
    updatedAt: now,
    createdAt: beforeData?.createdAt || now,
  };

  try {
    await adminDb.collection("packages").doc(validated.slug).set(packageData, { merge: true });

    await recordAuditLog({
      userId: user.uid,
      userEmail: user.email,
      entity: "package",
      entityId: validated.slug,
      action: beforeData ? "update" : "create",
      before: beforeData,
      after: packageData,
    });
  } catch (error) {
    console.warn("Error guardando en Firestore paquetes, sincronizando localmente.", error);
  }

  const local = getLocalFallbackData();
  const existingIdx = local.packages.findIndex((p) => p.slug === validated.slug);
  let updatedPackages: Package[];
  if (existingIdx >= 0) {
    updatedPackages = [...local.packages];
    updatedPackages[existingIdx] = packageData;
  } else {
    updatedPackages = [...local.packages, packageData];
  }
  saveLocalFallbackData({ packages: updatedPackages });

  return packageData;
}

export async function togglePackageStatus(
  slug: string,
  activo: boolean,
  user: { uid: string; email: string }
): Promise<boolean> {
  let beforeData: any = null;
  try {
    const ref = adminDb.collection("packages").doc(slug);
    const snap = await ref.get();
    if (snap.exists) {
      beforeData = snap.data();
      await ref.update({ activo, updatedAt: new Date().toISOString() });
    }

    await recordAuditLog({
      userId: user.uid,
      userEmail: user.email,
      entity: "package",
      entityId: slug,
      action: "toggle_status",
      before: { activo: beforeData?.activo },
      after: { activo },
    });
  } catch (e) {}

  const local = getLocalFallbackData();
  const updated = local.packages.map((p) => (p.slug === slug ? { ...p, activo } : p));
  saveLocalFallbackData({ packages: updated });

  return true;
}
