import { NextRequest, NextResponse } from "next/server";
import { getCartFromFirestore } from "@/lib/cart";
import { verifyCartSession, CART_SESSION_COOKIE_NAME } from "@/lib/cart/session";
import { authenticateServerRequest } from "@/lib/auth/server-auth";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Falta el ID del carrito" }, { status: 400 });
    }

    // 1. Verificar si la sesión de la cookie coincide con el cartId
    const rawCookie = req.cookies.get(CART_SESSION_COOKIE_NAME)?.value;
    const sessionCartId = verifyCartSession(rawCookie);

    let isAuthorized = sessionCartId === id;

    // 2. Si no coincide con la cookie de cliente, permitir si es personal del panel (admin o vendedor)
    if (!isAuthorized) {
      const auth = await authenticateServerRequest(req, ["admin", "vendedor"]);
      if (auth.success) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "No tienes autorización para consultar este carrito." },
        { status: 403 }
      );
    }

    const cart = await getCartFromFirestore(id);
    if (!cart) {
      return NextResponse.json({ error: "Carrito no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, cart });
  } catch (error: any) {
    console.error("[API Cart Get] Error al consultar carrito:", error);
    return NextResponse.json(
      { error: "Error interno del servidor", message: error.message },
      { status: 500 }
    );
  }
}
