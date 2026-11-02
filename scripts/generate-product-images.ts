import fs from "fs";
import path from "path";
import sharp from "sharp";

const outDir = path.resolve(process.cwd(), "public/products");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

interface ImageSpec {
  name: string;
  svg: string;
}

function baseStudio(content: string): string {
  return `<svg width="800" height="600" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="45%" r="65%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="70%" stop-color="#F3F4F6"/>
      <stop offset="100%" stop-color="#E5E7EB"/>
    </radialGradient>
    <radialGradient id="floorShadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#111827" stop-opacity="0.25"/>
      <stop offset="60%" stop-color="#111827" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#111827" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="chassisGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2D3748"/>
      <stop offset="50%" stop-color="#1A202C"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="metalBevel" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#64748B"/>
      <stop offset="50%" stop-color="#334155"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F59E0B"/>
      <stop offset="50%" stop-color="#D97706"/>
      <stop offset="100%" stop-color="#B45309"/>
    </linearGradient>
    <linearGradient id="lensGrad" x1="20%" y1="20%" x2="80%" y2="80%">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="30%" stop-color="#0284C7"/>
      <stop offset="70%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#0369A1"/>
    </linearGradient>
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Studio Background -->
  <rect width="800" height="600" fill="url(#bgGlow)"/>
  
  <!-- Subtle Telemetry Grid -->
  <g opacity="0.04" stroke="#7A1428" stroke-width="1">
    <line x1="0" y1="150" x2="800" y2="150"/>
    <line x1="0" y1="300" x2="800" y2="300"/>
    <line x1="0" y1="450" x2="800" y2="450"/>
    <line x1="200" y1="0" x2="200" y2="600"/>
    <line x1="400" y1="0" x2="400" y2="600"/>
    <line x1="600" y1="0" x2="600" y2="600"/>
  </g>

  <!-- Floor Contact Shadow -->
  <ellipse cx="400" cy="490" rx="260" ry="26" fill="url(#floorShadow)"/>

  ${content}

  <!-- CoSoAVL Engineering Authenticity Seal -->
  <g transform="translate(640, 520)">
    <rect width="130" height="42" rx="8" fill="#FFFFFF" fill-opacity="0.85" stroke="#E2E8F0" stroke-width="1"/>
    <circle cx="20" cy="21" r="9" fill="#7A1428"/>
    <path d="M17 21L19 23L23 19" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="36" y="19" fill="#1E293B" font-family="system-ui, sans-serif" font-size="10" font-weight="800" letter-spacing="0.5">CoSoAVL</text>
    <text x="36" y="30" fill="#64748B" font-family="system-ui, sans-serif" font-size="8" font-weight="600">CERTIFICADO</text>
  </g>
</svg>`;
}

const images: ImageSpec[] = [
  // 1. GPS Estándar / 4G Telematics Box
  {
    name: "gps-standard.webp",
    svg: baseStudio(`
      <!-- Harness Wiring -->
      <path d="M250 420 C220 440, 180 470, 140 480" stroke="#EF4444" stroke-width="6" stroke-linecap="round"/>
      <path d="M255 425 C230 450, 190 485, 150 495" stroke="#111827" stroke-width="6" stroke-linecap="round"/>
      <path d="M260 430 C240 460, 200 495, 160 510" stroke="#F59E0B" stroke-width="6" stroke-linecap="round"/>
      <path d="M265 435 C250 470, 215 505, 175 520" stroke="#10B981" stroke-width="6" stroke-linecap="round"/>
      <rect x="130" y="475" width="22" height="48" rx="4" fill="#334155" transform="rotate(-15 130 475)"/>

      <!-- Main Chassis -->
      <rect x="250" y="190" width="300" height="230" rx="20" fill="url(#chassisGrad)" stroke="url(#metalBevel)" stroke-width="4"/>
      <!-- Screws -->
      <circle cx="275" cy="215" r="5" fill="#475569"/>
      <circle cx="525" cy="215" r="5" fill="#475569"/>
      <circle cx="275" cy="395" r="5" fill="#475569"/>
      <circle cx="525" cy="395" r="5" fill="#475569"/>

      <!-- Embossed Center Panel -->
      <rect x="290" y="235" width="220" height="140" rx="12" fill="#0B0F17" stroke="#1E293B" stroke-width="2"/>
      
      <!-- Brand & Tech Specs -->
      <text x="400" y="275" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="16" font-weight="900" text-anchor="middle" letter-spacing="2">4G LTE GPS TRACKER</text>
      <text x="400" y="295" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="11" font-weight="700" text-anchor="middle" letter-spacing="1">MULTI-CONSTELLATION AVL</text>

      <!-- Status LEDs -->
      <g transform="translate(325, 325)">
        <!-- PWR LED -->
        <circle cx="20" cy="15" r="7" fill="#10B981" filter="url(#softGlow)"/>
        <circle cx="20" cy="15" r="3" fill="#A7F3D0"/>
        <text x="20" y="34" fill="#64748B" font-family="system-ui, sans-serif" font-size="8" font-weight="700" text-anchor="middle">PWR</text>

        <!-- GSM LED -->
        <circle cx="75" cy="15" r="7" fill="#3B82F6" filter="url(#softGlow)"/>
        <circle cx="75" cy="15" r="3" fill="#BFDBFE"/>
        <text x="75" y="34" fill="#64748B" font-family="system-ui, sans-serif" font-size="8" font-weight="700" text-anchor="middle">GSM</text>

        <!-- GPS LED -->
        <circle cx="130" cy="15" r="7" fill="#F59E0B" filter="url(#softGlow)"/>
        <circle cx="130" cy="15" r="3" fill="#FDE68A"/>
        <text x="130" y="34" fill="#64748B" font-family="system-ui, sans-serif" font-size="8" font-weight="700" text-anchor="middle">GPS</text>
      </g>
    `),
  },

  // 2. GPS Moto / Compact Waterproof
  {
    name: "gps-moto.webp",
    svg: baseStudio(`
      <!-- Compact Slim Chassis -->
      <rect x="280" y="220" width="240" height="170" rx="28" fill="url(#chassisGrad)" stroke="#38BDF8" stroke-width="2"/>
      
      <!-- Sealed Rubber Gasket Line -->
      <rect x="290" y="230" width="220" height="150" rx="20" fill="none" stroke="#0284C7" stroke-width="1.5" stroke-dasharray="6 4"/>
      
      <!-- IP67 Waterproof Badge -->
      <rect x="350" y="255" width="100" height="24" rx="12" fill="#0369A1" fill-opacity="0.3" stroke="#38BDF8" stroke-width="1"/>
      <text x="400" y="271" fill="#38BDF8" font-family="system-ui, sans-serif" font-size="11" font-weight="800" text-anchor="middle">IP67 WATERPROOF</text>

      <text x="400" y="315" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="18" font-weight="900" text-anchor="middle">MOTO ULTRA SLIM</text>
      <text x="400" y="335" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="11" font-weight="600" text-anchor="middle">Anti-Drain / Sleep Mode</text>

      <!-- Cable Tail -->
      <path d="M400 390 C400 440, 360 480, 300 500" stroke="#0F172A" stroke-width="10" stroke-linecap="round"/>
      <path d="M400 390 C400 440, 360 480, 300 500" stroke="#38BDF8" stroke-width="2" stroke-dasharray="4 4" stroke-linecap="round"/>
    `),
  },

  // 3. GPS Portable / Imán de Alto Poder
  {
    name: "gps-portable.webp",
    svg: baseStudio(`
      <!-- Heavy Duty Magnet Case -->
      <rect x="260" y="190" width="280" height="220" rx="16" fill="#1E293B" stroke="#475569" stroke-width="4"/>
      <!-- Ribs -->
      <rect x="290" y="205" width="220" height="8" rx="4" fill="#0F172A"/>
      <rect x="290" y="385" width="220" height="8" rx="4" fill="#0F172A"/>

      <!-- Industrial Twin Magnets underneath -->
      <rect x="290" y="405" width="80" height="20" rx="4" fill="#64748B" stroke="#94A3B8" stroke-width="2"/>
      <rect x="430" y="405" width="80" height="20" rx="4" fill="#64748B" stroke="#94A3B8" stroke-width="2"/>

      <!-- Center Battery / Info Display -->
      <rect x="300" y="240" width="200" height="120" rx="10" fill="#0B0F17" stroke="#334155" stroke-width="2"/>
      <text x="400" y="275" fill="#F59E0B" font-family="system-ui, sans-serif" font-size="14" font-weight="900" text-anchor="middle">AUTONOMOUS BATTERY</text>
      <text x="400" y="300" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="22" font-weight="900" text-anchor="middle">10,000 mAh</text>
      <text x="400" y="325" fill="#10B981" font-family="system-ui, sans-serif" font-size="12" font-weight="700" text-anchor="middle">Imán de Neodimio 80kg</text>
      <text x="400" y="345" fill="#64748B" font-family="system-ui, sans-serif" font-size="10" font-weight="600" text-anchor="middle">Sensor de Desprendimiento</text>
    `),
  },

  // 4. DashCam Inteligente con IA
  {
    name: "dashcam.webp",
    svg: baseStudio(`
      <!-- Windshield Mount Bracket -->
      <path d="M370 140 L430 140 L415 210 L385 210 Z" fill="#334155"/>
      <rect x="360" y="130" width="80" height="16" rx="8" fill="#1E293B"/>

      <!-- DashCam Main Body -->
      <rect x="240" y="210" width="320" height="190" rx="24" fill="url(#chassisGrad)" stroke="url(#metalBevel)" stroke-width="3"/>

      <!-- Front Big Camera Lens Assembly -->
      <circle cx="360" cy="305" r="65" fill="#0F172A" stroke="#475569" stroke-width="4"/>
      <circle cx="360" cy="305" r="50" fill="url(#metalBevel)"/>
      <circle cx="360" cy="305" r="38" fill="url(#lensGrad)"/>
      <circle cx="345" cy="290" r="12" fill="#FFFFFF" fill-opacity="0.4" filter="url(#softGlow)"/>

      <!-- Cabin / ADAS Sensor Mini Lens -->
      <circle cx="475" cy="270" r="24" fill="#0F172A" stroke="#334155" stroke-width="2"/>
      <circle cx="475" cy="270" r="14" fill="url(#lensGrad)"/>
      <text x="475" y="310" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="9" font-weight="800" text-anchor="middle">AI DMS</text>

      <!-- Recording LED -->
      <circle cx="280" cy="250" r="6" fill="#EF4444" filter="url(#softGlow)"/>
      <circle cx="280" cy="250" r="2.5" fill="#FEE2E2"/>
      <text x="300" y="254" fill="#EF4444" font-family="system-ui, sans-serif" font-size="10" font-weight="900">REC</text>

      <text x="475" y="360" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="13" font-weight="900" text-anchor="middle">DUAL 1080P</text>
      <text x="475" y="375" fill="#38BDF8" font-family="system-ui, sans-serif" font-size="10" font-weight="700" text-anchor="middle">ADAS + DMS IA</text>
    `),
  },

  // 5. Sistema Anti-Jammer & Seguridad
  {
    name: "antijammer.webp",
    svg: baseStudio(`
      <!-- Twin Antennas -->
      <rect x="330" y="110" width="10" height="110" rx="5" fill="#0F172A" stroke="#334155" stroke-width="2"/>
      <circle cx="335" cy="108" r="8" fill="#F59E0B" filter="url(#softGlow)"/>

      <rect x="460" y="110" width="10" height="110" rx="5" fill="#0F172A" stroke="#334155" stroke-width="2"/>
      <circle cx="465" cy="108" r="8" fill="#F59E0B" filter="url(#softGlow)"/>

      <!-- RF Waves Shield -->
      <path d="M300 130 A60 60 0 0 1 370 130" stroke="#F59E0B" stroke-width="3" fill="none" opacity="0.6"/>
      <path d="M430 130 A60 60 0 0 1 500 130" stroke="#F59E0B" stroke-width="3" fill="none" opacity="0.6"/>

      <!-- Central Anti-Jammer Shield Box -->
      <rect x="270" y="210" width="260" height="200" rx="20" fill="url(#chassisGrad)" stroke="#F59E0B" stroke-width="3"/>
      
      <!-- Holographic Shield Icon -->
      <path d="M400 250 L450 270 L450 330 C450 365, 400 385, 400 385 C400 385, 350 365, 350 330 L350 270 Z" fill="#7A1428" stroke="#F59E0B" stroke-width="2.5"/>
      <path d="M400 275 L385 315 L405 315 L395 355 L420 310 L400 310 Z" fill="#F59E0B"/>

      <text x="400" y="435" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="15" font-weight="900" text-anchor="middle" letter-spacing="1">ESCUDO ANTI-INHIBIDOR</text>
      <text x="400" y="455" fill="#F59E0B" font-family="system-ui, sans-serif" font-size="11" font-weight="700" text-anchor="middle">Paro Autónomo al Detectar Jammer</text>
    `),
  },

  // 6. Sensor de Combustible de Varilla Capacitiva
  {
    name: "sensor-combustible.webp",
    svg: baseStudio(`
      <!-- Flange Mount Base (Aluminium) -->
      <rect x="330" y="160" width="140" height="40" rx="8" fill="#94A3B8" stroke="#CBD5E1" stroke-width="2"/>
      <circle cx="350" cy="180" r="5" fill="#475569"/>
      <circle cx="450" cy="180" r="5" fill="#475569"/>

      <!-- Cable Gland -->
      <rect x="420" y="130" width="20" height="30" rx="4" fill="#334155"/>
      <path d="M430 130 C430 90, 480 80, 520 70" stroke="#1E293B" stroke-width="8" stroke-linecap="round"/>

      <!-- Probe Electronic Head -->
      <rect x="350" y="140" width="100" height="24" rx="6" fill="#1E293B" stroke="#475569" stroke-width="1.5"/>
      <text x="400" y="156" fill="#38BDF8" font-family="system-ui, sans-serif" font-size="10" font-weight="800" text-anchor="middle">DIGITAL PROBE</text>

      <!-- Long Fuel Probe Rod -->
      <rect x="385" y="200" width="30" height="280" rx="6" fill="#E2E8F0" stroke="#94A3B8" stroke-width="2"/>
      <!-- Measurement Level Markings -->
      <g stroke="#94A3B8" stroke-width="1.5">
        <line x1="390" y1="240" x2="410" y2="240"/>
        <line x1="395" y1="260" x2="405" y2="260"/>
        <line x1="390" y1="280" x2="410" y2="280"/>
        <line x1="395" y1="300" x2="405" y2="300"/>
        <line x1="390" y1="320" x2="410" y2="320"/>
        <line x1="395" y1="340" x2="405" y2="340"/>
        <line x1="390" y1="360" x2="410" y2="360"/>
        <line x1="395" y1="380" x2="405" y2="380"/>
        <line x1="390" y1="400" x2="410" y2="400"/>
        <line x1="390" y1="440" x2="410" y2="440"/>
      </g>

      <!-- Liquid Measurement Float Level (Virtual) -->
      <rect x="375" y="330" width="50" height="24" rx="4" fill="#3B82F6" fill-opacity="0.8" stroke="#60A5FA" stroke-width="2"/>
      <text x="400" y="346" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="10" font-weight="900" text-anchor="middle">99.5%</text>

      <text x="400" y="510" fill="#1E293B" font-family="system-ui, sans-serif" font-size="14" font-weight="900" text-anchor="middle">PRECISIÓN 99.5%</text>
      <text x="400" y="528" fill="#64748B" font-family="system-ui, sans-serif" font-size="11" font-weight="600" text-anchor="middle">Detección Inmediata de Ordeña o Carga</text>
    `),
  },

  // 7. Chapa Electromecánica de Seguridad / Perno Exterior
  {
    name: "chapa-seguridad.webp",
    svg: baseStudio(`
      <!-- Heavy Duty Steel Body -->
      <rect x="270" y="200" width="260" height="200" rx="14" fill="#334155" stroke="#94A3B8" stroke-width="4"/>
      <!-- Internal Core -->
      <rect x="290" y="220" width="220" height="160" rx="8" fill="#0F172A" stroke="#1E293B" stroke-width="2"/>

      <!-- Hardened Steel Bolt (Extending) -->
      <rect x="200" y="275" width="100" height="50" rx="8" fill="#CBD5E1" stroke="#E2E8F0" stroke-width="3"/>
      <rect x="180" y="285" width="25" height="30" rx="4" fill="#94A3B8"/>

      <!-- Ferceo Emblem -->
      <text x="400" y="280" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="16" font-weight="900" text-anchor="middle">FERCEO PERNO</text>
      <text x="400" y="305" fill="#F59E0B" font-family="system-ui, sans-serif" font-size="12" font-weight="800" text-anchor="middle">FUERZA 1,300+ LB</text>
      <text x="400" y="330" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="10" font-weight="600" text-anchor="middle">Apertura Remota y por Teclado</text>

      <circle cx="475" cy="245" r="8" fill="#10B981" filter="url(#softGlow)"/>
    `),
  },

  // 8. Dron Empresarial de Inspección y Mapeo
  {
    name: "dron-empresarial.webp",
    svg: baseStudio(`
      <!-- Drone Arms -->
      <line x1="260" y1="200" x2="540" y2="380" stroke="#334155" stroke-width="14" stroke-linecap="round"/>
      <line x1="540" y1="200" x2="260" y2="380" stroke="#334155" stroke-width="14" stroke-linecap="round"/>

      <!-- Motors & Rotors -->
      <circle cx="260" cy="200" r="30" fill="#0F172A" stroke="#94A3B8" stroke-width="2"/>
      <ellipse cx="260" cy="200" rx="60" ry="12" fill="#E2E8F0" fill-opacity="0.3" stroke="#94A3B8" stroke-width="1"/>

      <circle cx="540" cy="200" r="30" fill="#0F172A" stroke="#94A3B8" stroke-width="2"/>
      <ellipse cx="540" cy="200" rx="60" ry="12" fill="#E2E8F0" fill-opacity="0.3" stroke="#94A3B8" stroke-width="1"/>

      <circle cx="260" cy="380" r="30" fill="#0F172A" stroke="#94A3B8" stroke-width="2"/>
      <ellipse cx="260" cy="380" rx="60" ry="12" fill="#E2E8F0" fill-opacity="0.3" stroke="#94A3B8" stroke-width="1"/>

      <circle cx="540" cy="380" r="30" fill="#0F172A" stroke="#94A3B8" stroke-width="2"/>
      <ellipse cx="540" cy="380" rx="60" ry="12" fill="#E2E8F0" fill-opacity="0.3" stroke="#94A3B8" stroke-width="1"/>

      <!-- Fuselage -->
      <rect x="340" y="240" width="120" height="100" rx="20" fill="url(#chassisGrad)" stroke="#475569" stroke-width="3"/>
      <!-- Optical Gimbal Dome -->
      <circle cx="400" cy="310" r="26" fill="url(#lensGrad)" stroke="#38BDF8" stroke-width="2"/>
      <circle cx="392" cy="302" r="7" fill="#FFFFFF" fill-opacity="0.5"/>

      <text x="400" y="440" fill="#1E293B" font-family="system-ui, sans-serif" font-size="15" font-weight="900" text-anchor="middle">DRON EMPRESARIAL 4K</text>
      <text x="400" y="460" fill="#64748B" font-family="system-ui, sans-serif" font-size="11" font-weight="600" text-anchor="middle">Mapeo Fotogramétrico y Sensor Térmico</text>
    `),
  },

  // 9. Botón de Pánico Oculto
  {
    name: "boton-panico.webp",
    svg: baseStudio(`
      <!-- Mount Bracket -->
      <rect x="320" y="210" width="160" height="180" rx="18" fill="#1E293B" stroke="#475569" stroke-width="3"/>
      
      <!-- Big Round Push Button -->
      <circle cx="400" cy="300" r="55" fill="#DC2626" stroke="#991B1B" stroke-width="6"/>
      <circle cx="400" cy="300" r="45" fill="#EF4444"/>
      <circle cx="385" cy="285" r="14" fill="#FFFFFF" fill-opacity="0.35"/>

      <text x="400" y="306" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="14" font-weight="900" text-anchor="middle" letter-spacing="1">SOS</text>

      <text x="400" y="425" fill="#1E293B" font-family="system-ui, sans-serif" font-size="14" font-weight="900" text-anchor="middle">BOTÓN DE EMERGENCIA</text>
      <text x="400" y="445" fill="#64748B" font-family="system-ui, sans-serif" font-size="11" font-weight="600" text-anchor="middle">Alerta Silenciosa Inmediata a Central 24/7</text>
    `),
  },

  // 10. Servicios de Instalación Certificada
  {
    name: "servicio-instalacion.webp",
    svg: baseStudio(`
      <!-- Technical Badge -->
      <circle cx="400" cy="280" r="100" fill="#7A1428" stroke="#C9A15B" stroke-width="4"/>
      <circle cx="400" cy="280" r="85" fill="#4A0C18"/>

      <!-- Certified Technician Tool Icon -->
      <g transform="translate(365, 240) scale(1.5)" fill="none" stroke="#C9A15B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </g>

      <text x="400" y="420" fill="#1E293B" font-family="system-ui, sans-serif" font-size="16" font-weight="900" text-anchor="middle">INSTALACIÓN PROFESIONAL OCULTA</text>
      <text x="400" y="440" fill="#7A1428" font-family="system-ui, sans-serif" font-size="12" font-weight="800" text-anchor="middle">48–72 Horas Garantizadas</text>
      <text x="400" y="460" fill="#64748B" font-family="system-ui, sans-serif" font-size="11" font-weight="600" text-anchor="middle">Sin Cortar Cables · Garantía de Agencia Intacta</text>
    `),
  },
];

async function generate() {
  console.log("Generando imágenes de productos en", outDir);

  for (const item of images) {
    const dest = path.join(outDir, item.name);
    await sharp(Buffer.from(item.svg))
      .webp({ quality: 90 })
      .toFile(dest);
    console.log("✓ Creado:", item.name);
  }

  console.log("¡Todas las imágenes de muestra fueron generadas con éxito!");
}

generate().catch(console.error);
