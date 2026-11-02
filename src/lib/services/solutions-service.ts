import { adminDb, isFirestoreReady } from "@/lib/firebase/admin";
import { Car, Truck, Shield, Clock, MapPin } from "lucide-react";

export interface SolutionTier {
  id: string; // e.g. "basico", "recomendado", "completo"
  nivel: "Básico" | "Recomendado" | "Completo";
  titulo: string;
  subtitulo: string;
  productosSlugs: string[]; // Slugs acumulativos de productos reales con precio confirmado
  destacado?: boolean;
}

export interface SolucionItem {
  slug: string;
  titulo: string;
  subtitulo: string;
  problema: string;
  equipoRecomendado: string;
  precioDesdeCentavos: number; // Precio base calculado
  iconoName: "Car" | "Truck" | "Shield" | "Clock" | "MapPin";
  imagenUrl: string; // Tarjeta 3:4 horizontal con logo oficial
  amenazas: string[];
  tiers: SolutionTier[];
  accesoriosCompatiblesSlugs: string[];
}

export const defaultSolutions: SolucionItem[] = [
  {
    slug: "auto-camioneta",
    titulo: "Autos y Camionetas",
    subtitulo: "Rastreo personal, paro de motor preventivo y botón de auxilio para particulares y familias.",
    problema: "Robo de vehículo en vía pública, asalto en semáforo o uso no autorizado por terceros sin supervisión.",
    equipoRecomendado: "GPS Estándar sin telemetría",
    precioDesdeCentavos: 463999, // $3,999.99 + IVA = $4,639.99
    iconoName: "Car",
    imagenUrl: "/solutions/auto-camioneta.webp",
    amenazas: [
      "Robo de unidad estacionada o con violencia",
      "Uso indebido de la unidad en horarios no laborales",
      "Falta de localización inmediata en trayectos en carretera",
    ],
    tiers: [
      {
        id: "basico",
        nivel: "Básico",
        titulo: "Rastreo Esencial",
        subtitulo: "Localización y seguridad básica para tu unidad",
        productosSlugs: ["gps-estandar-sin-telemetria"],
      },
      {
        id: "recomendado",
        nivel: "Recomendado",
        titulo: "Rastreo + Botón de Auxilio",
        subtitulo: "Localización continua con alerta silenciosa para emergencias",
        productosSlugs: ["gps-estandar-sin-telemetria", "boton-panico"],
        destacado: true,
      },
      {
        id: "completo",
        nivel: "Completo",
        titulo: "Rastreo + Auxilio + Video DashCam",
        subtitulo: "Monitoreo satelital, botón SOS y DashCam de 2 lentes en cabina y carretera",
        productosSlugs: ["gps-estandar-sin-telemetria", "boton-panico", "dashcam-jc181"],
      },
    ],
    accesoriosCompatiblesSlugs: ["boton-panico", "seguros-puertas-automatizados"],
  },
  {
    slug: "taxi-apps",
    titulo: "Taxis y Apps (Uber / DiDi)",
    subtitulo: "Protección continua para conductores de plataforma, botón de auxilio silencioso y evidencia de viaje.",
    problema: "Asaltos en pasajes nocturnos, disputas con usuarios y zonas de alto riesgo urbano.",
    equipoRecomendado: "GPS Básico Semi",
    precioDesdeCentavos: 600553, // $5,177.18 + IVA = $6,005.53
    iconoName: "Car",
    imagenUrl: "/solutions/taxi-apps.webp",
    amenazas: [
      "Asalto en pasajes o desvío de ruta",
      "Disputas y acusaciones falsas durante el trayecto",
      "Robo de vehículo con violencia al conductor",
    ],
    tiers: [
      {
        id: "basico",
        nivel: "Básico",
        titulo: "Rastreo para Plataformas",
        subtitulo: "Monitoreo continuo para vehículos de alquiler o plataforma",
        productosSlugs: ["gps-basico-semi"],
      },
      {
        id: "recomendado",
        nivel: "Recomendado",
        titulo: "Rastreo + Botón de Pánico",
        subtitulo: "Alerta silenciosa inmediata en situaciones de riesgo para el conductor",
        productosSlugs: ["gps-basico-semi", "boton-panico"],
        destacado: true,
      },
      {
        id: "completo",
        nivel: "Completo",
        titulo: "Rastreo + Botón + Video DashCam",
        subtitulo: "Evidencia en video 4G en vivo de cabina y carretera con botón SOS",
        productosSlugs: ["gps-basico-semi", "boton-panico", "dashcam-jc181"],
      },
    ],
    accesoriosCompatiblesSlugs: ["boton-panico", "microfono", "bocina"],
  },
  {
    slug: "tractocamion",
    titulo: "Tractocamiones y Carga Pesada",
    subtitulo: "Telemetría avanzada, detección activa anti-jammer, control de diesel y evidencia en ruta.",
    problema: "Ataques con inhibidores de señal (jammer), robo de combustible en paradas y asaltos en carreteras federales.",
    equipoRecomendado: "GPS Flotilla",
    precioDesdeCentavos: 1029732, // $8,877.00 + IVA = $10,297.32
    iconoName: "Truck",
    imagenUrl: "/solutions/tractocamion.webp",
    amenazas: [
      "Ataques con inhibidores de señal jammer en carretera",
      "Ordeña y robo no autorizado de diesel",
      "Pérdida total del tractocamión y carga en tránsito",
    ],
    tiers: [
      {
        id: "basico",
        nivel: "Básico",
        titulo: "Telemetría de Flotilla",
        subtitulo: "GPS profesional 4G para transporte federal de carga",
        productosSlugs: ["gps-flotilla"],
      },
      {
        id: "recomendado",
        nivel: "Recomendado",
        titulo: "Flotilla + Protección Anti-Jammer",
        subtitulo: "Detección activa de inhibidores de señal con bloqueo preventivo al motor",
        productosSlugs: ["gps-flotilla", "sistema-anti-jammer"],
        destacado: true,
      },
      {
        id: "completo",
        nivel: "Completo",
        titulo: "Flotilla + Anti-Jammer + DashCam JC450",
        subtitulo: "Máxima protección telemática, anti-bloqueador y video industrial",
        productosSlugs: ["gps-flotilla", "sistema-anti-jammer", "dashcam-jc450"],
      },
    ],
    accesoriosCompatiblesSlugs: [
      "sistema-anti-jammer",
      "sensor-combustible-varilla-instalado",
      "camara-externa-ip67",
      "teclado-rfid-ferceo",
    ],
  },
  {
    slug: "camion-autobus",
    titulo: "Camiones y Autobuses",
    subtitulo: "Control telemático de velocidad, geocercas de operación y cumplimiento de rutas.",
    problema: "Excesos de velocidad que provocan siniestros, desvío de recorridos y paradas no autorizadas.",
    equipoRecomendado: "GPS Intermedio",
    precioDesdeCentavos: 925332, // $7,977.00 + IVA = $9,253.32
    iconoName: "Truck",
    imagenUrl: "/solutions/camion-autobus.webp",
    amenazas: [
      "Excesos de velocidad y manejo agresivo",
      "Desvío de rutas asignadas y paradas clandestinas",
      "Incidentes de tránsito sin evidencia objetiva",
    ],
    tiers: [
      {
        id: "basico",
        nivel: "Básico",
        titulo: "Rastreo de Uso Pesado",
        subtitulo: "GPS reforzado para autobuses, volteos y transporte de personal",
        productosSlugs: ["gps-intermedio"],
      },
      {
        id: "recomendado",
        nivel: "Recomendado",
        titulo: "Rastreo Pesado + Botón de Auxilio",
        subtitulo: "Monitoreo de ruta y velocidad con botón de emergencia para operador",
        productosSlugs: ["gps-intermedio", "boton-panico"],
        destacado: true,
      },
      {
        id: "completo",
        nivel: "Completo",
        titulo: "Rastreo + Auxilio + DashCam Industrial",
        subtitulo: "Video en tiempo real, registro de incidentes y control telemático robusto",
        productosSlugs: ["gps-intermedio", "boton-panico", "dashcam-jc450"],
      },
    ],
    accesoriosCompatiblesSlugs: ["boton-panico", "bocina", "sensor-temperatura"],
  },
  {
    slug: "caja-refrigerada",
    titulo: "Cajas Secas y Refrigeradas",
    subtitulo: "Seguimiento satelital autónomo para remolques y monitoreo continuo de temperatura de carga.",
    problema: "Desenganche no autorizado en patios, apertura de puertas en tránsito y pérdida de cadena de frío.",
    equipoRecomendado: "GPS Caja",
    precioDesdeCentavos: 971732, // $8,377.00 + IVA = $9,717.32
    iconoName: "Shield",
    imagenUrl: "/solutions/caja-refrigerada.webp",
    amenazas: [
      "Desenganche y robo encubierto de caja en patios",
      "Pérdida de temperatura en mercancía perecedera o farmacéutica",
      "Apertura no autorizada de compuertas durante el traslado",
    ],
    tiers: [
      {
        id: "basico",
        nivel: "Básico",
        titulo: "Rastreo Autónomo de Caja",
        subtitulo: "Monitoreo continuo con batería extendida e impermeabilidad",
        productosSlugs: ["gps-caja"],
      },
      {
        id: "recomendado",
        nivel: "Recomendado",
        titulo: "Rastreo + Sensor de Temperatura",
        subtitulo: "Protección de cadena de frío con alertas de pérdida térmica en tiempo real",
        productosSlugs: ["gps-caja", "sensor-temperatura"],
        destacado: true,
      },
      {
        id: "completo",
        nivel: "Completo",
        titulo: "Rastreo + Temperatura + Chapa Ferceo RFID",
        subtitulo: "Control térmico y cerradura electromecánica de perno con apertura por tarjeta RFID",
        productosSlugs: ["gps-caja", "sensor-temperatura", "chapa-electromecanica-1-perno-ferceo", "teclado-rfid-ferceo"],
      },
    ],
    accesoriosCompatiblesSlugs: [
      "sensor-temperatura",
      "chapa-electromecanica-1-perno-ferceo",
      "teclado-rfid-ferceo",
      "caja-iman-gl200-gl300",
    ],
  },
  {
    slug: "maquinaria",
    titulo: "Maquinaria Pesada y Obra",
    subtitulo: "Control exacto de horómetros de motor, geocercas en obra y prevención de robo en campamento.",
    problema: "Uso no facturado de equipo en fines de semana, extracción de diesel y robo de maquinaria en predios.",
    equipoRecomendado: "GPS Maquinaria Pesada",
    precioDesdeCentavos: 948532, // $8,177.00 + IVA = $9,485.32
    iconoName: "Clock",
    imagenUrl: "/solutions/maquinaria.webp",
    amenazas: [
      "Operación no registrada fuera de horarios autorizados",
      "Robo de maquinaria en predios o campamentos desatendidos",
      "Falta de mantenimiento oportuno por desconocimiento de horómetros",
    ],
    tiers: [
      {
        id: "basico",
        nivel: "Básico",
        titulo: "Telemetría para Obra",
        subtitulo: "Control de horómetros de motor y geocercas en proyectos y canteras",
        productosSlugs: ["gps-maquinaria-pesada"],
      },
      {
        id: "recomendado",
        nivel: "Recomendado",
        titulo: "Telemetría + Botón de Auxilio",
        subtitulo: "Medición de horas de motor y alerta de emergencia para operadores de obra",
        productosSlugs: ["gps-maquinaria-pesada", "boton-panico"],
        destacado: true,
      },
      {
        id: "completo",
        nivel: "Completo",
        titulo: "Telemetría + Auxilio + Anti-Jammer",
        subtitulo: "Protección total contra robo con inhibidores y paro inteligente en campo",
        productosSlugs: ["gps-maquinaria-pesada", "boton-panico", "sistema-anti-jammer"],
      },
    ],
    accesoriosCompatiblesSlugs: ["sensor-combustible-varilla-instalado", "boton-panico", "sistema-anti-jammer"],
  },
  {
    slug: "motos",
    titulo: "Motos de Reparto y Mensajería",
    subtitulo: "Rastreo satelital para flotas de entrega con ultra bajo consumo de batería y corte de corriente.",
    problema: "Robo exprés de motocicletas en semáforos, descarga de batería con GPS ordinarios y desvíos de zona.",
    equipoRecomendado: "GPS Motocicleta Y04g",
    precioDesdeCentavos: 855732, // $7,377.00 + IVA = $8,557.32
    iconoName: "MapPin",
    imagenUrl: "/solutions/motos.webp",
    amenazas: [
      "Robo violento de motocicleta en puntos de reparto",
      "Descarga de la batería por uso de equipos no diseñados para motos",
      "Accidentes o caídas sin alerta inmediata al centro de control",
    ],
    tiers: [
      {
        id: "recomendado",
        nivel: "Recomendado",
        titulo: "GPS Motocicleta Y04g",
        subtitulo: "Protección integral con corte de corriente y consumo optimizado para batería",
        productosSlugs: ["gps-motocicleta-y04g"],
        destacado: true,
      },
    ],
    accesoriosCompatiblesSlugs: ["boton-panico"],
  },
];

export async function getSolutions(): Promise<SolucionItem[]> {
  if (!(await isFirestoreReady())) return defaultSolutions;
  try {
    const snap = await adminDb.collection("solutions").get();
    if (!snap.empty) {
      return snap.docs.map((d) => ({ slug: d.id, ...d.data() } as SolucionItem));
    }
  } catch (e) {
    console.warn("[getSolutions] Error leyendo Firestore, usando defaultSolutions:", e);
  }
  return defaultSolutions;
}

export async function getSolutionBySlug(slug: string): Promise<SolucionItem | null> {
  const all = await getSolutions();
  return all.find((s) => s.slug === slug) || null;
}
