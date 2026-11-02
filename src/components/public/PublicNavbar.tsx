"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Phone,
  MessageCircle,
  Shield,
  ChevronDown,
  Layers,
  MapPin,
  ExternalLink,
  ShoppingBag,
} from "lucide-react";
import { buildWhatsAppLink, WHATSAPP_DISPLAY, TELEFONO_MATRIZ } from "@/lib/utils/whatsapp";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { useCart } from "@/context/CartContext";

export function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { items } = useCart();
  const cartCount = items?.reduce((sum, it) => sum + it.cantidad, 0) || 0;

  const whatsappQuoteUrl = buildWhatsAppLink({
    pagina: pathname,
    tipoConsulta: "cotizacion",
  });

  const handleCtaClick = () => {
    trackAnalyticsEvent("Contact", { method: "navbar_quote_cta", page: pathname });
  };

  const navLinks = [
    { name: "Inicio", href: "/" },
    { name: "Soluciones", href: "/soluciones/auto-camioneta" },
    { name: "Tienda", href: "/tienda" },
    { name: "Paquetes", href: "/paquetes" },
    { name: "Instalación", href: "/instalacion" },
    { name: "Nosotros", href: "/nosotros" },
    { name: "Acceso Clientes", href: "/acceso" },
    { name: "Contacto", href: "/contacto" },
  ];

  return (
    <>
      {/* Top Banner Informativo */}
      <div className="bg-[#4A0C18] text-white py-1.5 px-4 text-[11px] border-b border-[#7A1428]/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-4 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C9A15B] animate-pulse" />
            <span className="text-gray-200">
              Instalación profesional en 48–72 horas • Toluca, CDMX, MTY, GDL y QRO sin viáticos
            </span>
          </div>
          <div className="flex items-center gap-4 text-gray-300">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-[#C9A15B]" /> Matriz: {TELEFONO_MATRIZ}
            </span>
            <a
              href={`https://wa.me/5217224322053`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-[#C9A15B] transition-colors"
            >
              <MessageCircle className="w-3 h-3 text-[#C9A15B]" /> WhatsApp: {WHATSAPP_DISPLAY}
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-[#7A1428] text-white font-black text-xl flex items-center justify-center border border-[#C9A15B]/50 shadow-md group-hover:scale-105 transition-transform">
              C
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-gray-900 block leading-none">
                Coso<span className="text-[#C9A15B]">Tec</span>
              </span>
              <span className="text-[10px] uppercase font-bold text-[#7A1428] tracking-widest block mt-0.5">
                by CoSoAVL
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold text-gray-700">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "text-[#7A1428] bg-[#7A1428]/10 font-bold"
                      : "hover:text-[#7A1428] hover:bg-gray-100"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Action CTA & Mobile Trigger */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/checkout"
              className="relative p-2.5 rounded-xl border border-gray-200 text-gray-700 hover:text-[#7A1428] hover:border-[#7A1428]/30 hover:bg-[#7A1428]/5 transition-all"
              aria-label="Ver carrito y checkout"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#7A1428] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </Link>

            <a
              href={whatsappQuoteUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleCtaClick}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#7A1428] hover:bg-[#4A0C18] text-white text-xs font-bold rounded-xl shadow-sm transition-all hover:scale-[1.02] border border-[#C9A15B]/30"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#C9A15B]" />
              <span className="hidden sm:inline">Cotiza en 1 min</span>
              <span className="sm:hidden">Cotizar</span>
            </a>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Abrir menú de navegación"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-gray-200 px-6 py-6 space-y-3 animate-in slide-in-from-top-4 duration-200">
            <nav className="flex flex-col space-y-1 text-sm font-semibold text-gray-800">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-xl transition-colors ${
                    pathname === link.href ? "bg-[#7A1428] text-white" : "hover:bg-gray-100"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            <div className="pt-4 border-t border-gray-100 space-y-2 text-xs text-gray-600">
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#7A1428]" /> Matriz Toluca: {TELEFONO_MATRIZ}
              </p>
              <p className="flex items-center gap-2">
                <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" /> WhatsApp: {WHATSAPP_DISPLAY}
              </p>
            </div>
          </div>
        )}
      </header>
    </>
  );
}

