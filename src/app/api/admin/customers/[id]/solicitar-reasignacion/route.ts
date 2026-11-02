import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/server-auth";
import { solicitarReasignacionCliente } from "@/lib/services/customer-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateServerRequest(req, ["admin", "vendedor"]);
  if (!auth.success) return auth.response;

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const result = await solicitarReasignacionCliente(id, auth.user, body.motivo);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al solicitar reasignación" }, { status: 400 });
  }
}

