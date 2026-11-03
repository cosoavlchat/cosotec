import { CotizacionResultado } from "@/lib/pricing";

export type CartStep = 1 | 2 | 3 | 4 | 5;

export interface CartItem {
  id: string; // slug del producto o paquete
  tipo: "producto" | "paquete";
  nombre: string;
  categoria: string;
  precioSinIvaCentavos: number;
  cantidad: number;
  esEquipoPrincipal: boolean;
  incluyeInstalacion?: boolean;
  incluyePlanPrimerAnio?: boolean;
  grupoId?: string; // ID de agrupación si pertenece a un nivel de solución
  grupoNombre?: string; // Título legible del nivel de solución
}

export interface CartContacto {
  nombre?: string;
  telefono?: string; // Formato E.164 (+52XXXXXXXXXX) o 10 dígitos
  correo?: string;
  empresa?: string;
}

export interface CartInstalacion {
  estadoClave?: string; // ej. "CDMX", "MEX", "VER"
  estadoNombre?: string;
  municipio?: string;
  direccion?: string;
  tipoLugar?: "domicilio" | "taller_cosoavl";
  fechaTentativa?: string; // YYYY-MM-DD
  horarioTentativo?: "manana" | "tarde" | "completo";
  referencias?: string;
  viaticosPorConfirmar?: boolean;
  viaticosCentavos?: number;
}

export interface CartUnidadVehiculo {
  id: string;
  equipoIndex: number;
  equipoNombre: string;
  tipoVehiculo?: string; // ej: "auto", "camioneta", "tractocamion", "moto", "caja_seca"
  vin?: string; // Número de Identificación Vehicular (opcional)
  placas?: string;
  marca?: string;
  modelo?: string;
  anio?: string;
  color?: string;
  numeroEconomico?: string;
}

export interface CartFactura {
  requiereFactura: boolean;
  rfc?: string;
  razonSocial?: string;
  regimenFiscal?: string;
  usoCfdi?: string;
  codigoPostalFiscal?: string;
  correoFiscal?: string;
}

export interface CartPago {
  planSeleccionado: "contado" | "credi_contado" | "enganche_mensualidades" | string;
  metodoSeleccionado?: "mercadopago" | "spei";
}

export interface Cart {
  id: string; // Criptográfico aleatorio no adivinable (crypto.randomBytes(24).toString("base64url"))
  pasoActual: CartStep;
  estado: "activo" | "abandonado" | "convertido";
  items: CartItem[];
  contacto?: CartContacto;
  instalacion?: CartInstalacion;
  unidades?: CartUnidadVehiculo[];
  factura?: CartFactura;
  pago?: CartPago;
  calculo?: CotizacionResultado;
  quoteFolio?: string;
  isQuoteSnapshot?: boolean; // Inmutable si proviene de una cotización de vendedor emitida
  orderFolio?: string;
  createdAt: string;
  updatedAt: string;
  abandonedAt?: string;
  userAgent?: string;
}
