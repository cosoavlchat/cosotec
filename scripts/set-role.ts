/**
 * CosoTec - Asignación de Roles con Firebase Auth Custom Claims
 * Uso:
 *   npx tsx scripts/set-role.ts <correo> <admin|vendedor|soporte>
 * Ejemplo:
 *   npx tsx scripts/set-role.ts admin@cosoavl.com admin
 */

import * as crypto from "crypto";
import { UserRole } from "@/types/user";

const email = process.argv[2];
const role = process.argv[3] as UserRole;

const validRoles: UserRole[] = ["admin", "vendedor", "soporte"];

function generateSecurePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
  const bytes = crypto.randomBytes(16);
  let pass = "";
  for (let i = 0; i < 14; i++) {
    pass += chars[bytes[i] % chars.length];
  }
  return pass + "!A1";
}

async function setRole() {
  if (!email || !role) {
    console.log("\n❌ Uso incorrecto:");
    console.log("   npx tsx scripts/set-role.ts <correo> <rol: admin|vendedor|soporte>");
    console.log("   Ejemplo: npx tsx scripts/set-role.ts admin@cosoavl.com admin\n");
    process.exit(1);
  }

  if (!validRoles.includes(role)) {
    console.error(`❌ Rol inválido '${role}'. Los roles permitidos son: ${validRoles.join(", ")}`);
    process.exit(1);
  }

  const isProd = process.argv.includes("--prod") || process.env.USE_FIREBASE_PROD === "true";

  // Parse optional CLI arguments
  const getArg = (name: string): string | undefined => {
    const idx = process.argv.indexOf(name);
    return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : undefined;
  };

  const customPassword = getArg("--password") || getArg("--pass");
  const customWhatsapp = getArg("--whatsapp") || getArg("--tel");
  const customNombre = getArg("--nombre") || getArg("--name");
  const customTope = getArg("--tope");

  if (!isProd) {
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR = "true";
    process.env.USE_FIREBASE_EMULATOR = "true";
    process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
    process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
  }

  try {
    const { adminAuth, adminDb, recordAuditLog } = await import("@/lib/firebase/admin");

    let userRecord;
    let tempPassword = customPassword || "";

    try {
      userRecord = await adminAuth.getUserByEmail(email);
      console.log(`👤 Usuario existente encontrado: ${userRecord.uid} (${userRecord.email})`);
      if (customPassword) {
        await adminAuth.updateUser(userRecord.uid, { password: customPassword });
        console.log(`🔑 Contraseña actualizada exitosamente para ${email}.`);
      }
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        if (!tempPassword) {
          tempPassword = generateSecurePassword();
        }
        console.log(`🆕 Creando nuevo usuario en Firebase Auth (${isProd ? "PRODUCCIÓN cosotec7" : "EMULADOR"})...`);
        userRecord = await adminAuth.createUser({
          email,
          password: tempPassword,
          displayName: customNombre || email.split("@")[0],
          emailVerified: true,
        });
        console.log("\n╔══════════════════════════════════════════════════════════════════╗");
        console.log("║ 🔑 CONTRASEÑA ASIGNADA:                                          ║");
        console.log(`║    ${tempPassword.padEnd(58)}║`);
        console.log("╚══════════════════════════════════════════════════════════════════╝\n");
      } else {
        throw err;
      }
    }

    // Asignar Custom Claim
    await adminAuth.setCustomUserClaims(userRecord.uid, { role });
    console.log(`🔑 Custom claim asignado: { role: "${role}" }`);

    // Sincronizar documento en Firestore
    const userDocRef = adminDb.collection("users").doc(userRecord.uid);
    const existingSnap = await userDocRef.get();
    const beforeData = existingSnap.exists ? existingSnap.data() : null;
    const now = new Date().toISOString();

    const userData: any = {
      uid: userRecord.uid,
      email: userRecord.email,
      nombre: customNombre || userRecord.displayName || email.split("@")[0],
      role,
      activo: true,
      topeDescuento: customTope ? Number(customTope) : (role === "vendedor" ? 5 : 0),
      updatedAt: now,
      ...(beforeData ? {} : { createdAt: now }),
    };

    if (customWhatsapp || !beforeData?.whatsapp) {
      userData.whatsapp = (customWhatsapp || beforeData?.whatsapp || "7224322053").replace(/\D/g, "").slice(-10);
    }

    await userDocRef.set(userData, { merge: true });
    console.log(`📄 Documento sincronizado en colección 'users/${userRecord.uid}' (whatsapp: ${userData.whatsapp || "N/A"})`);

    // Registrar en AuditLog
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

    console.log(`\n🎉 ¡Listo! El usuario ${email} ahora tiene el rol '${role}' en CosoTec.`);
  } catch (error: any) {
    console.error("❌ Error conectando a Firebase Auth/Firestore:", error.message || error);
    if (!isProd) {
      console.error("\n💡 Recuerda arrancar los emuladores con:");
      console.error("   npx firebase emulators:start --only firestore,auth,storage\n");
    }
    process.exit(1);
  }
}

setRole();
