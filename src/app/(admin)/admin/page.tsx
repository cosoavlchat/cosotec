"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/auth/admin-fetch";
import { Layers, Sliders, Users, AlertTriangle, CheckCircle, ArrowRight, ShieldAlert } from "lucide-react";
import { formatMxn } from "@/lib/pricing";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    revisarPrecioCount: 0,
    totalPackages: 0,
    activePackages: 0,
    totalStates: 32,
    freeStates: 5,
    iva: 16,
    volumenDescuento: 10,
  });
  const [bankEsPrueba, setBankEsPrueba] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [catRes, priceRes] = await Promise.all([
          adminFetch("/api/admin/catalogo"),
          adminFetch("/api/admin/precios"),
        ]);

        const catData = await catRes.json();
        const priceData = await priceRes.json();

        const prods = catData.products || [];
        const pkgs = catData.packages || [];
        const travel = priceData.travelFees || [];

        if (priceData.bank?.esPrueba) {
          setBankEsPrueba(true);
        }

        setStats({
          totalProducts: prods.length,
          activeProducts: prods.filter((p: any) => p.activo).length,
          revisarPrecioCount: prods.filter((p: any) => p.revisarPrecio).length + pkgs.filter((p: any) => p.revisarPrecio).length,
          totalPackages: pkgs.length,
          activePackages: pkgs.filter((p: any) => p.activo).length,
          totalStates: travel.length || 32,
          freeStates: travel.filter((t: any) => t.sinCosto).length || 5,
          iva: priceData.pricing?.ivaPorcentaje || 16,
          volumenDescuento: priceData.pricing?.descuentoVolumen?.porcentaje || 10,
        });
      } catch (e) {
        console.error("Error al cargar estadísticas:", e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Candado Rojo: Datos Bancarios de Prueba */}
      {bankEsPrueba && (
        <div className="p-4 rounded-2xl bg-red-600 text-white flex items-center justify-between gap-4 shadow-md border-2 border-red-700 animate-pulse">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-white shrink-0" />
            <div>
              <p className="font-black text-sm uppercase tracking-wide">
                Candado de Salida a Producción Activo: Datos Bancarios de Prueba
              </p>
              <p className="text-xs text-red-100">
                La configuración bancaria para transferencias SPEI tiene activado <strong>esPrueba = true</strong> (Titular: <em>CUENTA DE PRUEBA – NO TRANSFERIR</em>). No se debe autorizar el lanzamiento a producción hasta sustituirlos por la cuenta fiscal real en <code>settings/bank</code>.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-white text-red-700 font-black text-xs rounded-lg uppercase tracking-wider shrink-0">
            esPrueba: true
          </span>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#4A0C18] to-[#7A1428] text-white p-8 shadow-md border border-[#C9A15B]/30 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#C9A15B]/15 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-2xl relative z-10 space-y-2">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-[#C9A15B] px-2.5 py-0.5 rounded-full bg-black/30 border border-[#C9A15B]/40">
            Fase 1: Base y Catálogo
          </span>
          <h1 className="text-3xl font-bold tracking-tight">Bienvenido al Panel de CosoTec</h1>
          <p className="text-xs text-gray-200 leading-relaxed">
            E-commerce oficial de CoSoAVL (Metepec, Edomex). Los precios se gestionan exclusivamente en centavos sin IVA y se calculan en el servidor para tienda, chatbot y vendedores.
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Productos Activos */}
        <div className="p-5 rounded-xl bg-white border border-gray-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Productos en Catálogo</span>
            <Layers className="w-4 h-4 text-[#7A1428]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {loading ? "..." : stats.activeProducts}
            </span>
            <span className="text-xs text-gray-400">/ {stats.totalProducts} totales</span>
          </div>
          <p className="text-[11px] text-gray-500">GPS, DashCams, Accesorios y Drones</p>
        </div>

        {/* Paquetes Activos */}
        <div className="p-5 rounded-xl bg-white border border-gray-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Kits Comerciales</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {loading ? "..." : stats.activePackages}
            </span>
            <span className="text-xs text-gray-400">/ {stats.totalPackages} paquetes</span>
          </div>
          <p className="text-[11px] text-gray-500">GPS Esencial, Flotilla Pro, DashCam 360</p>
        </div>

        {/* Alerta de Inconsistencias / Precios por confirmar */}
        <div className="p-5 rounded-xl bg-amber-50/70 border border-amber-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-xs font-semibold uppercase tracking-wider">Por Confirmar</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-900">
              {loading ? "..." : stats.revisarPrecioCount}
            </span>
            <span className="text-xs text-amber-700">ítems marcados</span>
          </div>
          <p className="text-[11px] text-amber-700">GPS Esencial & GPS Portable 15-D</p>
        </div>

        {/* Cobertura Sin Costo */}
        <div className="p-5 rounded-xl bg-white border border-gray-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Zonas Sin Viáticos</span>
            <Sliders className="w-4 h-4 text-[#C9A15B]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {loading ? "..." : stats.freeStates}
            </span>
            <span className="text-xs text-gray-400">estados exentos</span>
          </div>
          <p className="text-[11px] text-gray-500">Toluca, CDMX, MTY, GDL, QRO</p>
        </div>
      </div>

      {/* Quick Access Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/catalogo"
          className="group p-6 rounded-2xl bg-white border border-gray-200 hover:border-[#7A1428] shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#7A1428]/10 text-[#7A1428] flex items-center justify-center group-hover:bg-[#7A1428] group-hover:text-white transition-colors">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 text-base">Gestión de Catálogo</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Crea, edita y oculta productos, equipos GPS, DashCams, drones y paquetes comerciales. Modifica precios sin IVA y qué incluye.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-[#7A1428]">
            <span>Abrir Catálogo</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/admin/precios"
          className="group p-6 rounded-2xl bg-white border border-gray-200 hover:border-[#7A1428] shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#C9A15B]/20 text-[#7A1428] flex items-center justify-center group-hover:bg-[#C9A15B] group-hover:text-white transition-colors">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 text-base">Precios y Reglas</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Configura el IVA (16%), descuento por volumen ({stats.volumenDescuento}% a más de 5 unidades), tope para vendedores y la matriz de viáticos por estado.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-[#7A1428]">
            <span>Configurar Reglas</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/admin/usuarios"
          className="group p-6 rounded-2xl bg-white border border-gray-200 hover:border-[#7A1428] shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:bg-blue-700 group-hover:text-white transition-colors">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 text-base">Usuarios y Roles</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Administra accesos para vendedores y soporte técnico con Firebase Auth Custom Claims. Bloquea edición a vendedores.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-blue-700">
            <span>Gestionar Personal</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
}

