import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/server-auth";
import { adminDb } from "@/lib/firebase/admin";
import { Order } from "@/types/order";

export async function GET(req: NextRequest) {
  const auth = await authenticateServerRequest(req, ["admin", "soporte"]);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const estado = searchParams.get("estado");
    const metodoPago = searchParams.get("metodoPago");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

    let query: FirebaseFirestore.Query = adminDb.collection("orders");

    if (estado) {
      query = query.where("estado", "==", estado);
    }

    if (metodoPago) {
      query = query.where("metodoPago", "==", metodoPago);
    }

    const snapshot = await query.limit(limit).get();
    const orders: Order[] = [];

    snapshot.forEach((doc) => {
      orders.push(doc.data() as Order);
    });

    // Ordenar en memoria por createdAt descendente
    orders.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({
      success: true,
      total: orders.length,
      orders,
    });
  } catch (err: any) {
    console.error("[API Admin Pedidos] Error:", err);
    return NextResponse.json(
      { error: "Error al consultar pedidos", message: err.message },
      { status: 500 }
    );
  }
}

