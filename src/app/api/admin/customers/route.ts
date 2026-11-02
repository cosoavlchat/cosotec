import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/server-auth";
import {
  getCustomers,
  searchCustomers,
  createCustomer,
} from "@/lib/services/customer-service";

export async function GET(req: NextRequest) {
  const auth = await authenticateServerRequest(req, ["admin", "vendedor"]);
  if (!auth.success) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const vendedorFiltro = searchParams.get("vendedorId");

    let customers;
    if (query) {
      customers = await searchCustomers(query, auth.user);
    } else {
      customers = await getCustomers(auth.user, vendedorFiltro || undefined);
    }

    return NextResponse.json({ success: true, customers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al obtener clientes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await authenticateServerRequest(req, ["admin", "vendedor"]);
  if (!auth.success) return auth.response;

  try {
    const body = await req.json();
    const customer = await createCustomer(body, auth.user);
    return NextResponse.json({ success: true, customer }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al crear cliente" },
      { status: error.message?.includes("asignado a otro") ? 409 : 400 }
    );
  }
}

