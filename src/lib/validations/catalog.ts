import { z } from "zod";

export const CostRecurrenteSchema = z.object({
  concepto: z.string().min(1, "El concepto es obligatorio"),
  montoCentavos: z.number().int().nonnegative("El monto debe ser un entero no negativo en centavos"),
  periodo: z.enum(["mensual", "anual"]),
});

export const ProductSchema = z.object({
  slug: z.string().min(2, "El slug debe tener al menos 2 caracteres").regex(/^[a-z0-9-]+$/, "Slug inválido (solo minúsculas, números y guiones)"),
  nombreComercial: z.string().min(2, "El nombre comercial es obligatorio"),
  modelo: z.string().default(""),
  categoria: z.enum(["gps", "dashcam", "seguridad", "accesorio", "dron", "servicio"]),
  descripcionCorta: z.string().default(""),
  descripcion: z.string().default(""),
  queIncluye: z.array(z.string()).default([]),
  precioSinIvaCentavos: z.number().int().nonnegative("El precio sin IVA debe ser un entero no negativo en centavos"),
  imagenes: z.array(z.string().url("URL de imagen inválida")).default([]),
  fichaTecnica: z.record(z.string(), z.string()).optional(),
  tiposUnidad: z.array(z.string()).default([]),
  objetivos: z.array(z.string()).default([]),
  accesoriosSugeridos: z.array(z.string()).default([]),
  requiere: z.array(z.string()).default([]),
  recurrentes: z.array(CostRecurrenteSchema).default([]),
  esEquipoPrincipal: z.boolean().default(false),
  activo: z.boolean().default(true),
  orden: z.number().int().default(0),
  revisarPrecio: z.boolean().default(false),
});

export const PackageItemSchema = z.object({
  productId: z.string().min(1, "productId es requerido"),
  cantidad: z.number().int().positive("La cantidad debe ser mayor a 0"),
});

export const PackageSchema = z.object({
  slug: z.string().min(2, "El slug debe tener al menos 2 caracteres").regex(/^[a-z0-9-]+$/, "Slug inválido"),
  nombre: z.string().min(2, "El nombre del paquete es obligatorio"),
  descripcion: z.string().default(""),
  items: z.array(PackageItemSchema).min(1, "El paquete debe incluir al menos un producto"),
  precioSinIvaCentavos: z.number().int().nonnegative("El precio sin IVA debe ser entero en centavos"),
  tiposUnidad: z.array(z.string()).default([]),
  objetivos: z.array(z.string()).default([]),
  queIncluye: z.array(z.string()).default([]),
  destacado: z.boolean().default(false),
  activo: z.boolean().default(true),
  revisarPrecio: z.boolean().default(false),
});
