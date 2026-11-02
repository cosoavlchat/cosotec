"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminAuthProvider, useAdminAuth } from "@/lib/auth/admin-auth-context";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ShieldAlert, Loader2, ArrowLeft } from "lucide-react";
import { UserRole } from "@/types/user";

// Matriz de permisos de páginas administrativas
const pageRolePermissions: Record<string, UserRole[]> = {
  "/admin": ["admin", "vendedor", "soporte"],
  "/admin/cotizaciones": ["admin", "vendedor"],
  "/admin/cotizaciones/nueva": ["admin", "vendedor"],
  "/admin/clientes": ["admin", "vendedor"],
  "/admin/catalogo": ["admin", "vendedor"],
  "/admin/pedidos": ["admin", "soporte"],
  "/admin/precios": ["admin"],
  "/admin/usuarios": ["admin"],
};

function AdminGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, loading, logout } = useAdminAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Si estamos en la página de login, no aplicar layout administrativo ni guard
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (!loading && !user && !isLoginPage) {
      router.replace("/admin/login");
    }
  }, [loading, user, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  // 1. Cargador mientras Firebase Auth resuelve el estado de sesión
  if (loading) {
    return (
      <div className="min-h-screen bg-[#4A0C18] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
          <img
            src="/logo-cosotec.png"
            alt="CosoTec"
            className="h-10 w-auto object-contain brightness-110 drop-shadow-md"
            width={160}
            height={40}
          />
          <div className="flex items-center gap-2 text-white/90 text-sm font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-[#C9A15B]" />
            <span>Verificando credenciales de acceso...</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Si no hay usuario autenticado o no tiene rol válido, redirigir
  if (!user || !role) {
    return (
      <div className="min-h-screen bg-[#4A0C18] flex items-center justify-center">
        <p className="text-white text-sm">Redirigiendo a inicio de sesión...</p>
      </div>
    );
  }

  // 3. Verificación de permisos por ruta específica
  const allowedRoles = pageRolePermissions[pathname] || (pathname.startsWith("/admin/cotizaciones") ? ["admin", "vendedor"] : ["admin"]);
  const hasAccess = allowedRoles.includes(role);

  if (!hasAccess) {
    return (
      <div className="flex h-screen bg-[#F5F3F2] overflow-hidden">
        <AdminSidebar currentRole={role} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <AdminHeader currentRole={role} userEmail={user.email || ""} onLogout={logout} />
          <main className="flex-1 overflow-y-auto p-8 flex items-center justify-center">
            <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 p-8 shadow-sm text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-gray-900">Sin acceso a este módulo</h2>
              <p className="text-xs text-gray-600 leading-relaxed">
                Tu cuenta con rol <strong className="text-gray-900 uppercase">'{role}'</strong> no tiene autorización para acceder a la pantalla <code>{pathname}</code>.
              </p>
              <button
                onClick={() => router.push("/admin")}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#7A1428] text-white text-xs font-bold rounded-xl hover:bg-[#4A0C18] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver al Dashboard</span>
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // 4. Renderizado del panel con sesión válida
  return (
    <div className="flex h-screen bg-[#F5F3F2] overflow-hidden">
      <AdminSidebar
        currentRole={role}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader
          currentRole={role}
          userEmail={user.email || ""}
          onLogout={logout}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminGuard>{children}</AdminGuard>
    </AdminAuthProvider>
  );
}
