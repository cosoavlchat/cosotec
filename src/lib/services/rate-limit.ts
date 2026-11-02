import { adminDb, isFirestoreReady } from "@/lib/firebase/admin";

interface RateLimitResult {
  allowed: boolean;
  remaining?: number;
  resetAt?: number;
}

// Fallback en memoria únicamente para desarrollo local offline cuando el emulador o la nube no estén encendidos
const fallbackMemoryMap = new Map<string, { count: number; resetAt: number }>();

/**
 * Validador de rate limit distribuido en Firestore para soportar múltiples instancias de App Hosting / Cloud Run.
 * Usa la colección 'rateLimits' con fecha de expiración TTL.
 */
export async function checkRateLimit(
  ip: string,
  action: string = "contacto",
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutos por defecto
): Promise<RateLimitResult> {
  const sanitizedIp = ip.replace(/[^a-zA-Z0-9:._-]/g, "_");
  const docId = `${action}_${sanitizedIp}`;
  const now = Date.now();

  const firestoreOnline = await isFirestoreReady();

  if (!firestoreOnline) {
    // Modo desarrollo local offline sin Firestore activo
    const entry = fallbackMemoryMap.get(docId);
    if (!entry || now > entry.resetAt) {
      fallbackMemoryMap.set(docId, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: maxAttempts - 1 };
    }
    if (entry.count >= maxAttempts) {
      return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }
    entry.count += 1;
    return { allowed: true, remaining: maxAttempts - entry.count };
  }

  try {
    const docRef = adminDb.collection("rateLimits").doc(docId);
    const snap = await docRef.get();

    if (!snap.exists) {
      const resetAt = now + windowMs;
      await docRef.set({
        ip,
        action,
        count: 1,
        resetAt,
        expiresAt: new Date(resetAt).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return { allowed: true, remaining: maxAttempts - 1, resetAt };
    }

    const data = snap.data();
    const currentResetAt = Number(data?.resetAt || 0);
    const currentCount = Number(data?.count || 0);

    if (now > currentResetAt) {
      // Ventana de tiempo expirada, reiniciar contador
      const nextResetAt = now + windowMs;
      await docRef.set({
        ip,
        action,
        count: 1,
        resetAt: nextResetAt,
        expiresAt: new Date(nextResetAt).toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return { allowed: true, remaining: maxAttempts - 1, resetAt: nextResetAt };
    }

    if (currentCount >= maxAttempts) {
      return { allowed: false, remaining: 0, resetAt: currentResetAt };
    }

    await docRef.update({
      count: currentCount + 1,
      updatedAt: new Date().toISOString(),
    });

    return { allowed: true, remaining: maxAttempts - (currentCount + 1), resetAt: currentResetAt };
  } catch (error) {
    console.error(`[RateLimit] Error consultando Firestore para ${docId}:`, error);
    // En caso de fallo transitorio en base de datos, permitir la petición para no bloquear al usuario legítimo
    return { allowed: true, remaining: 1 };
  }
}

