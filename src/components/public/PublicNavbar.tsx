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
  MapPin,
  ShoppingCart,
  Car,
  Truck,
  Clock,
  ArrowRight,
} from "lucide-react";
import { WHATSAPP_DISPLAY, TELEFONO_MATRIZ } from "@/lib/utils/whatsapp";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { useCart } from "@/context/CartContext";

const solucionesList = [
  { name: "Autos y Camionetas", href: "/soluciones/auto-camioneta", icon: Car },
  { name: "Taxis y Apps (Uber/DiDi)", href: "/soluciones/taxi-apps", icon: Car },
  { name: "Tractocamiones", href: "/soluciones/tractocamion", icon: Truck },
  { name: "Camiones y Autobuses", href: "/soluciones/camion-autobus", icon: Truck },
  { name: "Cajas Secas / Frías", href: "/soluciones/caja-refrigerada", icon: Shield },
  { name: "Maquinaria Pesada", href: "/soluciones/maquinaria", icon: Clock },
  { name: "Motos de Reparto", href: "/soluciones/motos", icon: MapPin },
];

export function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [solutionsDropdownOpen, setSolutionsDropdownOpen] = useState(false);
  const [mobileSolutionsOpen, setMobileSolutionsOpen] = useState(false);
  const pathname = usePathname();
  const { items } = useCart();
  const cartCount = items?.reduce((sum, it) => sum + it.cantidad, 0) || 0;

  const handleCtaClick = () => {
    trackAnalyticsEvent("Contact", { method: "navbar_quote_cta", page: pathname });
  };

  const navLinks = [
    { name: "Inicio", href: "/" },
    { name: "Soluciones", href: "/soluciones", isDropdown: true },
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
              Instalación en 48–72h hábiles • Sin costo en zona metropolitana de Toluca, CDMX, MTY, GDL y QRO
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
              aria-label="Escribir al WhatsApp oficial de ventas"
            >
              <MessageCircle className="w-3 h-3 text-[#C9A15B]" /> WhatsApp: {WHATSAPP_DISPLAY}
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo Oficial */}
          <Link href="/" className="flex items-center shrink-0 group py-1" aria-label="CosoTec by CoSoAVL - Ir a la página de inicio">
            <img
              src="/logo-cosotec.png"
              alt="CosoTec by CoSoAVL - Consultoría y Soluciones"
              className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-102"
              width={200}
              height={48}
              fetchPriority="high"
            />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold text-gray-700">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));

              if (link.isDropdown) {
                return (
                  <div
                    key={link.name}
                    className="relative"
                    onMouseEnter={() => setSolutionsDropdownOpen(true)}
                    onMouseLeave={() => setSolutionsDropdownOpen(false)}
                  >
                    <div className="flex items-center">
                      <Link
                        href="/soluciones"
                        className={`px-3 py-2 rounded-l-lg transition-colors flex items-center gap-1 ${
                          isActive
                            ? "text-[#7A1428] bg-[#7A1428]/10 font-bold"
                            : "hover:text-[#7A1428] hover:bg-gray-100"
                        }`}
                      >
                        <span>{link.name}</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => setSolutionsDropdownOpen(!solutionsDropdownOpen)}
                        className={`p-2 rounded-r-lg transition-colors cursor-pointer ${
                          isActive ? "text-[#7A1428] bg-[#7A1428]/10" : "hover:text-[#7A1428] hover:bg-gray-100"
                        }`}
                        aria-label="Desplegar opciones de Soluciones"
                        aria-expanded={solutionsDropdownOpen}
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Desplegable Soluciones */}
                    {solutionsDropdownOpen && (
                      <div className="absolute top-full left-0 w-72 bg-white rounded-2xl shadow-xl border border-gray-200/90 py-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-3.5 py-1.5 border-b border-gray-100 mb-1 flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                            Por tipo de unidad
                          </span>
                          <Link
                            href="/soluciones"
                            className="text-[11px] font-bold text-[#7A1428] hover:underline"
                            onClick={() => setSolutionsDropdownOpen(false)}
                          >
                            Ver hub general
                          </Link>
                        </div>
                        {solucionesList.map((sol) => (
                          <Link
                            key={sol.name}
                            href={sol.href}
                            onClick={() => setSolutionsDropdownOpen(false)}
                            className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-gray-50 text-gray-800 hover:text-[#7A1428] transition-colors text-xs font-semibold"
                          >
                            <div className="w-7 h-7 rounded-lg bg-[#7A1428]/10 text-[#7A1428] flex items-center justify-center shrink-0">
                              <sol.icon className="w-3.5 h-3.5" />
                            </div>
                            <span className="leading-snug">{sol.name}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

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
              aria-label={`Ver carrito y checkout (${cartCount} ${cartCount === 1 ? "artículo" : "artículos"})`}
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#7A1428] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </Link>

            <Link
              href="/soluciones"
              onClick={handleCtaClick}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#7A1428] hover:bg-[#4A0C18] text-white text-xs font-bold rounded-xl shadow-sm transition-all hover:scale-[1.02] border border-[#C9A15B]/30 cursor-pointer"
              aria-label="Cotizar solución en 1 minuto"
            >
              <ArrowRight className="w-3.5 h-3.5 text-[#C9A15B]" />
              <span className="hidden sm:inline">Cotiza en 1 min</span>
              <span className="sm:hidden">Cotizar</span>
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label={mobileMenuOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-gray-200 px-6 py-6 space-y-3 animate-in slide-in-from-top-4 duration-200 max-h-[80vh] overflow-y-auto">
            <nav className="flex flex-col space-y-1 text-sm font-semibold text-gray-800">
              {navLinks.map((link) => {
                if (link.isDropdown) {
                  return (
                    <div key={link.name} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Link
                          href="/soluciones"
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex-1 px-3 py-2.5 rounded-xl transition-colors ${
                            pathname.startsWith("/soluciones") ? "bg-[#7A1428] text-white" : "hover:bg-gray-100"
                          }`}
                        >
                          {link.name} (Hub General)
                        </Link>
                        <button
                          type="button"
                          onClick={() => setMobileSolutionsOpen(!mobileSolutionsOpen)}
                          className="p-2.5 rounded-xl text-gray-600 hover:bg-gray-100"
                          aria-label="Alternar lista de soluciones"
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${mobileSolutionsOpen ? "rotate-180" : ""}`}
                          />
                        </button>
                      </div>

                      {/* Lista completa de las 7 soluciones en móvil */}
                      {mobileSolutionsOpen && (
                        <div className="pl-3 py-1 space-y-1 border-l-2 border-[#7A1428]/30 ml-2">
                          {solucionesList.map((sol) => (
                            <Link
                              key={sol.name}
                              href={sol.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                pathname === sol.href
                                  ? "text-[#7A1428] font-bold bg-[#7A1428]/10"
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              <sol.icon className="w-3.5 h-3.5 text-[#7A1428]" />
                              <span>{sol.name}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
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
                );
              })}
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
