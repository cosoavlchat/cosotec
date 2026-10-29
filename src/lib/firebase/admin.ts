import { initializeApp, getApps, getApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import { AuditLogEntry } from "@/types/audit";

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "cosoteco";

// Configuración de emuladores para el servidor
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true" || process.env.USE_FIREBASE_EMULATOR === "true") {
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
  }
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
  }
  if (!process.env.FIREBASE_STORAGE_EMULATOR_HOST) {
    process.env.FIREBASE_STORAGE_EMULATOR_HOST = "127.0.0.1:9199";
  }
}

function getAdminApp() {
  if (getApps().length > 0) {
    return getApp();
  }

  // Si existe credencial de servicio provista por variable de entorno
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      return initializeApp({
        credential: cert(serviceAccount),
        projectId,
        storageBucket: `${projectId}.appspot.com`,
      });
    } catch (e) {
      console.warn("No se pudo parsear FIREBASE_SERVICE_ACCOUNT_KEY, usando inicialización por defecto.", e);
    }
  }

  return initializeApp({
    projectId,
    storageBucket: `${projectId}.appspot.com`,
  });
}

export const adminApp = getAdminApp();
export const adminDb = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);
export const adminStorage = getStorage(adminApp);

/**
 * Registra una entrada en la colección `auditLog`.
 * REGLA 4: Cada cambio de precio, regla, catálogo o usuario escribe en auditLog.
 */
export async function recordAuditLog(entry: Omit<AuditLogEntry, "timestamp">) {
  try {
    const logDoc = {
      ...entry,
      timestamp: new Date().toISOString(),
      createdAt: FieldValue.serverTimestamp(),
    };
    await adminDb.collection("auditLog").add(logDoc);
  } catch (error) {
    console.error("Error al guardar auditLog:", error);
    // No interrumpir la transacción principal si falla el log secundario, pero registrar el error.
  }
}

