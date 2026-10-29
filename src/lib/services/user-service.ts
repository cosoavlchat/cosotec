import { adminAuth, adminDb, recordAuditLog } from "@/lib/firebase/admin";
import { AppUser } from "@/types/user";
import { CreateUserSchema, UpdateRoleSchema } from "@/lib/validations/user";
import { getLocalFallbackData, saveLocalFallbackData } from "./data-store";

export async function getUsers(): Promise<AppUser[]> {
  try {
    const snap = await adminDb.collection("users").orderBy("createdAt", "desc").get();
    if (!snap.empty) {
      return snap.docs.map((doc: any) => ({ uid: doc.id, ...doc.data() } as AppUser));
    }
  } catch (e) {}

  return getLocalFallbackData().users;
}

export async function createUser(
  rawData: unknown,
  actor: { uid: string; email: string }
): Promise<AppUser> {
  const validated = CreateUserSchema.parse(rawData);
  const now = new Date().toISOString();

  let uid = `user_${Date.now()}`;
  try {
    const userRecord = await adminAuth.createUser({
      email: validated.email,
      password: validated.password,
      displayName: validated.nombre,
      emailVerified: true,
    });
    uid = userRecord.uid;

    await adminAuth.setCustomUserClaims(uid, { role: validated.role });
  } catch (e) {
    console.warn("No se pudo crear en Firebase Auth, usando mock local para usuario.", e);
  }

  const appUser: AppUser = {
    uid,
    email: validated.email,
    nombre: validated.nombre,
    role: validated.role,
    activo: true,
    topeDescuento: validated.topeDescuento || (validated.role === "vendedor" ? 5 : 0),
    createdAt: now,
  };

  try {
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
  } catch (e) {}

  const local = getLocalFallbackData();
  const updatedUsers = [appUser, ...local.users.filter((u) => u.email !== appUser.email)];
  saveLocalFallbackData({ users: updatedUsers });

  return appUser;
}

export async function updateUserRole(
  rawData: unknown,
  actor: { uid: string; email: string }
): Promise<AppUser> {
  const validated = UpdateRoleSchema.parse(rawData);

  let beforeData: any = null;
  try {
    const snap = await adminDb.collection("users").doc(validated.uid).get();
    if (snap.exists) {
      beforeData = snap.data();
    }

    await adminAuth.setCustomUserClaims(validated.uid, { role: validated.role });

    const updates: Partial<AppUser> = {
      role: validated.role,
      ...(validated.activo !== undefined ? { activo: validated.activo } : {}),
      ...(validated.topeDescuento !== undefined ? { topeDescuento: validated.topeDescuento } : {}),
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
  } catch (e) {}

  const local = getLocalFallbackData();
  const userIdx = local.users.findIndex((u) => u.uid === validated.uid);
  if (userIdx >= 0) {
    local.users[userIdx] = {
      ...local.users[userIdx],
      role: validated.role,
      ...(validated.activo !== undefined ? { activo: validated.activo } : {}),
      ...(validated.topeDescuento !== undefined ? { topeDescuento: validated.topeDescuento } : {}),
    };
    saveLocalFallbackData({ users: local.users });
    return local.users[userIdx];
  }

  return {
    uid: validated.uid,
    email: beforeData?.email || "unknown@cosotec.local",
    role: validated.role,
    activo: validated.activo ?? true,
    topeDescuento: validated.topeDescuento ?? 5,
  };
}
