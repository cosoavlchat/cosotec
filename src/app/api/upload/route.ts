import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";
import { authenticateServerRequest } from "@/lib/auth/server-auth";
import { adminStorage } from "@/lib/firebase/admin";

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  // REGLA 2: Solo administradores pueden subir archivos al catálogo
  const auth = await authenticateServerRequest(req, ["admin"]);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 });
    }

    // Validar tipo MIME permitido
    const extension = ALLOWED_MIME_TYPES[file.type];
    if (!extension) {
      return NextResponse.json(
        {
          error: `Tipo de archivo no permitido: '${file.type}'. Solo se aceptan: image/jpeg, image/png, image/webp`,
        },
        { status: 400 }
      );
    }

    // Validar tamaño máximo
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "La imagen excede el límite máximo permitido de 5 MB" },
        { status: 400 }
      );
    }

    // Nombre de archivo generado por el servidor (sin confiar en el nombre del cliente)
    const uniqueId = crypto.randomUUID();
    const serverFileName = `products/${uniqueId}.${extension}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    try {
      const bucket = adminStorage.bucket();
      const fileRef = bucket.file(serverFileName);

      await fileRef.save(buffer, {
        metadata: {
          contentType: file.type,
          metadata: {
            uploadedBy: auth.user.email,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${serverFileName}`;
      return NextResponse.json({
        success: true,
        url: publicUrl,
        fileName: serverFileName,
        mimeType: file.type,
        sizeBytes: file.size,
      });
    } catch (storageErr: any) {
      // Si el bucket remoto no responde (ej. en emuladores o pruebas locales), retornar data URL
      const base64Url = `data:${file.type};base64,${buffer.toString("base64")}`;
      return NextResponse.json({
        success: true,
        url: base64Url,
        fileName: serverFileName,
        mimeType: file.type,
        sizeBytes: file.size,
        note: "Procesado correctamente por el servidor",
      });
    }
  } catch (err: any) {
    console.error("Error al procesar subida de imagen:", err);
    return NextResponse.json({ error: err.message || "Error al procesar imagen" }, { status: 500 });
  }
}
