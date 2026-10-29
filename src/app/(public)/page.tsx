import Link from "next/link";
import {
  Car,
  Truck,
  Shield,
  Clock,
  MapPin,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Phone,
  MessageCircle,
} from "lucide-react";
import { getPackages } from "@/lib/services/catalog-service";
import {
  getContentStats,
  getContentHero,
  getContentFaq,
  getTestimoniosActivos,
} from "@/lib/services/content-service";
import { PackageCard } from "@/components/public/PackageCard";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";

export default async function HomePage() {
  const [packages, stats, hero, faq, testimonios] = await Promise.all([
    getPackages(false), // Solo activos
    getContentStats(),
    getContentHero(),
    getContentFaq(),
    getTestimoniosActivos(),
  ]);

  const featuredPackages = packages.filter((p) => p.activo).slice(0, 3);

  const vehicleSolutions = [
    { name: "Autos y Camionetas", icon: Car, href: "/soluciones/auto-camioneta", desc: "Rastreo personal, paro de motor y botón SOS" },
    { name: "Taxis y Apps (Uber/Didi)", icon: Car, href: "/soluciones/taxi-apps", desc: "Monitoreo continuo y botón de emergencia silencioso" },
    { name: "Tractocamiones", icon: Truck, href: "/soluciones/tractocamion", desc: "Telemetría avanzada, anti-jammer y combustible" },
    { name: "Camiones y Autobuses", icon: Truck, href: "/soluciones/camion-autobus", desc: "Control de velocidad, geocercas y rutas" },
    { name: "Cajas Secas / Frías", icon: Shield, href: "/soluciones/caja-refrigerada", desc: "GPS autónomo de larga duración y sensor de frío" },
    { name: "Maquinaria Pesada", icon: Clock, href: "/soluciones/maquinaria", desc: "Horómetros de motor y geocercas en obra" },
    { name: "Motos de Reparto", icon: MapPin, href: "/soluciones/motos", desc: "Ultra bajo consumo y corte de corriente" },
  ];

  const pasos = [
    { num: "01", titulo: "Elige tu equipo o paquete", desc: "Selecciona el GPS o DashCam ideal para tu unidad o cotiza directamente con un asesor." },
    { num: "02", titulo: "Agenda tu fecha y lugar", desc: "Coordinamos la visita técnica a domicilio o en taller en 48–72 horas tras confirmación." },
    { num: "03", titulo: "Instalación profesional oculta", desc: "Técnicos certificados instalan sin cortar arneses originales ni perder garantía de agencia." },
    { num: "04", titulo: "Toma el control en tu celular", desc: "Descarga la app móvil y monitorea en tiempo real velocidad, ubicación y paro de motor." },
  ];

  const whatsappHeroUrl = buildWhatsAppLink({
    pagina: "Inicio (Hero)",
    tipoConsulta: "cotizacion",
  });

  // Schema.org LocalBusiness
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "CoSoAVL - CosoTec",
    image: "https://cosotec.com/logo.png",
    telephone: "+52-722-134-0127",
    email: "ventas@cosoavl.com",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Metepec",
      addressRegion: "Estado de México",
      addressCountry: "MX",
    },
    description:
      "Venta e instalación de rastreo satelital GPS, DashCams inteligentes con IA y seguridad contra jammers. Más de 48,000 dispositivos vendidos.",
    areaServed: "México",
  };

  return (
    <div className="space-y-20 pb-20">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#4A0C18] via-[#7A1428] to-[#4A0C18] text-white py-20 px-6 sm:py-28">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C9A15B_1px,transparent_1px)] [background-size:24px_24px]" />
        
        <div className="max-w-6xl mx-auto relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/30 border border-[#C9A15B]/40 text-[#C9A15B] text-xs font-bold uppercase tracking-wider animate-in fade-in zoom-in duration-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{hero.badge}</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight max-w-4xl mx-auto">
            {hero.titulo}
          </h1>

          <p className="text-base sm:text-lg text-gray-200 max-w-2xl mx-auto leading-relaxed">
            {hero.subtitulo}
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={whatsappHeroUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#C9A15B] hover:bg-[#b58f4a] text-gray-900 font-extrabold text-sm rounded-xl shadow-xl transition-all hover:scale-105"
            >
              <MessageCircle className="w-4 h-4 fill-current text-gray-900" />
              <span>Cotiza en 1 minuto por WhatsApp</span>
            </a>

            <Link
              href="/paquetes"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-xl border border-white/20 transition-colors"
            >
              <span>Ver Paquetes Listos</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Cifras de Confianza Veraces */}
          <div className="pt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left max-w-4xl mx-auto border-t border-white/15">
            <div className="p-4 rounded-xl bg-black/20 border border-white/10 space-y-1">
              <span className="text-2xl font-black text-[#C9A15B] block">{stats.cifraDispositivos}</span>
              <p className="text-xs text-gray-200 leading-snug">{stats.dispositivosTexto}</p>
            </div>
            <div className="p-4 rounded-xl bg-black/20 border border-white/10 space-y-1">
              <span className="text-xs font-bold text-[#C9A15B] uppercase tracking-wider block">Homologación</span>
              <p className="text-xs text-gray-200 leading-snug">{stats.gobiernosTexto}</p>
            </div>
            <div className="p-4 rounded-xl bg-black/20 border border-white/10 space-y-1 sm:col-span-2 lg:col-span-1">
              <span className="text-2xl font-black text-[#C9A15B] block">48–72h</span>
              <p className="text-xs text-gray-200 leading-snug">Tiempo récord de instalación garantizado en Toluca, CDMX, MTY, GDL y QRO sin viáticos.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Selector: ¿Qué quieres proteger? */}
      <section className="max-w-7xl mx-auto px-6 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#7A1428]">Soluciones a la Medida</span>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">¿Qué tipo de unidad quieres proteger?</h2>
          <p className="text-xs text-gray-500 max-w-xl mx-auto">
            Configuraciones de ingeniería adaptadas al tipo de chasis, voltaje y requerimientos de seguridad.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {vehicleSolutions.map((sol) => (
            <Link
              key={sol.name}
              href={sol.href}
              className="p-5 rounded-2xl bg-white border border-gray-200/80 hover:border-[#7A1428] shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#7A1428]/10 text-[#7A1428] flex items-center justify-center group-hover:bg-[#7A1428] group-hover:text-white transition-colors">
                  <sol.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm group-hover:text-[#7A1428] transition-colors">
                  {sol.name}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">{sol.desc}</p>
              </div>

              <div className="pt-4 mt-2 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-[#7A1428]">
                <span>Ver solución</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Paquetes Destacados */}
      <section className="max-w-7xl mx-auto px-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7A1428]">Kits Comerciales</span>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Paquetes Más Vendidos</h2>
            <p className="text-xs text-gray-500">Listos para compra inmediata o cotización con instalación incluida.</p>
          </div>
          <Link
            href="/paquetes"
            className="text-xs font-bold text-[#7A1428] hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Ver todos los paquetes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredPackages.map((pkg) => (
            <PackageCard key={pkg.slug} pkg={pkg} />
          ))}
        </div>
      </section>

      {/* ¿Cómo Funciona? (4 pasos) */}
      <section className="bg-white border-y border-gray-200/80 py-16 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7A1428]">Sin Complicaciones</span>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Tu seguridad lista en 4 sencillos pasos</h2>
            <p className="text-xs text-gray-500 max-w-xl mx-auto">
              Proceso transparente desde la elección del equipo hasta la entrega de la app en tu mano.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pasos.map((paso) => (
              <div
                key={paso.num}
                className="p-6 rounded-2xl bg-gray-50/70 border border-gray-200/80 space-y-3 relative overflow-hidden"
              >
                <span className="text-4xl font-black text-[#7A1428]/20 block">{paso.num}</span>
                <h3 className="font-bold text-gray-900 text-sm">{paso.titulo}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{paso.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sección Testimonios (REGLA 2: Solo si hay al menos uno activo) */}
      {testimonios && testimonios.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7A1428]">Experiencias Reales</span>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Lo que dicen nuestros clientes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonios.map((test: any) => (
              <div key={test.id} className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-3">
                <p className="text-xs text-gray-700 italic leading-relaxed">&ldquo;{test.comentario}&rdquo;</p>
                <div className="pt-3 border-t border-gray-100">
                  <span className="font-bold text-xs text-gray-900 block">{test.nombre}</span>
                  <span className="text-[11px] text-gray-500">{test.empresa || test.ciudad}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FAQ Preguntas Frecuentes */}
      <section className="max-w-4xl mx-auto px-6 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#7A1428]">Respuestas Claras</span>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Preguntas Frecuentes</h2>
          <p className="text-xs text-gray-500">Todo lo que necesitas saber antes de equipar tus unidades.</p>
        </div>

        <div className="space-y-3">
          {faq &&
            faq.map((item: any, idx: number) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white border border-gray-200/80 shadow-xs space-y-2"
              >
                <h3 className="font-bold text-gray-900 text-sm flex items-start gap-2.5">
                  <HelpCircle className="w-4 h-4 text-[#7A1428] shrink-0 mt-0.5" />
                  <span>{item.pregunta}</span>
                </h3>
                <p className="text-xs text-gray-600 pl-6 leading-relaxed">{item.respuesta}</p>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}

