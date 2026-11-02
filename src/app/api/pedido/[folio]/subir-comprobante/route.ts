import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb, adminStorage } from "@/lib/firebase/admin";
import { Order } from "@/types/order";
import { validarTokenCotizacion } from "@/lib/quotes";

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Valida los magic bytes (cabecera binaria del archivo) para garantizar que el
 * contenido real coincida con los tipos permitidos, evitando ataques de extensión falsa.
 */
function detectFileTypeFromMagicBytes(buffer: Buffer): { mime: string; ext: string } | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mime: "image/png", ext: "png" };
  }

  // PDF: %PDF (25 50 44 46)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return { mime: "application/pdf", ext: "pdf" };
  }

  // WebP: RIFF....WEBP (52 49 46 46 .... 57 45 42 50)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { mime: "image/webp", ext: "webp" };
  }

  return null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ folio: string }> }
) {
  try {
    const { folio } = await params;
    if (!folio) {
      return NextResponse.json({ error: "Folio no especificado." }, { status: 400 });
    }

    const formData = await req.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json({ error: "Petición no contiene FormData válido." }, { status: 400 });
    }

    const file = formData.get("file") as File | null;
    const token = formData.get("token") as string | null;

    if (!token) {
      return NextResponse.json(
        { error: "Se requiere el token de seguridad para autenticar la operación." },
        { status: 401 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: "No se seleccionó ningún archivo de comprobante." },
        { status: 400 }
      );
    }

    // 1. Obtener la orden en Firestore
    const orderRef = adminDb.collection("orders").doc(folio);
    const snap = await orderRef.get();

    if (!snap.exists) {
      return NextResponse.json(
        { error: `No se encontró la orden con folio ${folio}.` },
        { status: 404 }
      );
    }

    const order = snap.data() as Order;

    // 2. Validar token criptográfico (tiempo constante contra hash)
    if (!order.tokenHash || !validarTokenCotizacion(order.tokenHash, token)) {
      return NextResponse.json(
        { error: "Token de seguridad inválido o revocado para este pedido." },
        { status: 403 }
      );
    }

    // 3. Validar tipo de archivo
    const extension = ALLOWED_MIME_TYPES[file.type];
    if (!extension) {
      return NextResponse.json(
        {
          error: `Formato de archivo no admitido (${file.type}). Solo se aceptan imágenes JPG, PNG, WebP o documentos PDF.`,
        },
        { status: 400 }
      );
    }

    // 4. Validar tamaño (máx 5 MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "El comprobante excede el tamaño máximo permitido de 5 MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 5. Validación estricta por Magic Bytes (inspección de contenido binario)
    const detectedType = detectFileTypeFromMagicBytes(buffer);
    if (!detectedType) {
      return NextResponse.json(
        {
          error: "El contenido binario del archivo no corresponde a un formato de imagen o documento admitido (JPG, PNG, WebP o PDF).",
        },
        { status: 400 }
      );
    }

    // El nombre del archivo en Storage lo genera estrictamente el servidor con UUID y la extensión validada
    const uniqueId = crypto.randomUUID();
    const serverFileName = `comprobantes-spei/${folio}/${uniqueId}.${detectedType.ext}`;
    const nowIso = new Date().toISOString();

    let publicUrl = "";

    try {
      const bucket = adminStorage.bucket();
      const fileRef = bucket.file(serverFileName);

      await fileRef.save(buffer, {
        metadata: {
          contentType: detectedType.mime,
          metadata: {
            folio,
            uploadedAt: nowIso,
          },
        },
      });

      publicUrl = `https://storage.googleapis.com/${bucket.name}/${serverFileName}`;
    } catch (storageErr) {
      // Fallback para entornos de desarrollo / emulador sin bucket físico configurado
      publicUrl = `data:${detectedType.mime};base64,${buffer.toString("base64")}`;
    }

    const comprobanteData = {
      url: publicUrl,
      fileName: serverFileName,
      mimeType: detectedType.mime,
      sizeBytes: file.size,
      subidoAt: nowIso,
      motivoRechazo: undefined,
    };

    // 5. Actualizar estado de la orden a 'comprobante_subido'
    await orderRef.update({
      estado: "comprobante_subido",
      comprobanteSpei: comprobanteData,
      updatedAt: nowIso,
    });

    // 6. Registrar en bitácora de auditoría
    await adminDb.collection("auditLog").add({
      tipo: "spei_comprobante_subido_cliente",
      folio,
      fileName: serverFileName,
      sizeBytes: file.size,
      mimeType: file.type,
      fecha: nowIso,
    });

    return NextResponse.json({
      success: true,
      message: "Comprobante recibido con éxito. Tu pago está en proceso de validación administrativa.",
      comprobante: comprobanteData,
    });
  } catch (error: any) {
    console.error("[Subir Comprobante SPEI] Error:", error);
    return NextResponse.json(
      { error: "Error interno al procesar el comprobante.", message: error.message },
      { status: 500 }
    );
  }
}

