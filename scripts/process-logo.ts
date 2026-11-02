import path from "path";
import sharp from "sharp";
import fs from "fs";

async function processLogo() {
  const inputPath = "C:/Users/czssf/.gemini/antigravity/brain/326055ce-c090-41ec-b4d7-6719f577d049/.user_uploaded/media_1793645867976_b4b159af.jpg";
  const outputPng = path.resolve(process.cwd(), "public/logo-cosotec.png");
  const outputWebp = path.resolve(process.cwd(), "public/logo-cosotec.webp");
  const outputTransparentPng = path.resolve(process.cwd(), "public/logo-cosotec-transparent.png");

  console.log("Procesando logo oficial...");
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  console.log(`Dimensiones originales: ${metadata.width}x${metadata.height}`);

  // 1. Guardar PNG nítido original
  await sharp(inputPath).png({ quality: 100 }).toFile(outputPng);
  await sharp(inputPath).webp({ quality: 95 }).toFile(outputWebp);

  // 2. Crear versión con fondo transparente eliminando el blanco del fondo
  // Extraer canales raw para procesar alfa de forma precisa
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const threshold = 240; // Umbral de blanco
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Si el pixel es muy cercano al blanco puro, hacerlo transparente
    if (r > threshold && g > threshold && b > threshold) {
      // Suavizado en bordes
      const diff = Math.min(r, g, b) - threshold;
      const alphaFactor = 1 - diff / (255 - threshold);
      data[i + 3] = Math.max(0, Math.min(255, Math.round(alphaFactor * 255)));
    }
  }

  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png()
    .toFile(outputTransparentPng);

  console.log("✅ Logos generados con éxito en public/:");
  console.log("   - public/logo-cosotec.png");
  console.log("   - public/logo-cosotec.webp");
  console.log("   - public/logo-cosotec-transparent.png");
}

processLogo().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
