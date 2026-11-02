import { CartContacto, CartInstalacion, CartUnidadVehiculo, CartFactura } from "./cart";
import { CotizacionResultado } from "@/lib/pricing";

export type OrderEstado =
  | "pendiente_pago"
  | "pendiente_comprobante"
  | "comprobante_subido"
  | "comprobante_rechazado"
  | "pagado"
  | "anticipo_pagado"
  | "pago_rechazado"
  | "revision_manual"
  | "cancelado";

export type OrderMetodoPago = "mercadopago" | "spei";

export interface OrderItem {
  id: string;
  nombre: string;
  cantidad: number;
  precioSinIvaCentavos: number;
  totalSinIvaCentavos: number;
  esEquipoPrincipal: boolean;
}

export interface OrderPagoProgramado {
  id: string; // "P1", "P2", "P3"
  numero: number;
  concepto: string;
  montoCentavos: number;
  momento: "inmediato" | "al_instalar" | "mensualidad";
  fechaEstimada?: string;
  fechaProgramada?: string; // ISO date
  estado: "pendiente" | "aprobado" | "rechazado";
  preferenceId?: string; // ID en MP (Orden o Preferencia)
  orderMpId?: string; // ID de orden en Mercado Pago API de Orders (ej: ORD...)
  paymentId?: string;
  pagadoAt?: string;
  externalReference: string; // ej: "CT-1124451:P1"
}

export interface OrderComprobanteSpei {
  url: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  subidoAt: string;
  validadoAt?: string;
  validadoPor?: string; // email del administrador que validó
  motivoRechazo?: string;
  notasAdmin?: string;
}

export interface Order {
  id: string; // Folio ej: CT-1124451
  folio: string;
  cartId: string;
  tokenHash: string; // Hash SHA-256 del token seguro revocable
  estado: OrderEstado;
  metodoPago: OrderMetodoPago;
  planPago: string; // contado, credi_contado, enganche_mensualidades
  montoPrimerPagoCentavos: number;
  saldoRestanteCentavos: number;
  totalCentavos: number;
  items: OrderItem[];
  calculo?: CotizacionResultado;
  contacto: CartContacto;
  instalacion: CartInstalacion;
  unidades?: CartUnidadVehiculo[];
  factura?: CartFactura;
  pagos: OrderPagoProgramado[]; // Calendario granular por cuota
  comprobanteSpei?: OrderComprobanteSpei;
  mercadoPagoPaymentId?: string;
  mercadoPagoOrderId?: string;
  mercadoPagoPreferenceId?: string;
  metodoPagoDetalle?: string;
  motivoRevision?: string;
  motivoRechazo?: string;
  notas?: string;
  createdAt: string;
  updatedAt: string;
  pagadoAt?: string;
}
