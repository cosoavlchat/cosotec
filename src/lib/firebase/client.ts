import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key-cosoteco",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "cosoteco.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "cosoteco",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "cosoteco.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1234567890:web:abcdef123456",
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Conexión automática al emulador local en desarrollo si está habilitado
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true") {
  const emulatorHost = window.location.hostname || "localhost";
  try {
    connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(db, emulatorHost, 8080);
    connectStorageEmulator(storage, emulatorHost, 9199);
    console.info("🔥 [Firebase Client] Conectado a Firebase Emulator Suite");
  } catch {
    // Si ya fueron conectados previamente en HMR, ignorar advertencia
  }
}
