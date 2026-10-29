import { getContentAccesos, getContactSettings } from "@/lib/services/content-service";
import { ExternalLink, ShieldCheck, Monitor, Compass, Key, Video, HelpCircle, Phone, MessageCircle } from "lucide-react";
import { WHATSAPP_DISPLAY, TELEFONO_MATRIZ } from "@/lib/utils/whatsapp";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acceso a Plataformas de Rastreo y Video | CosoTec by CoSoAVL",
  description:
    "Portal de acceso para clientes activos a las plataformas TrackTracer, SphereGT y monitoreo de video de CoSoAVL.",
};

export default async function AccesoPage() {
  const accesos = await getContentAccesos();
  const contact = await getContactSettings();

  const plataformas = [
    {
      id: "gtSat",
      nombre: accesos.gtSat?.nombre || "Ubicación Satelital GT-SAT",
      descripcion:
        accesos.gtSat?.descripcion || "Monitoreo en tiempo real de flotas, historial de recorridos y geocercas.",
      url: accesos.gtSat?.url || "http://cosoavl.tracktracer.com:8080/track/Track",
      icono: Compass,
      badge: "TrackTracer Web",
      disponible: Boolean(accesos.gtSat?.url),
    },
    {
      id: "sgl",
      nombre: accesos.sgl?.nombre || "Sistema de Gestión Logística (SGL)",
      descripcion:
        accesos.sgl?.descripcion || "Control operativo de despachos, kilometraje y rendimiento de combustible.",
      url: accesos.sgl?.url || "http://www.tracktracer.com/cosoavl/",
      icono: Monitor,
      badge: "SGL Portal",
      disponible: Boolean(accesos.sgl?.url),
    },
    {
      id: "sphereGt",
      nombre: accesos.sphereGt?.nombre || "Ubicación Satelital SGL+",
      descripcion:
        accesos.sphereGt?.descripcion || "Plataforma de telemetría avanzada SphereGT con mapas en alta resolución.",
      url: accesos.sphereGt?.url || "http://cosoavl.spheregt.com",
      icono: ShieldCheck,
      badge: "SphereGT Cloud",
      disponible: Boolean(accesos.sphereGt?.url),
    },
    {
      id: "adminSphere",
      nombre: accesos.adminSphere?.nombre || "Administración SGL+",
      descripcion:
        accesos.adminSphere?.descripcion || "Consola administrativa para alta de usuarios, vehículos y sensores.",
      url: accesos.adminSphere?.url || "http://cosoavl.spheregt.com/admin/index.html",
      icono: Key,
      badge: "Consola Admin",
      disponible: Boolean(accesos.adminSphere?.url),
    },
    {
      id: "videoDashcam",
      nombre: accesos.videoDashcam?.nombre || "Plataforma de Video DashCam",
      descripcion:
        accesos.videoDashcam?.descripcion ||
        "Visualización en vivo de cámaras de cabina y carretera JC181 / JC450 y descarga de eventos.",
      url: accesos.videoDashcam?.url || "",
      icono: Video,
      badge: "Video Telemetría",
      disponible: Boolean(accesos.videoDashcam?.url),
      notaPendiente: "URL en proceso de asignación con el cliente. Contáctanos para consultar el enlace directo.",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">
      {/* Header */}
      <div className="space-y-3 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7A1428]/10 text-[#7A1428] text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Área Exclusiva para Clientes Activos</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
          Acceso a Plataformas de Monitoreo
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
          Selecciona tu plataforma contratada para iniciar sesión en una nueva pestaña con tu usuario y contraseña.
        </p>
      </div>

      {/* Grid de Portales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plataformas.map((p) => {
          const Icon = p.icono;
          return (
            <div
              key={p.id}
              className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs flex flex-col justify-between space-y-6 hover:shadow-md transition-shadow"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#7A1428]/10 text-[#7A1428] flex items-center justify-center font-bold">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                    {p.badge}
                  </span>
                </div>

                <div>
                  <h3 className="font-black text-base text-gray-900">{p.nombre}</h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{p.descripcion}</p>
                </div>

                {p.notaPendiente && !p.disponible && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                    <span>{p.notaPendiente}</span>
                  </div>
                )}
              </div>

              <div>
                {p.disponible ? (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#7A1428] hover:bg-[#4A0C18] text-white text-xs font-bold transition-all shadow-xs hover:scale-[1.02]"
                  >
                    <span>Ingresar a Plataforma</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <a
                    href={`https://wa.me/5217224322053?text=${encodeURIComponent(
                      "Hola, necesito soporte y el link de acceso a la Plataforma de Video DashCam."
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                    <span>Consultar Enlace por WhatsApp</span>
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Soporte y Recuperación de Contraseñas */}
      <div className="rounded-3xl bg-white border border-gray-200/80 p-8 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h3 className="text-base font-black text-gray-900">
              ¿Olvidaste tu contraseña o requieres un nuevo usuario?
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              El equipo de mesa de ayuda de CoSoAVL puede restablecer tus credenciales o dar de alta nuevas unidades y operadores en minutos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://wa.me/5217224322053"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] text-white font-bold text-xs hover:bg-[#1ebc59] transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Soporte ({WHATSAPP_DISPLAY})</span>
            </a>
            <a
              href="tel:7221340127"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-50 transition-colors"
            >
              <Phone className="w-4 h-4 text-gray-500" />
              <span>Llamar a Matriz ({TELEFONO_MATRIZ})</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

