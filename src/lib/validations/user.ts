import { z } from "zod";

export const UserRoleSchema = z.enum(["admin", "vendedor", "soporte"]);

export const CreateUserSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  role: UserRoleSchema,
  topeDescuento: z.number().min(0).max(100).optional(),
});

export const UpdateRoleSchema = z.object({
  uid: z.string().min(1),
  role: UserRoleSchema,
  activo: z.boolean().optional(),
  topeDescuento: z.number().min(0).max(100).optional(),
});

