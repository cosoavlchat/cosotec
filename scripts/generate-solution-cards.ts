import path from "path";
import sharp from "sharp";
import fs from "fs";

interface SolutionCardConfig {
  slug: string;
  title: string;
  badge: string;
  subtitle: string;
  accentColor: string;
  bgGradientStart: string;
  bgGradientEnd: string;
  iconSvg: string;
}

const solutions: SolutionCardConfig[] = [
  {
    slug: "auto-camioneta",
    title: "Autos y Camionetas",
    badge: "PROTECCIÓN VEHICULAR",
    subtitle: "Rastreo 24/7 • Paro de Motor Remoto • Botón SOS",
    accentColor: "#C9A15B",
    bgGradientStart: "#1a060a",
    bgGradientEnd: "#400d16",
    iconSvg: `<svg width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="#C9A15B" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 10.7 2 10.8 2 11v5c0 .6.4 1 1 1h2"/>
      <circle cx="7" cy="17" r="2"/>
      <path d="M9 17h6"/>
      <circle cx="17" cy="17" r="2"/>
    </svg>`,
  },
  {
    slug: "taxi-apps",
    title: "Taxis y Apps (Uber / DiDi)",
    badge: "SEGURIDAD DE PASAJEROS",
    subtitle: "Monitoreo Continuo • Alerta Silenciosa • Cobertura",
    accentColor: "#EAB308",
    bgGradientStart: "#140a02",
    bgGradientEnd: "#3d1e05",
    iconSvg: `<svg width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="#EAB308" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 2h4"/>
      <path d="m14 2-1 4h-2l-1-4"/>
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 10.7 2 10.8 2 11v5c0 .6.4 1 1 1h2"/>
      <circle cx="7" cy="17" r="2"/>
      <path d="M9 17h6"/>
      <circle cx="17" cy="17" r="2"/>
    </svg>`,
  },
  {
    slug: "tractocamion",
    title: "Tractocamiones y Carga Federal",
    badge: "TELEMETRÍA AVANZADA",
    subtitle: "Sistema Anti-Jammer • Combustible • DashCam JC450",
    accentColor: "#38BDF8",
    bgGradientStart: "#030e1a",
    bgGradientEnd: "#0c2847",
    iconSvg: `<svg width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
      <path d="M15 18H9"/>
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
      <circle cx="17" cy="18" r="2"/>
      <circle cx="7" cy="18" r="2"/>
    </svg>`,
  },
  {
    slug: "camion-autobus",
    title: "Camiones y Autobuses",
    badge: "CONTROL OPERATIVO",
    subtitle: "Velocidad y Geocercas • Botón SOS • Video en Cabina",
    accentColor: "#34D399",
    bgGradientStart: "#021710",
    bgGradientEnd: "#063d2c",
    iconSvg: `<svg width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="#34D399" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8 6v6"/>
      <path d="M15 6v6"/>
      <path d="M2 12h19.6"/>
      <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.6-.4-1-1-1H2c-.6 0-1 .4-1 1 0 .4.1.8.2 1.2.3 1.1.8 2.8.8 2.8h3"/>
      <circle cx="7" cy="18" r="2"/>
      <path d="M9 18h6"/>
      <circle cx="17" cy="18" r="2"/>
    </svg>`,
  },
  {
    slug: "caja-refrigerada",
    title: "Cajas Secas y Refrigeradas",
    badge: "CADENA DE FRÍO Y CARGA",
    subtitle: "GPS Autónomo • Sensor Temperatura • Chapa Ferceo",
    accentColor: "#A78BFA",
    bgGradientStart: "#11061f",
    bgGradientEnd: "#2e124f",
    iconSvg: `<svg width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
      <rect width="20" height="14" x="2" y="5" rx="2"/>
      <path d="M2 10h20"/>
      <path d="m10 15 2-2 2 2"/>
      <path d="M12 9v6"/>
    </svg>`,
  },
  {
    slug: "maquinaria",
    title: "Maquinaria Pesada y Obra",
    badge: "HORÓMETROS Y CONTROL",
    subtitle: "Medición Horómetros • Batería • Anti-Jammer",
    accentColor: "#FB923C",
    bgGradientStart: "#1a0a03",
    bgGradientEnd: "#451c09",
    iconSvg: `<svg width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="#FB923C" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>`,
  },
  {
    slug: "motos",
    title: "Motos de Reparto y Mensajería",
    badge: "ULTRA BAJO CONSUMO",
    subtitle: "GPS Impermeable Y04g • Corte de Corriente • SOS Opcional",
    accentColor: "#F43F5E",
    bgGradientStart: "#1f040a",
    bgGradientEnd: "#4d0b1a",
    iconSvg: `<svg width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="5.5" cy="17.5" r="3.5"/>
      <circle cx="18.5" cy="17.5" r="3.5"/>
      <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2"/>
    </svg>`,
  },
];

async function generateSolutionCards() {
  const outputDir = path.resolve(process.cwd(), "public/solutions");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const logoBuffer = await sharp(path.resolve(process.cwd(), "public/logo-cosotec-transparent.png"))
    .resize({ width: 220, height: 53, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const width = 800;
  const height = 600; // 4:3 landscape card ratio

  for (const sol of solutions) {
    const svgBackground = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${sol.bgGradientStart}"/>
          <stop offset="60%" stop-color="${sol.bgGradientEnd}"/>
          <stop offset="100%" stop-color="#050102"/>
        </linearGradient>
        <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
          <circle cx="15" cy="15" r="1" fill="${sol.accentColor}" opacity="0.15" />
          <path d="M 30 0 L 0 0 0 30" fill="none" stroke="${sol.accentColor}" stroke-width="0.3" opacity="0.08" />
        </pattern>
        <linearGradient id="accentGlow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${sol.accentColor}" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="${sol.accentColor}" stop-opacity="0"/>
        </linearGradient>
        <radialGradient id="logoRadialGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.75"/>
          <stop offset="40%" stop-color="#FFFFFF" stop-opacity="0.45"/>
          <stop offset="75%" stop-color="#FFFFFF" stop-opacity="0.12"/>
          <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
        </radialGradient>
      </defs>

      <!-- Fondo Degradado -->
      <rect width="${width}" height="${height}" fill="url(#bg)"/>
      <rect width="${width}" height="${height}" fill="url(#grid)"/>

      <!-- Círculo de Brillo de Acento -->
      <circle cx="650" cy="200" r="220" fill="${sol.accentColor}" opacity="0.1" filter="blur(60px)"/>
      <circle cx="150" cy="450" r="180" fill="#7A1428" opacity="0.25" filter="blur(50px)"/>

      <!-- Icono Ilustrativo Flotante -->
      <g transform="translate(520, 160)" opacity="0.75">
        ${sol.iconSvg}
      </g>

      <!-- Badge Superior -->
      <rect x="50" y="55" width="240" height="32" rx="16" fill="black" fill-opacity="0.5" stroke="${sol.accentColor}" stroke-width="1" stroke-opacity="0.5"/>
      <text x="70" y="76" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="800" fill="${sol.accentColor}" letter-spacing="1.5">
        ${sol.badge}
      </text>

      <!-- Título de la Solución -->
      <text x="50" y="160" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="900" fill="#FFFFFF" letter-spacing="-0.5">
        ${sol.title.split(" y ")[0]}
      </text>
      ${sol.title.includes(" y ") ? `
      <text x="50" y="202" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="800" fill="#F3F4F6">
        y ${sol.title.split(" y ")[1]}
      </text>` : ""}

      <!-- Barra de Acento -->
      <rect x="50" y="235" width="120" height="4" rx="2" fill="url(#accentGlow)"/>

      <!-- Subtítulo / Puntos Clave -->
      <text x="50" y="275" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="600" fill="#E5E7EB">
        ${sol.subtitle}
      </text>

      <!-- Tarjeta inferior decorativa con sello telemático -->
      <rect x="50" y="480" width="400" height="60" rx="14" fill="black" fill-opacity="0.45" stroke="white" stroke-width="0.8" stroke-opacity="0.12"/>
      <circle cx="80" cy="510" r="12" fill="${sol.accentColor}" fill-opacity="0.2"/>
      <circle cx="80" cy="510" r="5" fill="${sol.accentColor}"/>
      <text x="105" y="505" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="700" fill="#FFFFFF">
        TECNOLOGÍA TELEMÁTICA AVANZADA
      </text>
      <text x="105" y="523" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="500" fill="#9CA3AF">
        Hardware de alta resistencia • Garantía CoSoAVL
      </text>

      <!-- Resplandor Radial Blanco Suave detrás del Logo (Sin caja sólida) -->
      <ellipse cx="645" cy="528" rx="140" ry="46" fill="url(#logoRadialGlow)" />

      <!-- Borde general de tarjeta -->
      <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="24" fill="none" stroke="white" stroke-width="1.5" stroke-opacity="0.12"/>
    </svg>
    `;

    // Combinar fondo con el logo oficial CosoTec en la esquina inferior derecha
    const baseImage = sharp(Buffer.from(svgBackground));
    
    // El logo en la esquina inferior derecha sobre el contenedor blanco
    const compositeImage = await baseImage.composite([
      {
        input: logoBuffer,
        top: 502,
        left: 538,
      },
    ]);

    const targetWebp = path.join(outputDir, `${sol.slug}.webp`);
    await compositeImage.webp({ quality: 90 }).toFile(targetWebp);
    console.log(`✅ Generada tarjeta: public/solutions/${sol.slug}.webp`);
  }
}

generateSolutionCards().catch((err) => {
  console.error("Error generando tarjetas:", err);
  process.exit(1);
});
