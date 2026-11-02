import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { crearCotizacionServidor } from "@/lib/quotes";

const quoteItemSchema = z.object({
  id: z.string().min(1, "El ID del producto es requerido"),
  cantidad: z.number().int().positive("La cantidad debe ser un entero positivo"),
});

const createQuoteSchema = z.object({
  cliente: z.object({
    nombre: z.string().optional(),
    telefono: z.string().min(10, "El teléfono debe tener al menos 10 dígitos"),
    correo: z.string().email("Correo electrónico inválido").optional().or(z.literal("")),
    empresa: z.string().optional(),
  }),
  items: z.array(quoteItemSchema).min(1, "Debe incluir al menos un producto"),
  estadoClave: z.string().optional(),
  descuentoVendedorPorcentaje: z.number().min(0).max(10).optional(),
  origen: z.enum(["web_asistente", "carrito", "vendedor", "chatbot"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = createQuoteSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos de cotización inválidos", detalles: parsed.error.format() },
        { status: 400 }
      );
    }

    const { cliente, items, estadoClave, descuentoVendedorPorcentaje, origen } = parsed.data;

    const cotizacion = await crearCotizacionServidor({
      cliente,
      items,
      estadoClave,
      opciones: {
        descuentoVendedorPorcentaje,
      },
      origen,
    });

    return NextResponse.json(
      {
        success: true,
        folio: cotizacion.folio,
        urlPublica: cotizacion.urlPublica,
        totalCentavos: cotizacion.calculo.totalCentavos,
        totalFormateado: cotizacion.calculo.formato.total,
        cotizacion,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error al crear cotización:", error);
    return NextResponse.json(
      { error: error.message || "Error interno al generar cotización" },
      { status: 500 }
    );
  }
}

