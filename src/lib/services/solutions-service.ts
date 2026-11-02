import { adminDb, isFirestoreReady } from "@/lib/firebase/admin";
import { Car, Truck, Shield, Clock, MapPin, LucideIcon } from "lucide-react";

export interface SolutionTier {
  id: string; // e.g. "basico", "recomendado", "completo"
  nivel: "Básico" | "Recomendado" | "Completo";
  titulo: string;
  subtitulo: string;
  productoSlug: string; // Slug del producto con precio confirmado
  incluye: string[];
  destacado?: boolean;
}

export interface SolucionItem {
  slug: string;
  titulo: string;
  subtitulo: string;
  problema: string;
  equipoRecomendado: string;
  precioDesdeCentavos: number; // Precio con IVA o base
  iconoName: "Car" | "Truck" | "Shield" | "Clock" | "MapPin";
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
    precioDesdeCentavos: 463999, // $4,639.99 con IVA ($3,999.99 sin IVA)
    iconoName: "Car",
    amenazas: [
      "Robo de unidad estacionada o con violencia",
      "Uso indebido de la unidad en horarios no laborales",
      "Falta de localización inmediata en trayectos en carretera",
    ],
    tiers: [
      {
        id: "basico",
        nivel: "Básico",
        titulo: "Protección Esencial",
        subtitulo: "Rastreo satelital sin accesorios adicionales",
        productoSlug: "gps-estandar-sin-telemetria",
        incluye: [
          "Dispositivo GPS 4G de nueva generación",
          "Instalación profesional oculta incluida",
          "SIM de datos y primer año de plataforma web y app móvil",
          "Reporte periódico de ubicación y estado de encendido",
        ],
      },
      {
        id: "recomendado",
        nivel: "Recomendado",
        titulo: "Video en Vivo + Audio",
        subtitulo: "Seguridad visual completa en carretera y cabina",
        productoSlug: "dashcam-jc181",
        destacado: true,
        incluye: [
          "Cámara inteligente 2 lentes JC181 (cabina y carretera)",
          "GPS integrado con paro de motor preventivo",
          "Transmisión de video en vivo 4G y audio de emergencia",
          "Instalación oculta profesional incluida",
          "SIM de datos y primer año de nube para video",
        ],
      },
      {
        id: "completo",
        nivel: "Completo",
        titulo: "Rastreo + Botón SOS",
        subtitulo: "Máxima prevención ante emergencias en ruta",
        productoSlug: "gps-basico-semi",
        incluye: [
          "Equipo GPS 4G con entrada para relevador",
          "Botón de pánico SOS para alerta inmediata",
          "Corte de marcha seguro vía app móvil",
          "Instalación profesional oculta incluida",
          "Licencia anual con plataforma y plan de datos",
        ],
      },
    ],
    accesoriosCompatiblesSlugs: ["boton-panico", "seguros-puertas-automatizados", "accesorio-generico"],
  },
  {
    slug: "taxi-apps",
    titulo: "Taxis y Apps (Uber / DiDi)",
    subtitulo: "Protección continua, botón de pánico de cabina y evidencia en video para conductores.",
    problema: "Asaltos a chofer durante viajes nocturnos, disputas con pasajeros y desconexión intencional.",
    equipoRecomendado: "GPS Básico Semi con Botón SOS",
    precioDesdeCentavos: 600553, // $6,005.53 con IVA ($5,177.18 sin IVA)
    iconoName: "Car",
    amenazas: [
      "Asalto en trayecto o retención del conductor",
      "Disputas de cobro o incidentes con pasajeros",
      "Pérdida de señal en zonas periféricas o suburbanas",
    ],
    tiers: [
      {
        id: "basico",
        nivel: "Básico",
        titulo: "Rastreo Operativo",
        subtitulo: "Localización continua y paro de motor",
        productoSlug: "gps-basico-semi",
        incluye: [
          "Localizador GPS 4G de alta disponibilidad",
          "Botón de pánico SOS oculto en cabina",
          "Paro de motor seguro desde la app",
          "Instalación oculta sin cables a la vista",
          "Primer año de plataforma móvil y datos",
        ],
      },
      {
        id: "recomendado",
        nivel: "Recomendado",
        titulo: "DashCam Inteligente IA",
        subtitulo: "Evidencia en video y audio en cabina",
        productoSlug: "dashcam-jc181",
        destacado: true,
        incluye: [
          "Cámara doble lente JC181 de cabina y frontal",
          "Grabación en bucle con detección de incidentes",
          "Botón SOS y micrófono para emergencias",
          "Instalación profesional certificada",
          "SIM 4G y licencia con app móvil",
        ],
      },
      {
        id: "completo",
        nivel: "Completo",
        titulo: "Flota de Pasaje Pro",
        subtitulo: "Protección integral para unidades de alquiler",
        productoSlug: "dashcam-jc181",
        incluye: [
          "Cámara doble JC181 con GPS y paro de motor",
          "Botón SOS de cabina y audio para emergencias",
          "Acceso multiusuario para dueño y chofer",
          "Instalación profesional oculta",
        ],
      },
    ],
    accesoriosCompatiblesSlugs: ["boton-panico", "microfono", "bocina"],
  },
  {
    slug: "tractocamion",
    titulo: "Tractocamiones y Carga Pesada",
    subtitulo: "Telemetría avanzada de motor, protección activa anti-jammer, control de combustible y multicámara.",
    problema: "Asaltos carreteros con inhibidores de señal (jammer), ordeña de diesel y desvío de rutas federales.",
    equipoRecomendado: "GPS Flotilla Profesional",
    precioDesdeCentavos: 1029732, // $10,297.32 con IVA ($8,877.00 sin IVA)
    iconoName: "Truck",
    amenazas: [
      "Ataque con inhibidores de señal RF (jammer) en carretera",
      "Robo y merma de combustible en tanques principales",
      "Pérdida de comunicación en tramos despoblados",
    ],
    tiers: [
      {
        id: "basico",
        nivel: "Básico",
        titulo: "Telemetría de Flota",
        subtitulo: "Control satelital de uso rudo para tracto",
        productoSlug: "gps-flotilla",
        incluye: [
          "GPS Profesional 4G para 12/24V de servicio pesado",
          "Botón de pánico y paro de motor seguro",
          "Puertos para sensores análogos y digitales",
          "Instalación técnica profesional incluida",
          "Licencia anual con plataforma y app",
        ],
      },
      {
        id: "recomendado",
        nivel: "Recomendado",
        titulo: "Video Industrial Multicanal",
        subtitulo: "DashCam industrial JC450 de alta resistencia",
        productoSlug: "dashcam-jc450",
        destacado: true,
        incluye: [
          "DashCam Industrial JC450 (hasta 4 canales de video)",
          "GPS de alta precisión y corte preventivo de motor",
          "Audio de cabina y sensor de colisión / eventos",
          "Instalación técnica certificada en tractocamión",
          "SIM 4G industrial y licencia anual en la nube",
        ],
      },
      {
        id: "completo",
        nivel: "Completo",
        titulo: "Seguridad Activa + Anti-Jammer",
        subtitulo: "Protección máxima contra robo con violencia",
        productoSlug: "sistema-anti-jammer",
        incluye: [
          "Módulo detector de inhibidores RF (anti-jammer)",
          "Bloqueo preventivo automático ante ataque",
          "Comunicación RFID que no depende de antenas",
          "Instalación técnica especializada",
          "Asistencia para recuperación de unidades con la ANERPV",
        ],
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
    titulo: "Camiones, Volteos y Autobuses",
    subtitulo: "Control de velocidad, cumplimiento de horarios, geocercas en ruta y monitoreo de pasaje.",
    problema: "Excesos de velocidad, desvíos de ruta, maltrato a la unidad y falta de evidencia en siniestros.",
    equipoRecomendado: "GPS Intermedio Uso Pesado",
    precioDesdeCentavos: 925332, // $9,253.32 con IVA ($7,977.00 sin IVA)
    iconoName: "Truck",
    amenazas: [
      "Excesos de velocidad y multas viales",
      "Desvío de ruta autorizada y paradas clandestinas",
      "Conflictos y quejas de usuarios o clientes",
    ],
    tiers: [
      {
        id: "basico",
        nivel: "Básico",
        titulo: "Rastreo Pesado",
        subtitulo: "Monitoreo de ruta y botón de auxilio",
        productoSlug: "gps-intermedio",
        incluye: [
          "GPS de grado pesado resistente a vibración constante",
          "Botón de pánico de cabina",
          "Antenas externas de alta ganancia",
          "Instalación profesional oculta",
          "Primer año de plataforma con reportes de velocidad",
        ],
      },
      {
        id: "recomendado",
        nivel: "Recomendado",
        titulo: "Telemetría y Control",
        subtitulo: "GPS Flotilla con paro remoto y control de motor",
        productoSlug: "gps-flotilla",
        destacado: true,
        incluye: [
          "GPS 4G con telemetría de ignición y velocidad",
          "Paro de motor seguro programable",
          "Alertas de entrada y salida de geocercas",
          "Instalación técnica profesional incluida",
          "Licencia anual con app móvil",
        ],
      },
      {
        id: "completo",
        nivel: "Completo",
        titulo: "Video en Ruta",
        subtitulo: "DashCam inteligente para carretera y pasaje",
        productoSlug: "dashcam-jc181",
        incluye: [
          "Cámara doble lente con video en vivo 4G",
          "Grabación continua de incidentes de tránsito",
          "Botón de pánico y audio de cabina para emergencias",
          "Instalación técnica profesional",
        ],
      },
    ],
    accesoriosCompatiblesSlugs: ["boton-panico", "bocina", "sensor-temperatura"],
  },
  {
    slug: "caja-refrigerada",
    titulo: "Cajas Secas y Refrigeradas",
    subtitulo: "Monitoreo de temperatura en cadena de frío, GPS autónomo y cerrojos electromecánicos.",
    problema: "Pérdida de temperatura en perecederos/medicinas, desenganche no autorizado y robo de carga.",
    equipoRecomendado: "GPS Portable 3-D o GPS Caja",
    precioDesdeCentavos: 878932, // $8,789.32 con IVA ($7,577.00 sin IVA)
    iconoName: "Shield",
    amenazas: [
      "Variaciones térmicas que dañan mercancía perecedera",
      "Desenganche furtivo de tracto en paradores",
      "Apertura no autorizada de compuertas traseras",
    ],
    tiers: [
      {
        id: "basico",
        nivel: "Básico",
        titulo: "GPS Autónomo Magnético",
        subtitulo: "Portátil sin necesidad de cableado",
        productoSlug: "gps-portable-3d",
        incluye: [
          "Unidad GPS autónoma con batería de 3 días",
          "Fijación magnética de alta adherencia",
          "Sensor de desprendimiento de unidad",
          "Cargador y SIM 4G incluida",
          "Primer año de plataforma web y app móvil",
        ],
      },
      {
        id: "recomendado",
        nivel: "Recomendado",
        titulo: "GPS Caja de Larga Duración",
        subtitulo: "Gabinete sellado IP67 para chasis",
        productoSlug: "gps-caja",
        destacado: true,
        incluye: [
          "GPS sellado IP67 con batería de respaldo extendida",
          "Detección de enganche y desenganche de tracto",
          "Instalación en chasis o pared de caja",
          "SIM 4G y licencia anual con plataforma",
        ],
      },
      {
        id: "completo",
        nivel: "Completo",
        titulo: "Chapa Ferceo Electromecánica",
        subtitulo: "Apertura autorizada solo desde central o RFID",
        productoSlug: "chapa-electromecanica-1-perno-ferceo",
        incluye: [
          "Cerradura electromecánica blindada de 1 perno",
          "Sensor de estado abierto / cerrado",
          "Liberación remota autorizada",
          "Instalación profesional de alta seguridad",
        ],
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
    titulo: "Maquinaria Pesada y Construcción",
    subtitulo: "Medición exacta de horómetros de motor, geocercas en obra, voltaje y paro preventivo.",
    problema: "Uso no autorizado de noche, robo en frentes de obra aislados y cobros incorrectos por horas de trabajo.",
    equipoRecomendado: "GPS Maquinaria Pesada IP67",
    precioDesdeCentavos: 948532, // $9,485.32 con IVA ($8,177.00 sin IVA)
    iconoName: "Clock",
    amenazas: [
      "Robo de maquinaria pesada en obra",
      "Uso indebido fuera de turnos acordados",
      "Falta de control real en consumo y horómetros",
    ],
    tiers: [
      {
        id: "basico",
        nivel: "Básico",
        titulo: "Horómetro y Posición",
        subtitulo: "Control satelital de horas de trabajo en obra",
        productoSlug: "gps-maquinaria-pesada",
        incluye: [
          "Dispositivo reforzado con certificación IP67",
          "Sensor de encendido y cálculo exacto de horómetro",
          "Instalación blindada oculta",
          "Geocercas de obra con alertas de salida",
          "Primer año de plataforma con reportes de operación",
        ],
      },
      {
        id: "recomendado",
        nivel: "Recomendado",
        titulo: "Control Flota Amarilla",
        subtitulo: "Telemetría avanzada de ignición y paro seguro",
        productoSlug: "gps-flotilla",
        destacado: true,
        incluye: [
          "GPS Profesional 4G para equipo pesado",
          "Paro de motor seguro a distancia",
          "Sensor de batería y alertas por desconexión",
          "Instalación técnica en patio o proyecto",
          "Licencia anual con app móvil",
        ],
      },
      {
        id: "completo",
        nivel: "Completo",
        titulo: "Gestión de Diesel en Obra",
        subtitulo: "Sensor digital de varilla calibrado litro por litro",
        productoSlug: "sensor-combustible-varilla-instalado",
        incluye: [
          "Sensor digital de varilla para tanque",
          "Instalación y calibración matemática",
          "Gráficas de nivel y detección de ordeña",
          "Garantía de sellado contra fugas",
        ],
      },
    ],
    accesoriosCompatiblesSlugs: ["sensor-combustible-varilla-instalado", "boton-panico"],
  },
  {
    slug: "motos",
    titulo: "Motocicletas de Reparto",
    subtitulo: "GPS ultra compacto con consumo mínimo para no drenar la batería y corte de corriente seguro.",
    problema: "Robo de la moto estacionada en entregas, asalto al repartidor y drenado de batería con GPS convencional.",
    equipoRecomendado: "GPS Motocicleta Y04g Impermeable",
    precioDesdeCentavos: 855732, // $8,557.32 con IVA ($7,377.00 sin IVA)
    iconoName: "MapPin",
    amenazas: [
      "Robo de motocicleta estacionada en punto de entrega",
      "Asalto en ruta de reparto de última milla",
      "Descarga de la batería de la moto por equipos genéricos",
    ],
    tiers: [
      {
        id: "basico",
        nivel: "Básico",
        titulo: "Rastreo Ultra Eficiente",
        subtitulo: "Diseño compacto impermeable IP65",
        productoSlug: "gps-motocicleta-y04g",
        incluye: [
          "Dispositivo GPS sellado impermeable Y04g",
          "Arnés con fusible y protección para batería pequeña",
          "Corte de corriente remoto desde la app",
          "Instalación técnica oculta incluida",
          "SIM de datos y primer año de plataforma móvil",
        ],
      },
      {
        id: "recomendado",
        nivel: "Recomendado",
        titulo: "Corte de Corriente Activo",
        subtitulo: "Inmovilización inmediata ante robo",
        productoSlug: "gps-motocicleta-y04g",
        destacado: true,
        incluye: [
          "GPS Y04g con micro-relevador integrado",
          "Modo reposo ultra-bajo consumo cuando está apagada",
          "Alerta inmediata por intento de encendido no autorizado",
          "Instalación técnica profesional incluida",
          "Licencia anual con plataforma y app móvil",
        ],
      },
      {
        id: "completo",
        nivel: "Completo",
        titulo: "Flotilla de Reparto Pro",
        subtitulo: "Control de velocidad y rutas para flotillas",
        productoSlug: "gps-motocicleta-y04g",
        incluye: [
          "GPS Y04g con corte de ignición",
          "Geocercas de reparto y reportes de velocidad",
          "SIM 4G y plataforma con soporte CoSoAVL",
          "Instalación técnica especializada",
        ],
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
      const dbMap = new Map(snap.docs.map((d) => [d.id, d.data() as SolucionItem]));
      return defaultSolutions.map((sol) => (dbMap.has(sol.slug) ? { ...sol, ...dbMap.get(sol.slug) } : sol));
    }
  } catch (e) {
    console.warn("Error leyendo coleccion solutions de Firestore:", e);
  }
  return defaultSolutions;
}

export async function getSolutionBySlug(slug: string): Promise<SolucionItem | null> {
  const all = await getSolutions();
  return all.find((s) => s.slug === slug) || null;
}
