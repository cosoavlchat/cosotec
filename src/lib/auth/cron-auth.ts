import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * Verifica la autenticación de solicitudes dirigidas a endpoints programados (/api/cron/*).
 * Acepta:
 *   1. Encabezado 'Authorization: Bearer <CRON_SECRET>'
 *   2. Encabezado 'x-cron-secret: <CRON_SECRET>'
 * Si falta el secreto o no coincide, responde 401 Unauthorized.
 */
export function verifyCronAuth(req: NextRequest): { authorized: boolean; response?: NextResponse } {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || cronSecret.trim() === "") {
    console.warn("[CRON AUTH] Alerta: CRON_SECRET no está configurado en el entorno.");
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "No autorizado: CRON_SECRET no está configurado en el entorno" },
        { status: 401 }
      ),
    };
  }

  const authHeader = req.headers.get("authorization") || "";
  const customHeader = req.headers.get("x-cron-secret") || "";

  let incomingSecret = "";
  if (authHeader.startsWith("Bearer ")) {
    incomingSecret = authHeader.substring(7).trim();
  } else if (customHeader) {
    incomingSecret = customHeader.trim();
  }

  if (!incomingSecret) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "No autorizado: Credenciales de ejecución programada ausentes" },
        { status: 401 }
      ),
    };
  }

  // Comparación en tiempo constante
  const secretBuffer = Buffer.from(cronSecret);
  const incomingBuffer = Buffer.from(incomingSecret);

  if (
    secretBuffer.length !== incomingBuffer.length ||
    !crypto.timingSafeEqual(secretBuffer, incomingBuffer)
  ) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "No autorizado: Token o secreto de cron inválido" },
        { status: 401 }
      ),
    };
  }

  return { authorized: true };
}
