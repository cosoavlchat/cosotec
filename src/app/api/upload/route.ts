import { NextRequest, NextResponse } from "next/server";
import { adminStorage } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "El archivo debe ser una imagen" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "La imagen excede el límite de 5 MB" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = file.name.split(".").pop() || "jpg";
    const cleanFileName = `products/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${extension}`;

    try {
      const bucket = adminStorage.bucket();
      const fileRef = bucket.file(cleanFileName);

      await fileRef.save(buffer, {
        metadata: {
          contentType: file.type,
        },
      });

      // Si el bucket está configurado con lectura pública
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${cleanFileName}`;
      return NextResponse.json({ url: publicUrl, fileName: cleanFileName });
    } catch (storageErr) {
      // Fallback local: devolver una URL de datos base64 si no hay conexión a Storage
      const base64Url = `data:${file.type};base64,${buffer.toString("base64")}`;
      return NextResponse.json({
        url: base64Url,
        fileName: cleanFileName,
        note: "Guardado en modo fallback",
      });
    }
  } catch (err: any) {
    console.error("Error al procesar subida de imagen:", err);
    return NextResponse.json({ error: err.message || "Error al subir imagen" }, { status: 500 });
  }
}
