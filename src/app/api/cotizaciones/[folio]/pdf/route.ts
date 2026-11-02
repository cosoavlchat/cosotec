import { NextRequest, NextResponse } from "next/server";
import { obtenerCotizacionPorFolio, validarTokenCotizacion } from "@/lib/quotes";
import { generarCotizacionPdfBuffer } from "@/lib/pdf/quote-pdf";

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
        { error: "Se requiere token de autorización para descargar el PDF." },
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

    if (quote.estado === "pendiente_autorizacion") {
      return NextResponse.json(
        { error: "Cotización bloqueada: pendiente de autorización" },
        { status: 403 }
      );
    }

    const origin = req.nextUrl.origin || "http://localhost:3000";
    const pdfBuffer = await generarCotizacionPdfBuffer(quote, origin);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Cotizacion-${quote.folio}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("[API PDF Public] Error:", error);
    return NextResponse.json(
      { error: error.message || "Error al generar el PDF de la cotización" },
      { status: 500 }
    );
  }
}
