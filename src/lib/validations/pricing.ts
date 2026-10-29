import { z } from "zod";

export const PricingSettingsSchema = z.object({
  ivaPorcentaje: z.number().min(0).max(100),
  descuentoVolumen: z.object({
    umbralUnidades: z.number().int().positive(),
    porcentaje: z.number().min(0).max(100),
  }),
  topeDescuentoVendedor: z.number().min(0).max(100),
  planesPago: z.array(z.string()).min(1),
  msi: z.array(z.number().int().positive()),
  comisionMsiAbsorbe: z.boolean(),
  vigenciaDias: z.number().int().positive(),
  ciudadesSinCosto: z.array(z.string()),
});

export const TravelFeeSchema = z.object({
  estadoNombre: z.string().min(2),
  claveInegi: z.string().min(2).max(5),
  montoPorVisitaCentavos: z.number().int().nonnegative(),
  montoPorUnidadCentavos: z.number().int().nonnegative(),
  sinCosto: z.boolean(),
  notas: z.string().optional(),
});

