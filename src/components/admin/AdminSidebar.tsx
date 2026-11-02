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
  X,
} from "lucide-react";
import { UserRole } from "@/types/user";

interface AdminSidebarProps {
  currentRole: UserRole;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function AdminSidebar({
  currentRole,
  mobileOpen = false,
  onCloseMobile,
}: AdminSidebarProps) {
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
      title: "Cotizaciones",
      href: "/admin/cotizaciones",
      icon: FileText,
      roles: ["admin", "vendedor"] as UserRole[],
    },
    {
      title: "Clientes",
      href: "/admin/clientes",
      icon: UserCheck,
      roles: ["admin", "vendedor"] as UserRole[],
    },
    {
      title: "Pedidos y SPEI",
      href: "/admin/pedidos",
      icon: DollarSign,
      roles: ["admin", "soporte"] as UserRole[],
      badge: "SPEI & MP",
    },
    {
      title: "Instalaciones",
      href: "/admin/instalaciones",
      icon: Truck,
      roles: ["admin", "soporte"] as UserRole[],
      disabled: true,
    },
  ];

  return (
    <>
      {/* Backdrop en móvil */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`${
          mobileOpen ? "fixed inset-y-0 left-0 z-50 flex" : "hidden md:flex"
        } w-64 bg-[#4A0C18] text-white flex-col min-h-screen shrink-0 border-r border-[#7A1428]/40 shadow-xl transition-all`}
      >
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b border-[#7A1428]/50 flex items-center justify-between">
          <Link
            href="/admin"
            onClick={onCloseMobile}
            className="flex items-center justify-center py-2 px-3 group flex-1"
            aria-label="CosoTec Admin Dashboard"
          >
            <div className="relative inline-block">
              <div
                className="absolute -inset-x-4 -inset-y-2 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0.65)_45%,rgba(255,255,255,0.15)_70%,transparent_90%)] blur-sm pointer-events-none rounded-full"
                aria-hidden="true"
              />
              <img
                src="/logo-cosotec.png"
                alt="CosoTec by CoSoAVL"
                className="relative z-10 h-8 sm:h-9 w-auto object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                width={160}
                height={36}
              />
            </div>
          </Link>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

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
                onClick={onCloseMobile}
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
          <p className="font-semibold text-gray-300">Proyecto Firebase: cosotec7</p>
          <p className="text-[10px] text-gray-400">Metepec, Edomex</p>
        </div>
      </aside>
    </>
  );
}

