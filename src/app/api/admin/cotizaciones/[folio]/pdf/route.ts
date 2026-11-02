import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/server-auth";
import { getQuoteByFolio } from "@/lib/services/quotes-service";
import { generarCotizacionPdfBuffer } from "@/lib/pdf/quote-pdf";

interface RouteProps {
  params: Promise<{ folio: string }>;
}

export async function GET(req: NextRequest, { params }: RouteProps) {
  const auth = await authenticateServerRequest(req, ["admin", "vendedor"]);
  if (!auth.success) return auth.response;

  try {
    const { folio } = await params;
    const quote = await getQuoteByFolio(folio, auth.user);
    if (!quote) {
      return NextResponse.json(
        { error: "Cotización no encontrada" },
        { status: 404 }
      );
    }

    // Regla: Mientras esté en pendiente_autorizacion, el PDF está bloqueado
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
    console.error("[API PDF Admin] Error:", error);
    return NextResponse.json(
      { error: error.message || "Error al generar el PDF de la cotización" },
      { status: 500 }
    );
  }
}
