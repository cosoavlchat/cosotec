export type ProductCategory =
  | "gps"
  | "dashcam"
  | "seguridad"
  | "accesorio"
  | "dron"
  | "servicio";

export interface CostRecurrente {
  concepto: string;
  montoCentavos: number;
  periodo: "mensual" | "anual";
}

export interface Product {
  id: string; // Mismo que slug
  slug: string;
  nombreComercial: string;
  modelo: string;
  modeloConfirmado?: boolean; // Solo JC181, JC450 y Y04g están confirmados; el resto se oculta al público
  categoria: ProductCategory;
  descripcionCorta: string;
  descripcion: string;
  queIncluye: string[];
  precioSinIvaCentavos: number; // REGLA: Entero en centavos
  imagenes: string[];
  fichaTecnica?: Record<string, string>;
  tiposUnidad?: string[];
  objetivos?: string[];
  accesoriosSugeridos?: string[];
  requiere?: string[];
  recurrentes?: CostRecurrente[];
  esEquipoPrincipal: boolean;
  activo: boolean;
  visibleEnTienda?: boolean; // false para conceptos internos y servicios que no se muestran en tienda pública
  incluyeInstalacion?: boolean; // true si incluye instalación; false si se agrega servicio adicional
  incluyePlanPrimerAnio?: boolean; // true si incluye plataforma y SIM por 12 meses
  servicioInstalacionId?: string; // ID del producto de instalación (ej. "instalacion-suelta")
  orden: number;
  revisarPrecio?: boolean; // Inconsistencias pendientes de confirmación del cliente
  createdAt?: string;
  updatedAt?: string;
}

export interface PackageItem {
  productId: string;
  cantidad: number;
}

export interface Package {
  id: string; // Mismo que slug
  slug: string;
  nombre: string;
  descripcion: string;
  items: PackageItem[];
  precioSinIvaCentavos: number; // REGLA: Entero en centavos
  tiposUnidad?: string[];
  objetivos?: string[];
  queIncluye?: string[];
  destacado: boolean;
  activo: boolean;
  incluyeInstalacion?: boolean; // true en paquetes listos
  incluyePlanPrimerAnio?: boolean; // true en paquetes listos
  revisarPrecio?: boolean;
  imagenes?: string[];
  createdAt?: string;
  updatedAt?: string;
}

