import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { UserRole } from "@/types/user";

export interface AuthenticatedUser {
  uid: string;
  email: string;
  role: UserRole;
}

export type AuthResult =
  | { success: true; user: AuthenticatedUser }
  | { success: false; response: NextResponse };

/**
 * Valida el Firebase Auth ID Token y verifica que el Custom Claim `role`
 * coincida con los roles autorizados.
 */
export async function authenticateServerRequest(
  req: NextRequest,
  allowedRoles?: UserRole[]
): Promise<AuthResult> {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "No autorizado: Token de autenticación ausente" },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.split("Bearer ")[1].trim();

  // Soporte para tests unitarios automatizados (solo activo cuando NODE_ENV === 'test')
  if (process.env.NODE_ENV === "test") {
    if (token === "test-token-admin") {
      const user: AuthenticatedUser = { uid: "test-admin-uid", email: "admin@cosoavl.com", role: "admin" };
      if (allowedRoles && !allowedRoles.includes(user.role)) {
        return {
          success: false,
          response: NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 }),
        };
      }
      return { success: true, user };
    }

    if (token === "test-token-vendedor") {
      const user: AuthenticatedUser = { uid: "test-vendedor-uid", email: "vendedor@cosoavl.com", role: "vendedor" };
      if (allowedRoles && !allowedRoles.includes(user.role)) {
        return {
          success: false,
          response: NextResponse.json({ error: "Permisos insuficientes: rol 'vendedor' no autorizado" }, { status: 403 }),
        };
      }
      return { success: true, user };
    }

    if (token === "test-token-invalid") {
      return {
        success: false,
        response: NextResponse.json({ error: "Token inválido" }, { status: 401 }),
      };
    }
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const role = (decoded.role as UserRole) || ("vendedor" as UserRole);

    if (allowedRoles && !allowedRoles.includes(role)) {
      return {
        success: false,
        response: NextResponse.json(
          { error: `Acceso denegado: el rol '${role}' no tiene permisos para esta acción.` },
          { status: 403 }
        ),
      };
    }

    return {
      success: true,
      user: {
        uid: decoded.uid,
        email: decoded.email || "",
        role,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Token de autenticación inválido o expirado", details: error.message },
        { status: 401 }
      ),
    };
  }
}

