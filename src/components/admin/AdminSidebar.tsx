"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PackageCheck,
  Sliders,
  Users,
  FileText,
  UserCheck,
  Truck,
  DollarSign,
  Layers,
  ShieldAlert,
} from "lucide-react";
import { UserRole } from "@/types/user";

interface AdminSidebarProps {
  currentRole: UserRole;
  onRoleChange?: (role: UserRole) => void;
}

export function AdminSidebar({ currentRole, onRoleChange }: AdminSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      roles: ["admin", "vendedor", "soporte"] as UserRole[],
    },
    {
      title: "Catálogo",
      href: "/admin/catalogo",
      icon: Layers,
      roles: ["admin", "vendedor"] as UserRole[],
      badge: currentRole === "vendedor" ? "Solo lectura" : undefined,
    },
    {
      title: "Precios y Reglas",
      href: "/admin/precios",
      icon: Sliders,
      roles: ["admin"] as UserRole[],
    },
    {
      title: "Usuarios y Roles",
      href: "/admin/usuarios",
      icon: Users,
      roles: ["admin"] as UserRole[],
    },
    {
      title: "Cotizaciones (Fase 4)",
      href: "/admin/cotizaciones",
      icon: FileText,
      roles: ["admin", "vendedor"] as UserRole[],
      disabled: true,
    },
    {
      title: "Clientes (Fase 4)",
      href: "/admin/clientes",
      icon: UserCheck,
      roles: ["admin", "vendedor"] as UserRole[],
      disabled: true,
    },
    {
      title: "Pedidos (Fase 3)",
      href: "/admin/pedidos",
      icon: DollarSign,
      roles: ["admin", "soporte"] as UserRole[],
      disabled: true,
    },
    {
      title: "Instalaciones (Fase 3)",
      href: "/admin/instalaciones",
      icon: Truck,
      roles: ["admin", "soporte"] as UserRole[],
      disabled: true,
    },
  ];

  return (
    <aside className="w-64 bg-[#4A0C18] text-white flex flex-col min-h-screen shrink-0 border-r border-[#7A1428]/40 shadow-xl">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#7A1428]/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#7A1428] flex items-center justify-center font-bold text-white border border-[#C9A15B]/50 shadow-inner">
            C
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              Coso<span className="text-[#C9A15B]">Tec</span>
            </h1>
            <p className="text-[10px] uppercase tracking-wider text-[#C9A15B] font-semibold">
              by CoSoAVL
            </p>
          </div>
        </div>
      </div>

      {/* Role Switcher (SOLO en entorno de desarrollo local NODE_ENV=development) */}
      {process.env.NODE_ENV === "development" && (
        <div className="p-4 bg-black/20 mx-3 my-3 rounded-lg border border-white/5">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] uppercase tracking-wider text-gray-300 font-medium block">
              Simulador de Rol (Dev)
            </label>
            <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/30 text-amber-300 font-mono">
              DEV ONLY
            </span>
          </div>
          <select
            value={currentRole}
            onChange={(e) => onRoleChange?.(e.target.value as UserRole)}
            className="w-full bg-[#1C1C1E] text-xs text-white border border-white/20 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#C9A15B]"
          >
            <option value="admin">Administrador (Total)</option>
            <option value="vendedor">Vendedor (Catálogo protegido)</option>
            <option value="soporte">Soporte (Instalaciones)</option>
          </select>
          {currentRole === "vendedor" && (
            <p className="text-[11px] text-amber-300 mt-1.5 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 shrink-0" />
              No puede editar precios ni catálogo
            </p>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const isAllowed = item.roles.includes(currentRole);
          const isActive = pathname === item.href;

          if (!isAllowed) {
            return (
              <div
                key={item.href}
                className="flex items-center justify-between px-3 py-2 text-xs text-white/30 rounded-lg cursor-not-allowed select-none"
                title="Acceso restringido para este rol"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 opacity-40" />
                  <span>{item.title}</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/30 text-white/40">
                  Bloqueado
                </span>
              </div>
            );
          }

          if (item.disabled) {
            return (
              <div
                key={item.href}
                className="flex items-center justify-between px-3 py-2 text-xs text-white/40 rounded-lg select-none cursor-default"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 opacity-40" />
                  <span>{item.title}</span>
                </div>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-lg transition-colors ${
                isActive
                  ? "bg-[#7A1428] text-white shadow-md border-l-4 border-[#C9A15B]"
                  : "text-gray-200 hover:bg-white/10 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-4 h-4 ${isActive ? "text-[#C9A15B]" : "text-gray-300"}`} />
                <span>{item.title}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-normal">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-[#7A1428]/40 text-[11px] text-gray-400">
        <p className="font-semibold text-gray-300">Proyecto Firebase: cosoteco</p>
        <p className="text-[10px] text-gray-400">Metepec, Edomex</p>
      </div>
    </aside>
  );
}

