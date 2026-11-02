import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/auth/cron-auth";
import { verificarCobrosProgramadosVencidos } from "@/lib/services/order-service";

export async function GET(req: NextRequest) {
  // Validación estricta de autorización (CRON_SECRET)
  const authCheck = verifyCronAuth(req);
  if (!authCheck.authorized) {
    return authCheck.response!;
  }

  try {
    const origin = req.nextUrl.origin || "http://localhost:3000";
    const resultado = await verificarCobrosProgramadosVencidos(origin);

    return NextResponse.json({
      success: true,
      mensaje: `Procesamiento de cobros programados completado: ${resultado.total} cuotas vencidas notificadas.`,
      resultado,
    });
  } catch (error: any) {
    console.error("[CRON Cobros Programados] Error:", error);
    return NextResponse.json(
      { error: "Error interno al procesar cobros programados", message: error.message },
      { status: 500 }
    );
  }
}
