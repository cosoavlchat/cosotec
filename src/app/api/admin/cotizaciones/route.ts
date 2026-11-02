import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/server-auth";
import { getQuotes, crearCotizacionVendedor } from "@/lib/services/quotes-service";

export async function GET(req: NextRequest) {
  const auth = await authenticateServerRequest(req, ["admin", "vendedor"]);
  if (!auth.success) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const estado = searchParams.get("estado") as any;
    const vendedorId = searchParams.get("vendedorId") || undefined;
    const clienteId = searchParams.get("clienteId") || undefined;

    const quotes = await getQuotes(auth.user, {
      estado,
      vendedorId,
      clienteId,
    });

    return NextResponse.json({ success: true, quotes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al obtener cotizaciones" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await authenticateServerRequest(req, ["admin", "vendedor"]);
  if (!auth.success) return auth.response;

  try {
    const body = await req.json();
    const quote = await crearCotizacionVendedor(body, auth.user);
    return NextResponse.json({ success: true, quote }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al crear cotización" }, { status: 400 });
  }
}
