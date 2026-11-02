export interface PricingSettings {
  ivaPorcentaje: number; // Por defecto 16
  descuentoVolumen: {
    umbralUnidades: number; // Por defecto 5 (al comprar más de 5 unidades)
    porcentaje: number; // Por defecto 10 (10%)
  };
  topeDescuentoVendedor: number; // Por defecto 5%
  planesPago: string[]; // ["contado", "credi_contado", "enganche_mensualidades", "msi"]
  msi: number[]; // [3, 6, 9, 12]
  comisionMsiAbsorbe: boolean; // true si CosoTec absorbe la comisión bancaria
  vigenciaDias: number; // Días de validez de la cotización (por defecto 15)
  ciudadesSinCosto: string[]; // ["Toluca", "Metepec", "CDMX", "Monterrey", "Guadalajara", "Querétaro"]
  instalacionAccesorioConEquipo?: boolean; // false por defecto (no cobrar instalación de accesorio si hay equipo principal con instalación)
}

export interface TravelFee {
  id: string; // claveInegi (ej: "MEX", "CDMX", "NLE", etc.)
  estadoNombre: string;
  claveInegi: string;
  montoPorVisitaCentavos: number;
  montoPorUnidadCentavos: number;
  sinCosto: boolean;
  notas?: string;
  updatedAt?: string;
}

export interface BankSettings {
  banco: string;
  titular: string;
  clabe: string;
  cuenta?: string;
  convenio?: string;
  esPrueba: boolean; // Candado: true mientras sean datos de prueba
}

export interface ContactSettings {
  telefonos: string[];
  whatsapp: string;
  correo: string;
  direccion: string;
  horarios: string;
}

