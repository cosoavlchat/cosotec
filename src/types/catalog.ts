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
  revisarPrecio?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

