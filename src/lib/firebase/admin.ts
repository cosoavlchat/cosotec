import { initializeApp, getApps, getApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import { AuditLogEntry } from "@/types/audit";

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "cosoteco";

// Configuración de emuladores para desarrollo local o cuando no haya credenciales de Google Cloud
const hasGcpCredentials = Boolean(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  process.env.K_SERVICE
);

if (!hasGcpCredentials || process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true" || process.env.USE_FIREBASE_EMULATOR === "true") {
  process.env.METADATA_SERVER_DETECTION = "none";
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

// Detector instantáneo de emulador local (evita bloqueos de red gRPC de 45s cuando no está levantado)
let emulatorChecked = false;
let emulatorOnline = false;
let lastCheckMs = 0;

export async function isFirestoreReady(): Promise<boolean> {
  if (hasGcpCredentials) return true; // En producción con credenciales siempre se conecta a Cloud Firestore
  const now = Date.now();
  if (emulatorChecked && now - lastCheckMs < 5000) {
    return emulatorOnline;
  }
  const net = await import("net");
  return new Promise((resolve) => {
    const socket = net.createConnection({ port: 8080, host: "127.0.0.1", timeout: 150 });
    socket.on("connect", () => {
      socket.destroy();
      emulatorChecked = true;
      emulatorOnline = true;
      lastCheckMs = Date.now();
      resolve(true);
    });
    const onFail = () => {
      socket.destroy();
      emulatorChecked = true;
      emulatorOnline = false;
      lastCheckMs = Date.now();
      resolve(false);
    };
    socket.on("error", onFail);
    socket.on("timeout", onFail);
  });
}

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

