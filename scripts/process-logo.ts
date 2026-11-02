import path from "path";
import sharp from "sharp";
import fs from "fs";

async function processLogoTransparent() {
  const inputPath = "C:/Users/czssf/.gemini/antigravity/brain/326055ce-c090-41ec-b4d7-6719f577d049/.user_uploaded/media_1793645867976_b4b159af.jpg";
  const outputPng = path.resolve(process.cwd(), "public/logo-cosotec.png");
  const outputWebp = path.resolve(process.cwd(), "public/logo-cosotec.webp");
  const outputTransparentPng = path.resolve(process.cwd(), "public/logo-cosotec-transparent.png");

  console.log("Extrayendo logo con transparencia limpia...");
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  console.log(`Dimensiones: ${metadata.width}x${metadata.height}`);

  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Procesamos pixel a pixel:
  // El fondo del logo original es blanco puro (255,255,255) con un suave desvanecimiento hacia los bordes.
  // Para que los bordes dorados y el texto no queden cortados toscamente ni tengan halos blancos feos:
  // Calculamos la distancia al blanco puro.
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const minColor = Math.min(r, g, b);
    const maxColor = Math.max(r, g, b);

    // Si es casi blanco (todos los canales altos y poca saturación)
    if (minColor > 220) {
      // Diferencia respecto a blanco puro 255
      // minColor entre 220 y 255
      const brightness = (r + g + b) / 3;
      if (brightness > 250) {
        data[i + 3] = 0; // Totalmente transparente
      } else {
        // Antialiasing suave en el borde entre 220 y 250
        const alpha = Math.round(((250 - brightness) / 30) * 255);
        data[i + 3] = Math.max(0, Math.min(255, alpha));
      }
    }
  }

  // Guardar tanto logo-cosotec.png como logo-cosotec.webp con transparencia nativa
  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(outputTransparentPng);

  // Sobrescribir también logo-cosotec.png y webp para que cualquier referencia use la versión sin fondo
  fs.copyFileSync(outputTransparentPng, outputPng);

  await sharp(outputTransparentPng)
    .webp({ quality: 95, alphaQuality: 100 })
    .toFile(outputWebp);

  console.log("✅ Versión sin fondo blanco generada exitosamente en public/logo-cosotec.png");
}

processLogoTransparent().catch(console.error);
