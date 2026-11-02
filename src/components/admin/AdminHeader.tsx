"use client";

import { UserRole } from "@/types/user";
import { ShieldCheck, ShieldAlert, LogOut, Menu } from "lucide-react";

interface AdminHeaderProps {
  currentRole: UserRole;
  userEmail?: string;
  onLogout?: () => void;
  onToggleMobileMenu?: () => void;
}

export function AdminHeader({
  currentRole,
  userEmail = "admin@cosoavl.com",
  onLogout,
  onToggleMobileMenu,
}: AdminHeaderProps) {
  const roleBadges: Record<UserRole, { label: string; color: string; bg: string }> = {
    admin: { label: "Administrador", color: "text-[#C9A15B]", bg: "bg-[#7A1428]" },
    vendedor: { label: "Vendedor", color: "text-blue-300", bg: "bg-blue-900/60" },
    soporte: { label: "Soporte Técnico", color: "text-emerald-300", bg: "bg-emerald-900/60" },
  };

  const badge = roleBadges[currentRole] || roleBadges.admin;

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-gray-200 px-4 sm:px-8 flex items-center justify-between shrink-0 shadow-xs">
      <div className="flex items-center gap-2.5">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 -ml-1 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <h2 className="text-xs sm:text-sm font-bold text-gray-800 truncate">Panel CosoTec</h2>
        <span className="hidden sm:inline text-gray-300">•</span>
        <span className="hidden sm:inline text-xs text-gray-500">Módulos Administrativos</span>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Role badge */}
        <div className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold ${badge.bg} ${badge.color}`}>
          {currentRole === "admin" ? (
            <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          ) : (
            <ShieldAlert className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          )}
          <span>{badge.label}</span>
        </div>

        {/* User Info */}
        <div className="hidden sm:flex items-center gap-2 border-l border-gray-200 pl-4 text-xs text-gray-700">
          <span className="font-medium text-gray-900">{userEmail}</span>
        </div>

        {/* Logout button */}
        {onLogout && (
          <button
            onClick={onLogout}
            title="Cerrar sesión"
            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}

