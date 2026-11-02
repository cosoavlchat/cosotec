import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/server-auth";
import { getQuoteByFolio, crearNuevaVersionCotizacion } from "@/lib/services/quotes-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ folio: string }> }
) {
  const auth = await authenticateServerRequest(req, ["admin", "vendedor"]);
  if (!auth.success) return auth.response;

  try {
    const { folio } = await params;
    const quote = await getQuoteByFolio(folio, auth.user);
    if (!quote) {
      return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ success: true, quote });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al obtener cotización" }, { status: 403 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ folio: string }> }
) {
  const auth = await authenticateServerRequest(req, ["admin", "vendedor"]);
  if (!auth.success) return auth.response;

  try {
    const { folio } = await params;
    const body = await req.json();
    const versionQuote = await crearNuevaVersionCotizacion(folio, body, auth.user);
    return NextResponse.json({ success: true, quote: versionQuote });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al actualizar cotización" }, { status: 400 });
  }
}

