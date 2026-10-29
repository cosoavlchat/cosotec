import { adminDb, recordAuditLog } from "@/lib/firebase/admin";
import { Product, Package } from "@/types/catalog";
import { ProductSchema, PackageSchema } from "@/lib/validations/catalog";

export async function getProducts(includeInactive: boolean = true): Promise<Product[]> {
  let query = adminDb.collection("products") as any;
  if (!includeInactive) {
    query = query.where("activo", "==", true);
  }
  const snap = await query.orderBy("orden", "asc").get();
  return snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Product));
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const doc = await adminDb.collection("products").doc(slug).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Product;
}

export async function saveProduct(
  rawData: unknown,
  user: { uid: string; email: string }
): Promise<Product> {
  const validated = ProductSchema.parse(rawData);
  const now = new Date().toISOString();

  let beforeData: any = null;
  const docSnap = await adminDb.collection("products").doc(validated.slug).get();
  if (docSnap.exists) {
    beforeData = docSnap.data();
  }

  const productData: Product = {
    id: validated.slug,
    ...validated,
    updatedAt: now,
    createdAt: beforeData?.createdAt || now,
  };

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

  return productData;
}

export async function toggleProductStatus(
  slug: string,
  activo: boolean,
  user: { uid: string; email: string }
): Promise<boolean> {
  const ref = adminDb.collection("products").doc(slug);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new Error(`Producto con slug '${slug}' no encontrado`);
  }

  const beforeData = snap.data();
  await ref.update({ activo, updatedAt: new Date().toISOString() });

  await recordAuditLog({
    userId: user.uid,
    userEmail: user.email,
    entity: "product",
    entityId: slug,
    action: "toggle_status",
    before: { activo: beforeData?.activo },
    after: { activo },
  });

  return true;
}

export async function getPackages(includeInactive: boolean = true): Promise<Package[]> {
  let query = adminDb.collection("packages") as any;
  if (!includeInactive) {
    query = query.where("activo", "==", true);
  }
  const snap = await query.get();
  return snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Package));
}

export async function savePackage(
  rawData: unknown,
  user: { uid: string; email: string }
): Promise<Package> {
  const validated = PackageSchema.parse(rawData);
  const now = new Date().toISOString();

  let beforeData: any = null;
  const docSnap = await adminDb.collection("packages").doc(validated.slug).get();
  if (docSnap.exists) {
    beforeData = docSnap.data();
  }

  const packageData: Package = {
    id: validated.slug,
    ...validated,
    updatedAt: now,
    createdAt: beforeData?.createdAt || now,
  };

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

  return packageData;
}

export async function togglePackageStatus(
  slug: string,
  activo: boolean,
  user: { uid: string; email: string }
): Promise<boolean> {
  const ref = adminDb.collection("packages").doc(slug);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new Error(`Paquete con slug '${slug}' no encontrado`);
  }

  const beforeData = snap.data();
  await ref.update({ activo, updatedAt: new Date().toISOString() });

  await recordAuditLog({
    userId: user.uid,
    userEmail: user.email,
    entity: "package",
    entityId: slug,
    action: "toggle_status",
    before: { activo: beforeData?.activo },
    after: { activo },
  });

  return true;
}
