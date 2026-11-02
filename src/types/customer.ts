export interface Customer {
  id: string; // Document ID
  nombre: string;
  empresa?: string;
  whatsapp: string; // 10 dígitos normalizados (ej. "7224322053")
  whatsappDisplay?: string; // Formateado (ej. "722 432 2053")
  correo?: string;
  rfc?: string;
  direccion?: {
    calle?: string;
    colonia?: string;
    municipio?: string;
    estado?: string;
    cp?: string;
  };
  vendedorId: string; // uid de Firebase Auth
  vendedorNombre: string;
  vendedorEmail: string;
  totalCotizaciones: number;
  totalVendidoCentavos: number;
  reasignacionSolicitada?: {
    vendedorSolicitanteId: string;
    vendedorSolicitanteNombre: string;
    vendedorSolicitanteEmail: string;
    fecha: string;
    motivo?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CustomerInput {
  nombre: string;
  empresa?: string;
  whatsapp: string;
  correo?: string;
  rfc?: string;
  direccion?: {
    calle?: string;
    colonia?: string;
    municipio?: string;
    estado?: string;
    cp?: string;
  };
}
