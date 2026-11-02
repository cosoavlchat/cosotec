import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/server-auth";
import { reasignarCliente } from "@/lib/services/customer-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateServerRequest(req, ["admin"]);
  if (!auth.success) return auth.response;

  try {
    const { id } = await params;
    const { nuevoVendedor } = await req.json();

    if (!nuevoVendedor?.uid || !nuevoVendedor?.email) {
      return NextResponse.json({ error: "Datos del nuevo vendedor incompletos." }, { status: 400 });
    }

    const updated = await reasignarCliente(id, nuevoVendedor, auth.user);
    return NextResponse.json({ success: true, customer: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al reasignar cliente" }, { status: 400 });
  }
}
