import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductBySlug, getProducts } from "@/lib/services/catalog-service";
import { precioConIva, formatMxn, getQueIncluyeComputed } from "@/lib/pricing";
import { DevicePlaceholder } from "@/components/public/DevicePlaceholder";
import { ProductCard } from "@/components/public/ProductCard";
import { getProductImage } from "@/lib/catalog/product-image";
import {
  Check,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ArrowRight,
  MessageCircle,
  Phone,
  FileText,
} from "lucide-react";
import { buildWhatsAppLink, WHATSAPP_DISPLAY } from "@/lib/utils/whatsapp";
import { AddToCartButton } from "@/components/public/AddToCartButton";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || !product.activo) {
    return { title: "Producto no encontrado" };
  }

  const desc = product.descripcionCorta || product.descripcion || "Rastreo satelital GPS y telemetría profesional.";

  return {
    title: product.nombreComercial,
    description: desc,
    alternates: {
      canonical: `/p/${product.slug}`,
    },
    openGraph: {
      title: `${product.nombreComercial} | CosoTec by CoSoAVL`,
      description: desc,
      url: `/p/${product.slug}`,
    },
  };
}

const categoryLabels: Record<string, string> = {
  gps: "GPS",
  dashcam: "DashCam",
  seguridad: "Seguridad",
  accesorio: "Accesorio",
  sensor: "Sensor",
  dron: "Dron",
  servicio: "Servicio",
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product || !product.activo || product.visibleEnTienda === false) {
    notFound();
  }

  const conIvaCentavos = precioConIva(product.precioSinIvaCentavos, 16);
  const formattedPrice = formatMxn(conIvaCentavos);

  const whatsappUrl = buildWhatsAppLink({
    producto: product.nombreComercial,
    modelo: product.modeloConfirmado ? product.modelo : undefined,
    precioConIva: product.revisarPrecio ? undefined : formattedPrice,
    pagina: `/p/${product.slug}`,
    tipoConsulta: product.revisarPrecio ? "cotizacion" : "asesoria",
  });

  const allProducts = await getProducts(false);
  const relatedProducts = allProducts
    .filter((p) => p.slug !== product.slug && p.categoria === product.categoria && p.activo)
    .slice(0, 3);

  // Schema.org Product
  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.nombreComercial,
    model: product.modelo,
    description: product.descripcion || product.descripcionCorta,
    brand: {
      "@type": "Brand",
      name: "CoSoAVL",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "MXN",
      price: (conIvaCentavos / 100).toFixed(2),
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "CoSoAVL",
      },
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-16">
      {/* Schema.org Product */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/" className="hover:text-gray-900">Inicio</Link>
        <span>/</span>
        <Link href="/tienda" className="hover:text-gray-900">Tienda</Link>
        <span>/</span>
        <Link href={`/tienda/${product.categoria}`} className="hover:text-gray-900 uppercase">
          {product.categoria}
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">{product.nombreComercial}</span>
      </div>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Imagen / Visual */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getProductImage(product)}
              alt={product.nombreComercial}
              className="w-full max-h-[420px] object-contain rounded-2xl"
            />
          </div>
        </div>

        {/* Info & Purchase Details */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#7A1428]/10 text-[#7A1428] border border-[#7A1428]/20">
                {categoryLabels[product.categoria] || product.categoria.toUpperCase()}
              </span>
              {product.modeloConfirmado && product.modelo && (
                <span className="text-xs font-mono text-gray-500">Modelo: {product.modelo}</span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight">
              {product.nombreComercial}
            </h1>

            {product.descripcionCorta && (
              <p className="text-sm text-gray-600 leading-relaxed pt-1">
                {product.descripcionCorta}
              </p>
            )}
          </div>

          {/* Pricing Box */}
          <div className="p-6 rounded-2xl bg-white border border-gray-200/80 shadow-xs space-y-4">
            {product.revisarPrecio ? (
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Precio por confirmar</span>
                </div>
                <p className="text-xs text-gray-500">
                  Estamos actualizando la lista de precios oficial para este equipo. Cotiza con tu asesor vía WhatsApp para recibir la cotización con folio.
                </p>
              </div>
            ) : product.precioSinIvaCentavos === 0 ? (
              <div className="space-y-1">
                <span className="text-2xl font-black text-gray-900">Cotización a Medida</span>
                <p className="text-xs text-gray-500">Equipo empresarial de alta gama</p>
              </div>
            ) : (
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                  Precio de Contado
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-gray-900">{formattedPrice}</span>
                  <span className="text-xs font-semibold text-gray-500 uppercase">con IVA incluido</span>
                </div>
                <p className="text-[11px] text-gray-400">
                  Subtotal: {formatMxn(product.precioSinIvaCentavos)} sin IVA
                </p>
              </div>
            )}

            {/* CTAs */}
            <div className="pt-2 flex flex-col gap-3">
              {product.revisarPrecio ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-6 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                  aria-label={`Solicitar cotización por WhatsApp para ${product.nombreComercial}`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Solicitar cotización por WhatsApp</span>
                </a>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  <AddToCartButton product={product} />

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto py-3.5 px-5 font-bold text-xs rounded-xl border border-gray-200 text-gray-700 hover:text-[#25D366] hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    aria-label={`Asesoría por WhatsApp para ${product.nombreComercial}`}
                  >
                    <MessageCircle className="w-4 h-4 text-[#25D366]" />
                    <span>Asesoría por WhatsApp</span>
                  </a>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center gap-2 text-[11px] text-gray-500 border-t border-gray-100">
              <Clock className="w-3.5 h-3.5 text-[#7A1428]" />
              <span>Instalación técnica en 48–72 horas tras confirmación</span>
            </div>
          </div>

          {/* Aviso sobre audio y video en cabina si corresponde */}
          {(product.categoria === "dashcam" || product.slug.includes("microfono") || product.slug.includes("audio")) && (
            <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <span className="font-bold">Aviso legal y privacidad de cabina: </span>
                Informa a tus operadores sobre el uso de audio y video en cabina.
              </p>
            </div>
          )}

          {/* Qué Incluye (Dinámico según casillas de instalación y plan) */}
          {(() => {
            const queIncluyeList = getQueIncluyeComputed(product);
            if (queIncluyeList.length === 0) return null;
            return (
              <div className="p-6 rounded-2xl bg-white border border-gray-200/80 shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#C9A15B]" />
                  <span>¿Qué incluye este equipo?</span>
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-700">
                  {queIncluyeList.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7A1428] mt-1.5 shrink-0" />
                      <span className="font-medium text-gray-800">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}

          {/* Costos Recurrentes (Informativos: a partir del 2° año si incluye primer año) */}
          {product.incluyePlanPrimerAnio && (
            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2 text-xs">
              <span className="font-bold text-gray-800 block">Costos Recurrentes Informativos:</span>
              {product.recurrentes && product.recurrentes.length > 0 ? (
                product.recurrentes.map((rec, i) => (
                  <div key={i} className="flex items-center justify-between text-gray-600">
                    <span>
                      {rec.concepto} {rec.periodo === "anual" ? "(a partir del 2° año)" : ""}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {formatMxn(rec.montoCentavos)} + IVA / {rec.periodo}
                    </span>
                  </div>
                ))
              ) : product.esEquipoPrincipal ? (
                <div className="flex items-center justify-between text-gray-600">
                  <span>Renovación anual plataforma y datos (a partir del 2° año)</span>
                  <span className="font-semibold text-gray-900">$2,583.75 + IVA / año</span>
                </div>
              ) : null}
              <p className="text-[10px] text-gray-400 pt-1">
                * El primer año de plataforma y transmisión de datos viene 100% incluido en el costo del equipo.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Descripción Detallada */}
      {product.descripcion && (
        <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-xs space-y-4">
          <h2 className="text-lg font-black text-gray-900 tracking-tight">Descripción y Características</h2>
          <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line max-w-4xl">
            {product.descripcion}
          </p>
        </div>
      )}

      {/* Equipos Relacionados */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Otros equipos en esta categoría</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.slug} product={rel} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

