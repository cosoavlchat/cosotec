import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/auth/cron-auth";
import { verificarCarritosAbandonados } from "@/lib/services/abandoned-cart-service";

export async function GET(req: NextRequest) {
  // Validación estricta de autorización (CRON_SECRET)
  const authCheck = verifyCronAuth(req);
  if (!authCheck.authorized) {
    return authCheck.response!;
  }

  try {
    const resultado = await verificarCarritosAbandonados(31);

    return NextResponse.json({
      success: true,
      mensaje: `Procesamiento completado: ${resultado.procesados} carritos abandonados, ${resultado.leadsCreados} leads creados.`,
      resultado,
    });
  } catch (error: any) {
    console.error("[CRON Carritos Abandonados] Error:", error);
    return NextResponse.json(
      { error: "Error interno al verificar carritos abandonados", message: error.message },
      { status: 500 }
    );
  }
}
