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
}

export function AdminSidebar({ currentRole }: AdminSidebarProps) {
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
      <div className="p-5 border-b border-[#7A1428]/50">
        <Link href="/admin" className="flex items-center justify-center py-2 px-3 group" aria-label="CosoTec Admin Dashboard">
          <div className="relative inline-block">
            <div
              className="absolute -inset-x-4 -inset-y-2 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0.65)_45%,rgba(255,255,255,0.15)_70%,transparent_90%)] blur-sm pointer-events-none rounded-full"
              aria-hidden="true"
            />
            <img
              src="/logo-cosotec.png"
              alt="CosoTec by CoSoAVL"
              className="relative z-10 h-9 w-auto object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
              width={160}
              height={36}
            />
          </div>
        </Link>
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
  );
}

