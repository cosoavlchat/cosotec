import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/server-auth";
import { autorizarDescuentoCotizacion } from "@/lib/services/quotes-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ folio: string }> }
) {
  const auth = await authenticateServerRequest(req, ["admin"]);
  if (!auth.success) return auth.response;

  try {
    const { folio } = await params;
    const { accion, motivo } = await req.json();

    if (accion !== "aprobar" && accion !== "rechazar") {
      return NextResponse.json({ error: "Acción inválida. Debe ser 'aprobar' o 'rechazar'." }, { status: 400 });
    }

    const updated = await autorizarDescuentoCotizacion(folio, accion, auth.user, motivo);
    return NextResponse.json({ success: true, quote: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al procesar autorización" }, { status: 400 });
  }
}

