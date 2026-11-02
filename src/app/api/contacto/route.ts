import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { checkRateLimit } from "@/lib/services/rate-limit";

const ContactoSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  telefono: z
    .string()
    .min(10, "El teléfono/WhatsApp debe tener al menos 10 dígitos")
    .max(15, "Teléfono inválido")
    .regex(/^[0-9+ ]+$/, "Formato de teléfono inválido"),
  correo: z.string().email("Correo electrónico inválido"),
  empresa: z.string().max(100).optional().default(""),
  unidades: z.string().optional().default(""),
  mensaje: z.string().min(5, "El mensaje debe tener al menos 5 caracteres").max(1000),
  consentimientoPrivacidad: z.literal(true, {
    message: "Es obligatorio aceptar el aviso de privacidad",
  }),
  // Campo trampa (honeypot) para bots anti-spam
  website_field_hp: z.string().max(0, "Spam detectado").optional().default(""),
});

export async function POST(req: NextRequest) {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

    const rateLimit = await checkRateLimit(ip, "contacto", 5, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Demasiados intentos. Por favor espera unos minutos antes de volver a enviar." },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Si el honeypot viene lleno, simular éxito sin guardar en base de datos (desarmar al bot)
    if (body.website_field_hp && body.website_field_hp.trim() !== "") {
      return NextResponse.json({ success: true, message: "Mensaje recibido correctamente" });
    }

    const validated = ContactoSchema.parse(body);
    const now = new Date().toISOString();

    const leadDoc = {
      nombre: validated.nombre,
      telefono: validated.telefono,
      correo: validated.correo,
      empresa: validated.empresa,
      unidades: validated.unidades,
      mensaje: validated.mensaje,
      origen: "web_contacto",
      etapa: "nuevo",
      consentimientoPrivacidad: {
        aceptado: true,
        fecha: now,
        ip,
        version: "2026-v1",
      },
      createdAt: now,
      ultimaActividad: now,
    };

    const docRef = await adminDb.collection("leads").add(leadDoc);

    return NextResponse.json({
      success: true,
      leadId: docRef.id,
      message: "Tu mensaje ha sido enviado. Un asesor te contactará a la brevedad.",
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos del formulario inválidos", details: err.issues ?? (err as any).errors },
        { status: 400 }
      );
    }
    console.error("Error al registrar lead de contacto:", err);
    return NextResponse.json(
      { error: "Ocurrió un error al procesar tu solicitud. Intenta de nuevo más tarde." },
      { status: 500 }
    );
  }
}
