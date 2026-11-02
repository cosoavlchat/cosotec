import { NextRequest, NextResponse } from "next/server";
import { regenerarTokenCotizacion } from "@/lib/quotes";
import { adminAuth } from "@/lib/firebase/admin";

interface RouteParams {
  params: Promise<{ folio: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { folio } = await params;

    // Verificar sesión vía Bearer token de Firebase Auth o Cookie de sesión
    const authHeader = req.headers.get("authorization");
    const idToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

    if (!idToken) {
      return NextResponse.json(
        { error: "Autenticación requerida para regenerar el enlace." },
        { status: 401 }
      );
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    const role = (decoded.role as string) || "cliente";
    const uid = decoded.uid;

    if (role !== "admin" && role !== "vendedor") {
      return NextResponse.json(
        { error: "No tienes permisos para regenerar el enlace de esta cotización." },
        { status: 403 }
      );
    }

    const resultado = await regenerarTokenCotizacion(folio, { role, uid });

    return NextResponse.json({
      success: true,
      mensaje: "Enlace regenerado con éxito. El enlace anterior ha sido revocado.",
      ...resultado,
    });
  } catch (error: any) {
    console.error("Error al regenerar link de cotización:", error);
    return NextResponse.json(
      { error: error.message || "Error interno al regenerar link" },
      { status: 500 }
    );
  }
}

