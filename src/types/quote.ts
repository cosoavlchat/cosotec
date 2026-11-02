import { CotizacionResultado } from "@/lib/pricing";

export type QuoteStatus =
  | "borrador"
  | "pendiente_autorizacion"
  | "enviada"
  | "emitida"
  | "vista"
  | "pagada_parcial"
  | "pagada"
  | "vencida"
  | "cancelada";

export interface ItemSnapshot {
  id: string;
  nombre: string;
  modelo?: string;
  modeloConfirmado?: boolean; // Solo se imprime el modelo en PDF si es true
  categoria: string;
  fotoUrl?: string;
  queIncluye?: string[]; // Viñetas oficiales del producto
  precioSinIvaCentavos: number;
  cantidad: number;
  esEquipoPrincipal: boolean;
  incluyeInstalacion?: boolean;
  incluyePlanPrimerAnio?: boolean;
  esConceptoLibre?: boolean; // Servicio especial manual
  descripcionConceptoLibre?: string;
  advertenciaCompatibilidad?: string; // Ej. "JC450 requiere memoria microSD"
  esInstalacionAgregada?: boolean; // Renglón de mano de obra/instalación agregado automáticamente
}

export interface QuoteCustomer {
  id?: string; // ID en customers
  nombre?: string;
  telefono: string; // WhatsApp
  whatsappDisplay?: string;
  correo?: string;
  empresa?: string;
  rfc?: string;
}

export interface Quote {
  id: string; // Mismo que folio, ej. "CT-1124451" o "CT-1124451-v2"
  folio: string; // Folio de la versión
  folioRaiz?: string; // "CT-1124451" (sin -v2)
  version?: number; // 1, 2, 3...
  esVersionActiva?: boolean; // Solo la última es true
  versionMasRecienteFolio?: string;
  esPrueba?: boolean; // REGLA: Cotizaciones de prueba excluídas de métricas oficiales

  tokenHash: string; // Hash HMAC-SHA256 del token revocable
  token?: string; // Token plano temporal
  tokenRegeneradoAt?: string;

  cliente: QuoteCustomer;
  items: ItemSnapshot[];

  // Soporte retrocompatible
  estadoInstalacion?: {
    clave: string;
    nombre: string;
  };

  instalacion?: {
    estadoClave: string; // "MEX", "CDMX", "NL"...
    estadoNombre: string;
    municipio: string;
    esSinCosto: boolean;
    viaticosManualCentavos?: number; // Captura manual del vendedor si "se cotiza"
  };

  condiciones?: {
    planSeleccionado: "contado" | "credi_contado" | "enganche_mensualidades" | "msi";
    msiPlazoSeleccionado?: number;
    descuentoAdicionalPorcentaje: number;
    solicitoExcesoDescuento?: boolean;
    justificacionDescuento?: string;
    aprobadoPorAdminId?: string;
    aprobadoPorAdminEmail?: string;
    aprobadoFecha?: string;
    motivoRechazo?: string;
    vigenciaDias: number;
    fechaVencimiento: string; // ISO 8601
    notasCliente?: string; // Aparece en PDF y web pública
    notasInternas?: string; // Solo en admin (NUNCA en PDF ni cliente)
  };

  calculo: CotizacionResultado;

  // Snapshot inmutable para el checkout
  snapshotPrecios: {
    fecha: string;
    ivaPorcentaje: number;
    descuentoVolumenPorcentaje: number;
    descuentoAdicionalPorcentaje?: number;
    viaticosCentavos?: number;
    totalCentavos?: number;
    items: ItemSnapshot[];
  };

  origen: "web_asistente" | "carrito" | "vendedor" | "admin" | "chatbot";
  vendedorId?: string;
  vendedorNombre?: string;
  vendedorEmail?: string;
  vendedorWhatsapp?: string;

  estado: QuoteStatus;

  // Seguimiento de Privacidad (SIN IP ni User Agent)
  vecesVista?: number;
  fechaPrimeraVista?: string;
  fechaUltimaVista?: string;

  // Pagos y Enlace
  pagosRegistrados?: Array<{
    id: string;
    pagoNumero: number;
    montoCentavos: number;
    metodo: "spei" | "mercadopago";
    fecha: string;
    status: "aprobado" | "pendiente";
  }>;
  saldoPendienteCentavos?: number;
  ordenIdResultante?: string;

  createdAt: string;
  updatedAt?: string;
  venceAt: string;
  vigenciaDias?: number;
  urlPublica: string; // "/c/CT-1124451?t=<token>"
}
