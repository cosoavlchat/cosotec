import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/server-auth";
import {
  getPricingSettings,
  updatePricingSettings,
  getTravelFees,
  updateTravelFee,
} from "@/lib/services/pricing-service";

export async function GET() {
  try {
    const [pricing, travelFees] = await Promise.all([getPricingSettings(), getTravelFees()]);
    return NextResponse.json({ pricing, travelFees });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // REGLA 1: Solo 'admin' puede modificar precios, IVA, descuentos o viáticos
  const auth = await authenticateServerRequest(req, ["admin"]);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const { target, data, id } = body;

    if (target === "travelFee") {
      if (!id) {
        return NextResponse.json({ error: "id de estado requerido" }, { status: 400 });
      }
      const updated = await updateTravelFee(id, data, auth.user);
      return NextResponse.json({ success: true, travelFee: updated });
    }

    const updated = await updatePricingSettings(data, auth.user);
    return NextResponse.json({ success: true, pricing: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al actualizar precios", details: error.errors },
      { status: 400 }
    );
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}
