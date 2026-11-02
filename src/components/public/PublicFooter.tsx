import Link from "next/link";
import { Phone, Mail, MessageCircle, MapPin, ShieldCheck, ExternalLink } from "lucide-react";
import { WHATSAPP_DISPLAY, TELEFONO_MATRIZ, CORREO_VENTAS } from "@/lib/utils/whatsapp";

export function PublicFooter() {
  return (
    <footer className="bg-[#4A0C18] text-white border-t border-[#7A1428]/60 mt-auto">
      {/* Sección principal */}
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 text-xs">
        {/* Columna 1: Marca y Presencia */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#7A1428] text-white font-black text-xl flex items-center justify-center border border-[#C9A15B]/50 shadow-md">
              C
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white block leading-none">
                Coso<span className="text-[#C9A15B]">Tec</span>
              </span>
              <span className="text-[10px] uppercase font-bold text-[#C9A15B] tracking-widest block mt-0.5">
                by CoSoAVL
              </span>
            </div>
          </div>

          <p className="text-gray-300 leading-relaxed pr-4">
            Especialistas en ingeniería telemática, rastreo satelital GPS de grado automotriz e industrial, DashCams inteligentes con IA y seguridad activa contra inhibidores de señal (jammer).
          </p>

          <div className="space-y-2 text-gray-300">
            <p className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#C9A15B] shrink-0" />
              <span>Matriz: Metepec, Estado de México, México.</span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-[#C9A15B] shrink-0" />
              <span>Conmutador: {TELEFONO_MATRIZ}</span>
            </p>
            <p className="flex items-center gap-2">
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
              <span>WhatsApp de Ventas: {WHATSAPP_DISPLAY}</span>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-[#C9A15B] shrink-0" />
              <span>Correo: {CORREO_VENTAS}</span>
            </p>
          </div>
        </div>

        {/* Columna 2: Catálogo y Soluciones */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#C9A15B]">
            Equipos y Soluciones
          </h4>
          <ul className="space-y-2 text-gray-300">
            <li>
              <Link href="/tienda/gps" className="hover:text-white transition-colors">
                GPS para Autos y Flotillas
              </Link>
            </li>
            <li>
              <Link href="/tienda/dashcam" className="hover:text-white transition-colors">
                DashCams JC181 y JC450
              </Link>
            </li>
            <li>
              <Link href="/tienda/seguridad" className="hover:text-white transition-colors">
                Seguridad Anti-Jammer
              </Link>
            </li>
            <li>
              <Link href="/tienda/accesorio" className="hover:text-white transition-colors">
                Accesorios Homologados
              </Link>
            </li>
            <li>
              <Link href="/paquetes" className="hover:text-white transition-colors">
                Paquetes y Kits Listos
              </Link>
            </li>
            <li>
              <Link href="/tienda" className="hover:text-white transition-colors">
                Ver Catálogo Completo
              </Link>
            </li>
          </ul>
        </div>

        {/* Columna 3: Cobertura e Instalación */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#C9A15B]">
            Instalación Nacional
          </h4>
          <ul className="space-y-2 text-gray-300">
            <li>
              <Link href="/instalacion" className="hover:text-white transition-colors">
                Proceso de Instalación en 48–72h
              </Link>
            </li>
            <li>
              <Link href="/instalacion" className="hover:text-white transition-colors">
                Ciudades Sin Costo de Viáticos
              </Link>
            </li>
            <li>
              <Link href="/instalacion" className="hover:text-white transition-colors">
                Matriz de Viáticos por Estado
              </Link>
            </li>
            <li>
              <Link href="/nosotros" className="hover:text-white transition-colors">
                Empresa y Certificación ANERPV
              </Link>
            </li>
            <li>
              <Link href="/contacto" className="hover:text-white transition-colors">
                Solicitud de Asesoría Directa
              </Link>
            </li>
          </ul>
        </div>

        {/* Columna 4: Plataformas y Legal */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#C9A15B]">
            Clientes y Legal
          </h4>
          <ul className="space-y-2 text-gray-300">
            <li>
              <Link href="/acceso" className="hover:text-white transition-colors flex items-center gap-1">
                <span>Acceso a Plataformas</span>
                <ExternalLink className="w-3 h-3 text-[#C9A15B]" />
              </Link>
            </li>
            <li>
              <Link href="/privacidad" className="hover:text-white transition-colors">
                Aviso de Privacidad (Borrador)
              </Link>
            </li>
            <li>
              <Link href="/terminos" className="hover:text-white transition-colors">
                Términos Comerciales (Borrador)
              </Link>
            </li>
            <li>
              <Link href="/garantia" className="hover:text-white transition-colors">
                Póliza de Garantía (Borrador)
              </Link>
            </li>
            <li>
              <Link href="/admin/login" className="hover:text-[#C9A15B] transition-colors font-semibold">
                Acceso Personal CoSoAVL
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Barra Inferior */}
      <div className="bg-[#1C1C1E] py-4 px-6 border-t border-white/5 text-[11px] text-gray-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <p>© {new Date().getFullYear()} CoSoAVL — Todos los derechos reservados.</p>
          <p className="flex items-center gap-1 justify-center sm:justify-end text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Infraestructura protegida • Capital 100% Mexicano</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

