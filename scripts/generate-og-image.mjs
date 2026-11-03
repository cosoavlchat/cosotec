import sharp from "sharp";
import path from "path";

async function generate() {
  const width = 1200;
  const height = 630;

  // Fondo estilizado con acentos de marca CoSoTec / CoSoAVL
  const svgOverlay = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="#FAF9F8" />
    <!-- Barra superior Vino Oficial -->
    <rect x="0" y="0" width="${width}" height="14" fill="#7A1428" />
    <rect x="0" y="14" width="${width}" height="4" fill="#C9A15B" />

    <!-- Círculo difuminado sutil detrás del logo -->
    <radialGradient id="halo" cx="50%" cy="45%" r="40%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.9" />
      <stop offset="60%" stop-color="#FFFFFF" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#FAF9F8" stop-opacity="0" />
    </radialGradient>
    <rect x="100" y="80" width="1000" height="420" fill="url(#halo)" />

    <!-- Texto Inferior Oficial -->
    <text x="600" y="470" text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="800" fill="#1C1C1E" letter-spacing="1">
      COTIZACIÓN OFICIAL EN LÍNEA
    </text>
    <text x="600" y="508" text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="500" fill="#7A1428" letter-spacing="0.5">
      Soluciones Telemáticas Avanzadas · Rastreo GPS · Video Telemática
    </text>
    <text x="600" y="538" text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#8E8E93" letter-spacing="0.5">
      CosoTec by CoSoAVL · Metepec, Estado de México
    </text>

    <!-- Barra inferior -->
    <rect x="0" y="622" width="${width}" height="8" fill="#7A1428" />
  </svg>
  `;

  // Redimensionar logo transparente oficial a 740px de ancho
  const logoBuffer = await sharp("public/logo-cosotec-transparent.png")
    .resize(740)
    .toBuffer();

  const baseSvg = Buffer.from(svgOverlay);

  await sharp(baseSvg)
    .composite([
      {
        input: logoBuffer,
        top: 175,
        left: Math.round((1200 - 740) / 2),
      },
    ])
    .png({ quality: 95 })
    .toFile("public/og-quote.png");

  console.log("✅ public/og-quote.png generado exitosamente (1200x630).");
}

generate().catch(console.error);
