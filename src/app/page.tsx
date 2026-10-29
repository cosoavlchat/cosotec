import Link from "next/link";
import { ArrowRight, ShieldCheck, Layers, Sliders, Users, ExternalLink } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F5F3F2] text-[#1C1C1E] flex flex-col justify-between">
      {/* Navbar simplificado de Fase 1 */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#7A1428] text-white font-black text-xl flex items-center justify-center border border-[#C9A15B]/50 shadow-xs">
            C
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-gray-900">
              Coso<span className="text-[#C9A15B]">Tec</span>
            </span>
            <span className="text-[10px] uppercase font-bold text-[#7A1428] block tracking-wider -mt-1">
              by CoSoAVL
            </span>
          </div>
        </div>

        <Link
          href="/admin"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#7A1428] hover:bg-[#4A0C18] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
        >
          <span>Panel Admin & Catálogo</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-16 flex flex-col items-center text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7A1428]/10 text-[#7A1428] text-xs font-semibold border border-[#7A1428]/20">
          <ShieldCheck className="w-4 h-4 text-[#C9A15B]" />
          <span>Fase 1 Completada: Base, Roles y Catálogo de Precios</span>
        </div>

        <div className="space-y-4 max-w-3xl">
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight">
            La nueva plataforma digital de <span className="text-[#7A1428]">CoSoAVL</span>
          </h1>
          <p className="text-base text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Venta e instalación de GPS, DashCams con IA, seguridad vehicular contra jammers y drones empresariales. Precios calculados en el servidor, integridad en centavos y control por roles.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/admin/catalogo"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#7A1428] hover:bg-[#4A0C18] text-white text-sm font-bold rounded-xl shadow-md transition-all hover:scale-[1.02]"
          >
            <Layers className="w-4 h-4" />
            <span>Ver Catálogo en Admin</span>
          </Link>
          <Link
            href="/admin/precios"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-800 text-sm font-bold rounded-xl border border-gray-300 shadow-xs transition-all"
          >
            <Sliders className="w-4 h-4 text-[#C9A15B]" />
            <span>Reglas de Precios y Viáticos</span>
          </Link>
        </div>

        {/* Feature summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full text-left pt-12">
          <div className="p-6 rounded-2xl bg-white border border-gray-200/80 shadow-xs space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[#7A1428]/10 text-[#7A1428] flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Centavos sin IVA en BD</h3>
            <p className="text-xs text-gray-500">
              Integridad financiera total: todos los montos se almacenan como enteros en centavos y se desglosan en el servidor.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-gray-200/80 shadow-xs space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[#C9A15B]/20 text-[#7A1428] flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Roles y Custom Claims</h3>
            <p className="text-xs text-gray-500">
              Admin con control absoluto, vendedores con cotizador protegido sin alteración de precios, y soporte para instalaciones.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-gray-200/80 shadow-xs space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Seed Idempotente</h3>
            <p className="text-xs text-gray-500">
              Catálogo completo de equipos GPS, JC181, JC450, sensores, drones y 32 estados con zonas sin viáticos pre-cargadas.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#4A0C18] text-white py-6 px-6 text-center text-xs border-t border-[#7A1428]/50">
        <p className="text-gray-300">
          CosoTec by CoSoAVL • Metepec, Estado de México • ventas@cosoavl.com • WhatsApp 722 432 2053
        </p>
      </footer>
    </div>
  );
}
