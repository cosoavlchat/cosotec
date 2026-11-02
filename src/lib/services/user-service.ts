import { adminAuth, adminDb, recordAuditLog } from "@/lib/firebase/admin";
import { AppUser } from "@/types/user";
import { CreateUserSchema, UpdateRoleSchema } from "@/lib/validations/user";

export async function getUsers(): Promise<AppUser[]> {
  const snap = await adminDb.collection("users").orderBy("createdAt", "desc").get();
  return snap.docs.map((doc: any) => ({ uid: doc.id, ...doc.data() } as AppUser));
}

export async function createUser(
  rawData: unknown,
  actor: { uid: string; email: string }
): Promise<AppUser> {
  const validated = CreateUserSchema.parse(rawData);
  const now = new Date().toISOString();

  const userRecord = await adminAuth.createUser({
    email: validated.email,
    password: validated.password,
    displayName: validated.nombre,
    emailVerified: true,
  });

  const uid = userRecord.uid;
  await adminAuth.setCustomUserClaims(uid, { role: validated.role });

  const appUser: AppUser = {
    uid,
    email: validated.email,
    nombre: validated.nombre,
    whatsapp: validated.whatsapp ? validated.whatsapp.replace(/\D/g, "").slice(-10) : undefined,
    role: validated.role,
    activo: true,
    topeDescuento: validated.topeDescuento || (validated.role === "vendedor" ? 5 : 0),
    createdAt: now,
  };

  await adminDb.collection("users").doc(uid).set(appUser, { merge: true });

  await recordAuditLog({
    userId: actor.uid,
    userEmail: actor.email,
    entity: "user",
    entityId: uid,
    action: "create",
    before: null,
    after: appUser,
    metadata: { role: validated.role },
  });

  return appUser;
}

export async function updateUserRole(
  rawData: unknown,
  actor: { uid: string; email: string }
): Promise<AppUser> {
  const validated = UpdateRoleSchema.parse(rawData);

  let beforeData: any = null;
  const snap = await adminDb.collection("users").doc(validated.uid).get();
  if (snap.exists) {
    beforeData = snap.data();
  }

  await adminAuth.setCustomUserClaims(validated.uid, { role: validated.role });

  const updates: Partial<AppUser> = {
    role: validated.role,
    ...(validated.activo !== undefined ? { activo: validated.activo } : {}),
    ...(validated.topeDescuento !== undefined ? { topeDescuento: validated.topeDescuento } : {}),
    ...(validated.whatsapp !== undefined ? { whatsapp: validated.whatsapp.replace(/\D/g, "").slice(-10) } : {}),
  };

  await adminDb.collection("users").doc(validated.uid).update(updates);

  await recordAuditLog({
    userId: actor.uid,
    userEmail: actor.email,
    entity: "user",
    entityId: validated.uid,
    action: "update",
    before: beforeData,
    after: updates,
  });

  return {
    uid: validated.uid,
    email: beforeData?.email || "unknown@cosotec.local",
    role: validated.role,
    activo: validated.activo ?? true,
    topeDescuento: validated.topeDescuento ?? 5,
  };
}
