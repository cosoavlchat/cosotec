import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/server-auth";
import { aprobarPagoSpei, rechazarComprobanteSpei } from "@/lib/services/order-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ folio: string }> }
) {
  // REGLA: Solo administradores pueden validar o rechazar transferencias bancarias
  const auth = await authenticateServerRequest(req, ["admin"]);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const { folio } = await params;
    if (!folio) {
      return NextResponse.json({ error: "Folio no especificado." }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { accion, motivoRechazo, notasAdmin } = body;

    if (!accion || (accion !== "aprobar" && accion !== "rechazar")) {
      return NextResponse.json(
        { error: "Acción inválida. Debe ser 'aprobar' o 'rechazar'." },
        { status: 400 }
      );
    }

    if (accion === "aprobar") {
      const resultado = await aprobarPagoSpei(folio, auth.user.email, notasAdmin);
      return NextResponse.json({
        success: true,
        message: "Pago SPEI aprobado y orden técnica generada exitosamente.",
        ...resultado,
      });
    }

    if (accion === "rechazar") {
      if (!motivoRechazo || typeof motivoRechazo !== "string" || motivoRechazo.trim().length === 0) {
        return NextResponse.json(
          { error: "Debes especificar un motivo para el rechazo del comprobante." },
          { status: 400 }
        );
      }

      const resultado = await rechazarComprobanteSpei(folio, motivoRechazo, auth.user.email);
      return NextResponse.json({
        success: true,
        message: "Comprobante rechazado correctamente.",
        ...resultado,
      });
    }

    return NextResponse.json({ error: "Acción no procesada" }, { status: 400 });
  } catch (error: any) {
    console.error("[API Validar SPEI] Error:", error);
    return NextResponse.json(
      { error: error.message || "Error al validar la orden SPEI" },
      { status: 500 }
    );
  }
}
