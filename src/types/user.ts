export type UserRole = "admin" | "vendedor" | "soporte";

export interface AppUser {
  uid: string;
  email: string;
  nombre?: string;
  whatsapp?: string; // Número de WhatsApp oficial del vendedor a 10 dígitos
  role: UserRole;
  activo: boolean;
  topeDescuento?: number; // Porcentaje tope (ej. 5 = 5%)
  createdAt?: string;
  lastLogin?: string;
}

export interface AuthSession {
  user: AppUser | null;
  role: UserRole | null;
  token?: string;
}

