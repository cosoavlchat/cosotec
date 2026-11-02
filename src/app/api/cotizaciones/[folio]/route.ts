import { NextRequest, NextResponse } from "next/server";
import { obtenerCotizacionPorFolio, validarTokenCotizacion } from "@/lib/quotes";
import { registrarAperturaCotizacion } from "@/lib/services/quotes-service";

interface RouteProps {
  params: Promise<{ folio: string }>;
}

export async function GET(req: NextRequest, { params }: RouteProps) {
  try {
    const { folio } = await params;
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("t");

    if (!token) {
      return NextResponse.json(
        { error: "Se requiere token de autorización para consultar la cotización." },
        { status: 401 }
      );
    }

    const quote = await obtenerCotizacionPorFolio(folio);
    if (!quote) {
      return NextResponse.json(
        { error: "Cotización no encontrada" },
        { status: 404 }
      );
    }

    const esValido = validarTokenCotizacion(quote.tokenHash, token);
    if (!esValido) {
      return NextResponse.json(
        { error: "Token de acceso no válido." },
        { status: 403 }
      );
    }

    // Registrar vista del cliente (PRIVACIDAD: SIN IP NI USER AGENT)
    await registrarAperturaCotizacion(folio).catch((err) =>
      console.error("[Cotización] Error al registrar apertura:", err)
    );

    return NextResponse.json({
      success: true,
      quote,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al consultar la cotización" },
      { status: 500 }
    );
  }
}

