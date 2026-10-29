/**
 * CosoTec - Asignación de Roles con Firebase Auth Custom Claims
 * Uso:
 *   npx tsx scripts/set-role.ts <correo> <admin|vendedor|soporte> [password]
 * Ejemplo:
 *   npx tsx scripts/set-role.ts admin@cosoavl.com admin CosoTec2026!
 */

import * as net from "net";
import { UserRole } from "@/types/user";
import { getLocalFallbackData, saveLocalFallbackData } from "@/lib/services/data-store";

const email = process.argv[2];
const role = process.argv[3] as UserRole;
const initialPassword = process.argv[4] || "CosoTec2026!";

const validRoles: UserRole[] = ["admin", "vendedor", "soporte"];

function checkSocket(host: string, port: number, timeoutMs = 1200): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("error", () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function setRole() {
  if (!email || !role) {
    console.log("\n❌ Uso incorrecto:");
    console.log("   npx tsx scripts/set-role.ts <correo> <rol: admin|vendedor|soporte> [password]");
    console.log("   Ejemplo: npx tsx scripts/set-role.ts admin@cosoavl.com admin AdminPass123!\n");
    process.exit(1);
  }

  if (!validRoles.includes(role)) {
    console.error(`❌ Rol inválido '${role}'. Los roles permitidos son: ${validRoles.join(", ")}`);
    process.exit(1);
  }

  const isProd = process.env.USE_FIREBASE_PROD === "true";

  // Siempre registrar en el store local para disponibilidad inmediata
  const local = getLocalFallbackData();
  const existingIdx = local.users.findIndex((u) => u.email === email);
  const now = new Date().toISOString();
  const userObj = {
    uid: existingIdx >= 0 ? local.users[existingIdx].uid : `user_${Date.now()}`,
    email,
    nombre: email.split("@")[0],
    role,
    activo: true,
    topeDescuento: role === "vendedor" ? 5 : 0,
    updatedAt: now,
    createdAt: existingIdx >= 0 ? local.users[existingIdx].createdAt : now,
  };

  if (existingIdx >= 0) {
    local.users[existingIdx] = userObj;
  } else {
    local.users.push(userObj);
  }
  saveLocalFallbackData({ users: local.users });
  console.log(`📁 Usuario '${email}' guardado con rol '${role}' en store local.`);

  if (!isProd) {
    const authRunning = await checkSocket("127.0.0.1", 9099);
    if (!authRunning) {
      console.log("\n⚠️ [Aviso de Conexión]: El emulador de Firebase Auth no está corriendo en 127.0.0.1:9099.");
      console.log(`   El rol '${role}' ha quedado asignado y activo en el panel local.`);
      console.log("   Para arrancar los emuladores: npx firebase emulators:start\n");
      return;
    }
  }

  try {
    const { adminAuth, adminDb, recordAuditLog } = await import("@/lib/firebase/admin");

    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(email);
      console.log(`👤 Usuario encontrado en Auth: ${userRecord.uid} (${userRecord.email})`);
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        console.log(`🆕 Creando usuario en Firebase Auth...`);
        userRecord = await adminAuth.createUser({
          email,
          password: initialPassword,
          displayName: email.split("@")[0],
          emailVerified: true,
        });
        console.log(`✅ Creado con contraseña inicial: ${initialPassword}`);
      } else {
        throw err;
      }
    }

    await adminAuth.setCustomUserClaims(userRecord.uid, { role });
    console.log(`🔑 Custom claim asignado: { role: "${role}" }`);

    const userDocRef = adminDb.collection("users").doc(userRecord.uid);
    const existingSnap = await userDocRef.get();
    const beforeData = existingSnap.exists ? existingSnap.data() : null;

    const userData = {
      uid: userRecord.uid,
      email: userRecord.email,
      nombre: userRecord.displayName || email.split("@")[0],
      role,
      activo: true,
      updatedAt: now,
      ...(beforeData ? {} : { createdAt: now }),
    };

    await userDocRef.set(userData, { merge: true });

    await recordAuditLog({
      userId: "cli-script",
      userEmail: "system@cosotec.local",
      entity: "user",
      entityId: userRecord.uid,
      action: "set_role",
      before: beforeData,
      after: userData,
      metadata: { role, script: "set-role.ts" },
    });

    console.log(`\n🎉 ¡Listo! El usuario ${email} tiene rol '${role}' en Firebase Auth y Firestore.`);
  } catch (error: any) {
    console.error("❌ Error conectando con Firebase Admin:", error);
  }
}

setRole();
