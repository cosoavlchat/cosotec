import { CotizacionResultado } from "@/lib/pricing";

export interface ItemSnapshot {
  id: string;
  nombre: string;
  modelo?: string;
  categoria: string;
  precioSinIvaCentavos: number;
  cantidad: number;
  esEquipoPrincipal: boolean;
  incluyeInstalacion?: boolean;
  incluyePlanPrimerAnio?: boolean;
}

export interface QuoteCustomer {
  nombre?: string;
  telefono: string;
  correo?: string;
  empresa?: string;
}

export interface Quote {
  id: string; // Folio, ej. "CT-1124451"
  folio: string; // Mismo que id: "CT-1124451"
  tokenHash: string; // Hash SHA-256 del token revocable (el token plano nunca se persiste)
  token?: string; // Token plano temporal tras emitir o regenerar
  tokenRegeneradoAt?: string;
  cliente: QuoteCustomer;
  items: ItemSnapshot[];
  estadoInstalacion?: {
    clave: string;
    nombre: string;
  };
  calculo: CotizacionResultado;
  snapshotPrecios: {
    fecha: string;
    ivaPorcentaje: number;
    descuentoVolumenPorcentaje: number;
    items: ItemSnapshot[];
  };
  origen: "web_asistente" | "carrito" | "vendedor" | "chatbot";
  vendedorId?: string;
  vendedorNombre?: string;
  estado: "borrador" | "emitida" | "aceptada" | "vencida" | "pagada";
  createdAt: string;
  vigenciaDias: number;
  venceAt: string;
  urlPublica: string; // "/c/CT-1124451?t=<token>"
}
