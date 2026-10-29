import { NextRequest, NextResponse } from "next/server";
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
  try {
    const body = await req.json();
    const { target, data, id, user = { uid: "admin-session", email: "admin@cosoavl.com" } } = body;

    if (target === "travelFee") {
      if (!id) {
        return NextResponse.json({ error: "id de estado requerido" }, { status: 400 });
      }
      const updated = await updateTravelFee(id, data, user);
      return NextResponse.json({ success: true, travelFee: updated });
    }

    // Por defecto target === "pricing"
    const updated = await updatePricingSettings(data, user);
    return NextResponse.json({ success: true, pricing: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al actualizar precios", details: error.errors },
      { status: 400 }
    );
  }
}
