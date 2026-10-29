import { Product, Package } from "@/types/catalog";
import { PricingSettings, TravelFee, BankSettings, ContactSettings } from "@/types/pricing";

export const initialPricingSettings: PricingSettings = {
  ivaPorcentaje: 16,
  descuentoVolumen: {
    umbralUnidades: 5,
    porcentaje: 10,
  },
  topeDescuentoVendedor: 5,
  planesPago: ["contado", "credi_contado", "enganche_mensualidades"],
  msi: [], // REGLA 4: Vacío por defecto; no mostrar "desde $X/mes" hasta que se configuren
  comisionMsiAbsorbe: false,
  vigenciaDias: 15,
  ciudadesSinCosto: ["Toluca", "Metepec", "Ciudad de México", "Monterrey", "Guadalajara", "Querétaro"],
};

export const initialContactSettings: ContactSettings = {
  telefonos: ["722 134 0127"],
  whatsapp: "722 432 2053",
  correo: "ventas@cosoavl.com",
  direccion: "Metepec, Estado de México, México",
  horarios: "Lunes a Viernes 9:00 a 18:00 hrs, Sábados 9:00 a 14:00 hrs",
};

export const initialBankSettings: BankSettings = {
  banco: "BBVA Bancomer",
  titular: "CoSoAVL Telecomunicaciones S.A. de C.V.",
  clabe: "012180001234567890",
  cuenta: "0123456789",
  convenio: "CPE-1234",
};

export const initialFeaturesSettings = {
  modoCotizadorWhatsapp: true, // REGLA 6: Enlace a WhatsApp mientras no exista checkout
};

export const initialAnalyticsSettings = {
  ga4Id: "", // REGLA 10: Vacío = desactivado
  metaPixelId: "", // REGLA 10: Vacío = desactivado
};

// Colección content (para edición desde admin)
export const initialContentData = {
  stats: {
    cifraDispositivos: "48,000+",
    dispositivosTexto: "48,000 dispositivos vendidos en Norteamérica y Sudamérica",
    gobiernosTexto:
      "Equipo avalado por el sistema nacional de seguridad, instalado en gobiernos de Nuevo León, Tamaulipas y Puebla",
    aniosExperiencia: "15+",
    experienciaTexto: "Años de liderazgo en rastreo e ingeniería telemática",
  },
  hero: {
    badge: "Ingeniería Mexicana en Telemetría y Seguridad",
    titulo: "Protege lo que mueve a tu empresa y a tu familia",
    subtitulo:
      "Rastreo satelital GPS de alta precisión, DashCams con IA y seguridad activa contra inhibidores de señal (jammer). Instalación profesional en 48–72 horas.",
  },
  faq: [
    {
      pregunta: "¿Cuánto tiempo toma la instalación de un GPS o DashCam?",
      respuesta:
        "Una vez confirmado el pedido, la instalación se realiza dentro de las 48 a 72 horas hábiles. El tiempo por unidad es de 1.5 a 2 horas aproximadamente, realizado por instaladores técnicos calificados.",
    },
    {
      pregunta: "¿En qué ciudades la instalación no tiene costo de viáticos?",
      respuesta:
        "La instalación no genera costo adicional de viáticos en Toluca, Metepec, Ciudad de México (CDMX) y área conurbada, Monterrey, Guadalajara y Querétaro.",
    },
    {
      pregunta: "¿Qué incluye la compra de un equipo GPS?",
      respuesta:
        "Incluye el dispositivo homologado, instalación técnica oculta, tarjeta SIM multi-carrier y la licencia de plataforma de rastreo en tiempo real para app móvil y computadora.",
    },
    {
      pregunta: "¿Qué sucede si utilizan un inhibidor de señal (jammer)?",
      respuesta:
        "Contamos con la solución Anti-Jammer que detecta la presencia del inhibidor de frecuencia y ejecuta de inmediato el corte o bloqueo a marcha del motor, evitando que la unidad sea desplazada.",
    },
    {
      pregunta: "¿Puedo monitorear las cámaras de la DashCam en vivo?",
      respuesta:
        "Sí. Los modelos JC181 y JC450 permiten transmisión de video en vivo de cabina y carretera hacia tu celular o computadora mediante la red 4G LTE y respaldo en la nube.",
    },
  ],
  accesos: {
    gtSat: {
      nombre: "Ubicación Satelital GT-SAT",
      descripcion: "Monitoreo en tiempo real de flotas e historial de ruta.",
      url: "http://cosoavl.tracktracer.com:8080/track/Track",
    },
    sgl: {
      nombre: "Sistema de Gestión Logística (SGL)",
      descripcion: "Despacho, kilometraje y control operativo.",
      url: "http://www.tracktracer.com/cosoavl/",
    },
    sphereGt: {
      nombre: "Ubicación Satelital SGL+",
      descripcion: "Telemetría avanzada SphereGT y geocercas dinámicas.",
      url: "http://cosoavl.spheregt.com",
    },
    adminSphere: {
      nombre: "Administración SGL+",
      descripcion: "Consola de administración de cuentas y configuraciones.",
      url: "http://cosoavl.spheregt.com/admin/index.html",
    },
    videoDashcam: {
      nombre: "Plataforma de Video DashCam",
      descripcion: "Gestión de video en vivo y eventos de cabina (URL en proceso de asignación).",
      url: "", // Pendiente del cliente
    },
  },
  legales: {
    avisoRevision: "Documento en revisión por el área jurídica y comercial de CoSoAVL.",
  },
};

export const initialTravelFees: TravelFee[] = [
  { id: "AGU", claveInegi: "AGU", estadoNombre: "Aguascalientes", montoPorVisitaCentavos: 0, montoPorUnidadCentavos: 0, sinCosto: false },
  { id: "BCN", claveInegi: "BCN", estadoNombre: "Baja California", montoPorVisitaCentavos: 0, montoPorUnidadCentavos: 0, sinCosto: false },
  { id: "BCS", claveInegi: "BCS", estadoNombre: "Baja California Sur", montoPorVisitaCentavos: 0, montoPorUnidadCentavos: 0, sinCosto: false },
  { id: "CAM", claveInegi: "CAM", estadoNombre: "Campeche", montoPorVisitaCentavos: 0, montoPorUnidadCentavos: 0, sinCosto: false },
  { id: "CHP", claveInegi: "CHP", estadoNombre: "Chiapas", montoPorVisitaCentavos: 0, montoPorUnidadCentavos: 0, sinCosto: false },
  { id: "CHH", claveInegi: "CHH", estadoNombre: "Chihuahua", montoPorVisitaCentavos: 0, montoPorUnidadCentavos: 0, sinCosto: false },
  { id: "CDMX", claveInegi: "CDMX", estadoNombre: "Ciudad de México", montoPorVisitaCentavos: 0, montoPorUnidadCentavos: 0, sinCosto: true, notas: "Zona Metropolitana y CDMX sin costo" },
  { id: "COA", claveInegi: "COA", estadoNombre: "Coahuila", montoPorVisitaCentavos: 0, montoPorUnidadCentavos: 0, sinCosto: false },
  { id: "COL", claveInegi: "COL", estadoNombre: "Colima", montoPorVisitaCentavos: 0, montoPorUnidadCentavos: 0, sinCosto: false },
  { id: "DUR", claveInegi: "DUR", estadoNombre: "Durango", montoPorVisitaCentavos: 0, montoPorUnidadCentavos: 0, sinCosto: false },
  { id: "GUA", claveInegi: "GUA", estadoNombre: "Guanajuato", montoPorVisitaCentavos: 0, montoPorUnidadCentavos: 0, sinCosto: false },
  { id: "GRO", claveInegi: "GRO", estadoNombre: "Guerrero", montoPorVisitaCentavos: 0, montoPorUnidadCentavos: 0, sinCosto: false },
  { id: "HID", claveInegi: "HID", estadoNombre: "Hidalgo", montoPorVisitaCentavos: 0, montoPorUnidadCentavos: 0, sinCosto: false },
  { id: "JAL", claveInegi: "JAL", estadoNombre: "Jalisco", montoPorVisitaCentavos: 0, montoPorUnidadCentavos: 0, sinCosto: true, notas: "Guadalajara y zona metropolitana sin costo" },
  { id: "MEX", claveInegi: "MEX", estadoNombre: "Estado de México", montoPorVisitaCentavos: 0, montoPorUnidadCentavos: 0, sinCosto: true, notas: "Toluca, Metepec y Valle de México sin costo" },
  { id: "MIC", claveInegi: "MIC", estadoNombre: "Michoacán", montoPorVisitaCentavos: 0, montoPorUnidadCentavos: 0, sinCosto: false },
  { id: "MOR", claveInegi: "MOR", estadoNombre: "Morelos", montoPorVisitaCentavos: 0, montoPorUnidadCentavos: 0, sinCosto: false },
  { id: "NAY", claveInegi: "NAY", estadoNombre: "Nayarit", montoPorVisitaCentavos: 0, montoPorUnidadCentavos: 0, sinCosto: false },
  { id: "NLE", claveInegi: "NLE", estadoNombre: "Nuevo León", montoPorVisitaCentavos: 0, montoPorUnidadCentavos: 0, sinCosto: true, notas: "Monterrey y zona conurbada sin costo" },
  { id: "OAX", claveInegi: "OAX", estadoNombre: "Oaxaca", montoPorVisitaCentavos: 0, montoPorUnidadCentavos: 0, sinCosto: false },
  { id: "PUE", claveInegi: "PUE", estadoNombre: "Puebla", montoPorVisitaCentavos: 0, montoPorUnidadCentavos: 0, sinCosto: false },
  { id: "QRO", claveInegi: "QRO", estadoNombre: "Querétaro", montoPorVisitaCentavos: 0, montoPorUnidadCentavos: 0, sinCosto: true, notas: "Querétaro capital y San Juan del Río sin costo" },
  { id: "ROO", claveInegi: "ROO", estadoNombre: "Quintana Roo", montoPorVisitaCentavos: 0, montoPorUnidadCentavos: 0, sinCosto: false },
  { id: "SLP", claveInegi: "SLP", estadoNombre: "San Luis Potosí", montoPorVisitaCentavos: 0, montoPorUnidadCentavos: 0, sinCosto: false },
  { id: "SIN", claveInegi: "SIN", estadoNombre: "Sinaloa", montoPorVisitaCentavos: 0, montoPorUnidadCentavos: 0, sinCosto: false },
  { id: "SON", claveInegi: "SON", estadoNombre: "Sonora", montoPorVisitaCentavos: 0, montoPorUnidadCentavos: 0, sinCosto: false },
  { id: "TAB", claveInegi: "TAB", estadoNombre: "Tabasco", montoPorVisitaCentavos: 0, montoPorUnidadCentavos: 0, sinCosto: false },
  { id: "TAM", claveInegi: "TAM", estadoNombre: "Tamaulipas", montoPorVisitaCentavos: 0, montoPorUnidadCentavos: 0, sinCosto: false },
  { id: "TLA", claveInegi: "TLA", estadoNombre: "Tlaxcala", montoPorVisitaCentavos: 0, montoPorUnidadCentavos: 0, sinCosto: false },
  { id: "VER", claveInegi: "VER", estadoNombre: "Veracruz", montoPorVisitaCentavos: 0, montoPorUnidadCentavos: 0, sinCosto: false },
  { id: "YUC", claveInegi: "YUC", estadoNombre: "Yucatán", montoPorVisitaCentavos: 0, montoPorUnidadCentavos: 0, sinCosto: false },
  { id: "ZAC", claveInegi: "ZAC", estadoNombre: "Zacatecas", montoPorVisitaCentavos: 0, montoPorUnidadCentavos: 0, sinCosto: false },
];

export const initialProducts: Product[] = [
  {
    id: "gps-estandar-sin-telemetria",
    slug: "gps-estandar-sin-telemetria",
    nombreComercial: "GPS Estándar sin telemetría",
    modelo: "GTX3",
    categoria: "gps",
    descripcionCorta: "Ideal para cualquier unidad que no requiere botón de pánico ni accesorios adicionales.",
    descripcion: "Dispositivo de rastreo satelital básico con conectividad multi-carrier y reporte periódico.",
    queIncluye: ["Dispositivo GPS 4G", "Arnés de instalación", "SIM multi-operador", "Instalación estándar"],
    precioSinIvaCentavos: 399999, // $3,999.99
    imagenes: [],
    tiposUnidad: ["auto", "camioneta", "taxi", "moto"],
    objetivos: ["robo", "control"],
    esEquipoPrincipal: true,
    activo: true,
    orden: 1,
    revisarPrecio: false,
  },
  {
    id: "gps-basico-semi",
    slug: "gps-basico-semi",
    nombreComercial: "GPS Básico Semi",
    modelo: "GTX-Semi",
    categoria: "gps",
    descripcionCorta: "Recomendado para Taxis, Uber, Didi y vehículos de plataformas de transporte.",
    descripcion: "Localizador GPS diseñado para operación continua en vehículos de alquiler o transporte particular.",
    queIncluye: ["Equipo GPS 4G", "Botón de pánico", "SIM 4G", "Licencia anual con app"],
    precioSinIvaCentavos: 517718, // $5,177.18
    imagenes: [],
    tiposUnidad: ["taxi", "apps", "auto"],
    objetivos: ["robo", "control"],
    esEquipoPrincipal: true,
    activo: true,
    orden: 2,
    revisarPrecio: false,
  },
  {
    id: "gps-estandar",
    slug: "gps-estandar",
    nombreComercial: "GPS Estándar",
    modelo: "GTX-Std",
    categoria: "gps",
    descripcionCorta: "Para autos y camionetas particulares o de trabajo ligero.",
    descripcion: "Rastreo confiable con paro de motor remoto, alertas de velocidad y encendido.",
    queIncluye: ["Dispositivo GPS", "Relevador de paro de motor", "Instalación oculta", "SIM 4G"],
    precioSinIvaCentavos: 737700, // $7,377.00
    imagenes: [],
    tiposUnidad: ["auto", "camioneta"],
    objetivos: ["robo", "control"],
    esEquipoPrincipal: true,
    activo: true,
    orden: 3,
    revisarPrecio: true, // REGLA: marcar revisarPrecio en GPS Estándar
  },
  {
    id: "gps-motocicleta-y04g",
    slug: "gps-motocicleta-y04g",
    nombreComercial: "GPS Motocicleta Y04g",
    modelo: "Y04g",
    categoria: "gps",
    descripcionCorta: "GPS ultra compacto con consumo de energía mínimo para motocicletas de reparto.",
    descripcion: "Protección contra descargas de batería, resistente al agua y polvo (IP65).",
    queIncluye: ["GPS sellado impermeable", "Arnés con fusible", "Corte de corriente", "SIM 4G"],
    precioSinIvaCentavos: 737700, // $7,377.00
    imagenes: [],
    tiposUnidad: ["moto"],
    objetivos: ["robo"],
    esEquipoPrincipal: true,
    activo: true,
    orden: 4,
    revisarPrecio: false,
  },
  {
    id: "gps-portable-3d",
    slug: "gps-portable-3d",
    nombreComercial: "GPS Portable 3-D",
    modelo: "GL200-3D",
    categoria: "gps",
    descripcionCorta: "Equipo portátil con batería recargable para cajas secas y refrigeradas.",
    descripcion: "Sin cables de instalación requeridos, fijación magnética de alta adherencia.",
    queIncluye: ["Unidad GPS portátil", "Batería de larga duración (3 días continuos)", "Cargador", "SIM 4G"],
    precioSinIvaCentavos: 757700, // $7,577.00
    imagenes: [],
    tiposUnidad: ["caja_seca", "caja_refrigerada", "carga"],
    objetivos: ["robo", "carga"],
    esEquipoPrincipal: true,
    activo: true,
    orden: 5,
    revisarPrecio: false,
  },
  {
    id: "gps-intermedio",
    slug: "gps-intermedio",
    nombreComercial: "GPS Intermedio",
    modelo: "GTX-Int",
    categoria: "gps",
    descripcionCorta: "Para camiones de volteo, autobuses de pasajeros y transporte de personal.",
    descripcion: "Soporta vibraciones intensas y entradas análogas/digitales para sensores.",
    queIncluye: ["GPS de uso pesado", "Botón de pánico", "Antenas externas", "SIM 4G industrial"],
    precioSinIvaCentavos: 797700, // $7,977.00
    imagenes: [],
    tiposUnidad: ["camion", "volteo", "autobus"],
    objetivos: ["control", "robo"],
    esEquipoPrincipal: true,
    activo: true,
    orden: 6,
    revisarPrecio: false,
  },
  {
    id: "gps-maquinaria-pesada",
    slug: "gps-maquinaria-pesada",
    nombreComercial: "GPS Maquinaria Pesada",
    modelo: "GTX-Heavy",
    categoria: "gps",
    descripcionCorta: "Diseñado para retroexcavadoras, tractores y maquinaria de construcción.",
    descripcion: "Medición exacta de horómetros de motor, voltaje de batería y geocercas en obra.",
    queIncluye: ["Dispositivo reforzado IP67", "Sensor de encendido/horómetro", "Instalación blindada"],
    precioSinIvaCentavos: 817700, // $8,177.00
    imagenes: [],
    tiposUnidad: ["maquinaria"],
    objetivos: ["control", "robo"],
    esEquipoPrincipal: true,
    activo: true,
    orden: 7,
    revisarPrecio: false,
  },
  {
    id: "gps-caja",
    slug: "gps-caja",
    nombreComercial: "GPS Caja",
    modelo: "GTX-Caja",
    categoria: "gps",
    descripcionCorta: "Para cajas secas o refrigeradas fijas o en tránsito.",
    descripcion: "Detección de enganche/desenganche de tractocamión y monitoreo de batería propia.",
    queIncluye: ["Dispositivo GPS con batería de respaldo extendida", "Caja sellada IP67", "Instalación en chasis"],
    precioSinIvaCentavos: 837700, // $8,377.00
    imagenes: [],
    tiposUnidad: ["caja_seca", "caja_refrigerada"],
    objetivos: ["robo", "carga"],
    esEquipoPrincipal: true,
    activo: true,
    orden: 8,
    revisarPrecio: false,
  },
  {
    id: "gps-flotilla",
    slug: "gps-flotilla",
    nombreComercial: "GPS Flotilla",
    modelo: "GTX-Pro",
    categoria: "gps",
    descripcionCorta: "Para tractocamiones y transporte federal de carga.",
    descripcion: "Telemetría avanzada, compatible con sensores de combustible, anti-jammer y botón SOS.",
    queIncluye: ["GPS Profesional 4G", "Botón de pánico oculto", "Paro de motor seguro", "Instalación profesional"],
    precioSinIvaCentavos: 887700, // $8,877.00
    imagenes: [],
    tiposUnidad: ["tractocamion", "camion"],
    objetivos: ["robo", "control", "combustible"],
    esEquipoPrincipal: true,
    activo: true,
    orden: 9,
    revisarPrecio: false,
  },
  {
    id: "gps-portable-15d",
    slug: "gps-portable-15d",
    nombreComercial: "GPS Portable 15-D",
    modelo: "GL200-15D",
    categoria: "gps",
    descripcionCorta: "Localizador autónomo con batería de hasta 15 días continuos de transmisión.",
    descripcion: "Equipo para seguimiento encubierto de carga o contenedores sin fuente de poder.",
    queIncluye: ["GPS portátil", "Batería de 15 días", "Imanes de neodimio de uso rudo", "Cargador"],
    precioSinIvaCentavos: 987700, // $9,877.00
    imagenes: [],
    tiposUnidad: ["caja_seca", "caja_refrigerada", "carga"],
    objetivos: ["robo"],
    esEquipoPrincipal: true,
    activo: true,
    orden: 10,
    revisarPrecio: true, // REGLA: marcar revisarPrecio en GPS Portable 15-D
  },
  {
    id: "boton-panico",
    slug: "boton-panico",
    nombreComercial: "Botón de Pánico",
    modelo: "SOS-01",
    categoria: "accesorio",
    descripcionCorta: "Botón táctil oculto para alertas silenciosas a central de monitoreo.",
    descripcion: "Genera evento de emergencia prioritario visible en plataforma y vía notificación push.",
    queIncluye: ["Botón micro-switch con cableado blindado e integración"],
    precioSinIvaCentavos: 37500, // $375.00
    imagenes: [],
    esEquipoPrincipal: false,
    activo: true,
    orden: 20,
  },
  {
    id: "camara-externa-ip67",
    slug: "camara-externa-ip67",
    nombreComercial: "Cámara Externa Sellada IP67 (2 MP)",
    modelo: "CAM-EXT-IP67",
    categoria: "dashcam",
    descripcionCorta: "Cámara exterior de 2 megapíxeles para espejos laterales o reversa en DashCams.",
    descripcion: "Visión nocturna por infrarrojos y certificación IP67 contra agua a presión y polvo.",
    queIncluye: ["Cámara 2 MP", "Cable blindado de 5 m", "Soportes de montaje"],
    precioSinIvaCentavos: 95000, // $950.00
    imagenes: [],
    esEquipoPrincipal: false,
    activo: true,
    orden: 25,
  },
  {
    id: "microsd-256gb",
    slug: "microsd-256gb",
    nombreComercial: "MicroSD 256 GB Clase 10 de Alta Durabilidad",
    modelo: "SD-256-ENDURANCE",
    categoria: "accesorio",
    descripcionCorta: "Memoria especial para grabación continua 24/7 en DashCams vehiculares.",
    descripcion: "Resistencia térmica de -25°C a 85°C con ciclos de sobreescritura extendidos.",
    queIncluye: ["Tarjeta MicroSD 256 GB y adaptador"],
    precioSinIvaCentavos: 178000, // $1,780.00
    imagenes: [],
    esEquipoPrincipal: false,
    activo: true,
    orden: 31,
  },
  {
    id: "sensor-combustible-varilla-instalado",
    slug: "sensor-combustible-varilla-instalado",
    nombreComercial: "Sensor de Combustible de Varilla Instalado y Calibrado",
    modelo: "SNS-COMB-INS",
    categoria: "seguridad",
    descripcionCorta: "Solución completa llave en mano para control total de combustible.",
    descripcion: "Incluye barrenado seguro de tanque, colocación de varilla, sellado y calibración litro por litro.",
    queIncluye: ["Sensor digital de varilla", "Instalación en tanque", "Calibración matemática", "Garantía de sellado"],
    precioSinIvaCentavos: 860000, // $8,600.00
    imagenes: [],
    esEquipoPrincipal: false,
    activo: true,
    orden: 43,
  },
  {
    id: "dji-matrice-4e",
    slug: "dji-matrice-4e",
    nombreComercial: "Dron Empresarial de Mapeo",
    modelo: "DJI Matrice 4E",
    categoria: "dron",
    descripcionCorta: "Dron profesional para fotogrametría, topografía y mapeo de alta precisión.",
    descripcion: "Cámara mecánica de obturación rápida, sensor RTK centimétrico y autonomía de 45 minutos.",
    queIncluye: ["Aeronave DJI Matrice 4E", "Control remoto empresarial", "Baterías inteligentes", "Maletín rígido"],
    precioSinIvaCentavos: 0,
    imagenes: [],
    esEquipoPrincipal: true,
    activo: false, // REGLA: activo: false
    orden: 50,
  },
  {
    id: "dji-matrice-4t",
    slug: "dji-matrice-4t",
    nombreComercial: "Dron Empresarial Térmico",
    modelo: "DJI Matrice 4T",
    categoria: "dron",
    descripcionCorta: "Dron táctico para vigilancia nocturna, inspección térmica y búsqueda y rescate.",
    descripcion: "Equipado con cámara térmica de 640x512, zoom híbrido 56x y telémetro láser de 1,200 metros.",
    queIncluye: ["Aeronave DJI Matrice 4T", "Sensor térmico y visual", "Control enterprise", "Baterías"],
    precioSinIvaCentavos: 0,
    imagenes: [],
    esEquipoPrincipal: true,
    activo: false, // REGLA: activo: false
    orden: 51,
  },
];

export const initialPackages: Package[] = [
  {
    id: "gps-esencial",
    slug: "gps-esencial",
    nombre: "GPS Esencial",
    descripcion: "La solución indispensable de rastreo vehicular con garantía y soporte total.",
    items: [{ productId: "gps-estandar-sin-telemetria", cantidad: 1 }],
    precioSinIvaCentavos: 550000, // $5,500.00
    tiposUnidad: ["auto", "camioneta", "taxi", "moto"],
    objetivos: ["robo", "control"],
    queIncluye: [
      "GPS estándar nueva generación 4G (12–24 V)",
      "Plan de datos + licencia anual con app móvil",
      "Instalación profesional oculta",
      "Soporte técnico y garantía CoSoAVL",
    ],
    destacado: true,
    activo: true,
    revisarPrecio: true, // REGLA: revisarPrecio: true
  },
  {
    id: "gps-flotilla-pro",
    slug: "gps-flotilla-pro",
    nombre: "GPS Flotilla Pro",
    descripcion: "Monitoreo profesional para transporte de carga con telemetría y botón de pánico SOS.",
    items: [
      { productId: "gps-flotilla", cantidad: 1 },
      { productId: "boton-panico", cantidad: 1 },
    ],
    precioSinIvaCentavos: 828000, // $8,280.00 (Con IVA: $9,604.80)
    tiposUnidad: ["tractocamion", "camion", "volteo", "autobus"],
    objetivos: ["robo", "control"],
    queIncluye: [
      "GPS profesional 2G/3G/4G con telemetría de avanzada",
      "Datos + licencia multigestión para flotillas",
      "Botón de pánico SOS oculto",
      "Instalación técnica certificada",
      "Asistencia para recuperación de vehículos (ANERPV)",
    ],
    destacado: true,
    activo: true,
    revisarPrecio: false,
  },
  {
    id: "flotilla-pro-combustible",
    slug: "flotilla-pro-combustible",
    nombre: "Flotilla Pro + Combustible",
    descripcion: "La combinación líder para reducir pérdidas por robo de combustible y paradas no autorizadas.",
    items: [
      { productId: "gps-flotilla", cantidad: 1 },
      { productId: "boton-panico", cantidad: 1 },
      { productId: "sensor-combustible-varilla-instalado", cantidad: 1 },
    ],
    precioSinIvaCentavos: 1688000, // $16,880.00 (Con IVA: $19,580.80)
    tiposUnidad: ["tractocamion", "camion", "maquinaria"],
    objetivos: ["combustible", "robo", "control"],
    queIncluye: [
      "Todo lo incluido en paquete GPS Flotilla Pro",
      "Sensor de combustible de varilla instalado y calibrado",
      "Gráficas y alertas automáticas por caída brusca de nivel (ordeña)",
      "Soporte especializado para gestión de combustible",
    ],
    destacado: true,
    activo: true,
    revisarPrecio: false,
  },
  {
    id: "dashcam-esencial-jc181",
    slug: "dashcam-esencial-jc181",
    nombre: "DashCam Esencial (JC181)",
    descripcion: "Cámara inteligente de 2 lentes (cabina y carretera) con paro de motor y botón de pánico.",
    items: [{ productId: "camara-externa-ip67", cantidad: 1 }],
    precioSinIvaCentavos: 611000, // $6,110.00 (Con IVA: $7,087.60)
    tiposUnidad: ["auto", "camioneta", "taxi", "apps"],
    objetivos: ["video", "robo"],
    queIncluye: [
      "Cámara 2 lentes cabina y carretera con GPS integrado",
      "Paro de motor seguro y botón de pánico SOS",
      "Micrófono y bocina en cabina",
      "SIM 4G 1 mes cortesía (5 GB de transmisión)",
      "Licencia anual con almacenamiento en nube por 7 días",
      "Soporte técnico continuo",
    ],
    destacado: true,
    activo: true,
    revisarPrecio: false,
  },
  {
    id: "dashcam-industrial-jc450",
    slug: "dashcam-industrial-jc450",
    nombre: "DashCam Industrial (JC450)",
    descripcion: "Dashcam de grado industrial diseñada para tractocamiones y flotillas pesadas de alto rendimiento.",
    items: [],
    precioSinIvaCentavos: 1198000, // $11,980.00 (Con IVA: $13,896.80)
    tiposUnidad: ["tractocamion", "camion", "autobus"],
    objetivos: ["video", "control", "robo"],
    queIncluye: [
      "Cámara 2 lentes para flotillas industriales con GPS y paro de motor",
      "Paro de motor seguro y botón SOS",
      "Audio en cabina con bocina y micrófono de alta ganancia",
      "Instalación profesional certificada",
      "SIM 4G 1 mes cortesía (5 GB)",
      "Licencia anual con nube de 7 días y soporte CoSoAVL",
    ],
    destacado: true,
    activo: true,
    revisarPrecio: false,
  },
  {
    id: "dashcam-industrial-360",
    slug: "dashcam-industrial-360",
    nombre: "DashCam Industrial 360",
    descripcion: "Cobertura total 360° con 4 canales de video: frontal, cabina y dos externas selladas IP67.",
    items: [
      { productId: "camara-externa-ip67", cantidad: 2 },
      { productId: "microsd-256gb", cantidad: 1 },
    ],
    precioSinIvaCentavos: 1566000, // $15,660.00 (Con IVA: $18,165.60)
    tiposUnidad: ["tractocamion", "camion", "volteo"],
    objetivos: ["video", "control", "robo"],
    queIncluye: [
      "DashCam Industrial JC450 (cabina y carretera)",
      "2 cámaras externas selladas IP67 para puntos ciegos",
      "MicroSD 256 GB para grabación local 24/7",
      "Instalación profesional completa de los 4 canales",
      "Licencia anual con nube y soporte",
    ],
    destacado: true,
    activo: true,
    revisarPrecio: false,
  },
  {
    id: "anti-jammer",
    slug: "anti-jammer",
    nombre: "Anti-Jammer",
    descripcion: "Sistema de protección activa contra inhibidores de señal GPS (jammer) con bloqueo preventivo.",
    items: [],
    precioSinIvaCentavos: 357000, // $3,570.00 (Con IVA: $4,141.20)
    tiposUnidad: ["tractocamion", "camion", "camioneta", "auto"],
    objetivos: ["inhibidor", "robo"],
    queIncluye: [
      "Módulo detector de inhibición de RF / jammer",
      "Bloqueo automático e inmediato a marcha en caso de ataque",
      "Reconocimiento de operador por RFID",
      "Instalación técnica certificada y soporte",
    ],
    destacado: false,
    activo: true,
    revisarPrecio: false,
  },
];
