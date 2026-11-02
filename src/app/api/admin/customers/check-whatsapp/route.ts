import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/server-auth";
import { checkCustomerWhatsapp } from "@/lib/services/customer-service";

export async function POST(req: NextRequest) {
  const auth = await authenticateServerRequest(req, ["admin", "vendedor"]);
  if (!auth.success) return auth.response;

  try {
    const { whatsapp } = await req.json();
    if (!whatsapp) {
      return NextResponse.json({ error: "El número de WhatsApp es requerido" }, { status: 400 });
    }

    const result = await checkCustomerWhatsapp(whatsapp, auth.user);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al verificar WhatsApp" }, { status: 500 });
  }
}
