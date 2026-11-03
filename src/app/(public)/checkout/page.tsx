"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useCart } from "@/context/CartContext";
import { CheckoutStepper } from "@/components/checkout/CheckoutStepper";
import { Step1Contacto } from "@/components/checkout/Step1Contacto";
import { Step2Instalacion } from "@/components/checkout/Step2Instalacion";
import { Step3Unidades } from "@/components/checkout/Step3Unidades";
import { Step4Factura } from "@/components/checkout/Step4Factura";
import { Step5Pago } from "@/components/checkout/Step5Pago";
import { CheckoutSummary } from "@/components/checkout/CheckoutSummary";
import { CartStep, CartItem } from "@/types/cart";
import { ShieldCheck, ShieldAlert, Plus, ShoppingCart, ArrowRight, MessageCircle, Package } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function CheckoutInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, items, currentStep: ctxStep, goToStep, addItem, saveCurrentState } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [maxStep, setMaxStep] = useState<CartStep>(5);

  const cotizacionParam = searchParams.get("cotizacion") || searchParams.get("folio");
  const tokenParam = searchParams.get("t");
  const [quoteLoaded, setQuoteLoaded] = useState(false);
  const [quoteError, setQuoteError] = useState<{ message: string; whatsapp?: string } | null>(null);

  const pasoParam = searchParams.get("paso");
  const parsedStep = pasoParam ? parseInt(pasoParam, 10) : NaN;
  const targetStep: CartStep = (!isNaN(parsedStep) && parsedStep >= 1 && parsedStep <= 5)
    ? (parsedStep as CartStep)
    : (ctxStep || 1);

  const [currentStep, setCurrentStep] = useState<CartStep>(targetStep);
  const [orderError, setOrderError] = useState<{ message: string; errorId?: string } | null>(null);

  // Cargar datos inmutables desde cotización si se accede desde /c/[folio]
  useEffect(() => {
    if (!cotizacionParam || !tokenParam || quoteLoaded) return;

    let cancelled = false;
    async function loadQuote() {
      try {
        const res = await fetch(`/api/cotizaciones/${cotizacionParam}?t=${tokenParam}`);
        const data = await res.json();

        if (cancelled) return;

        if (!res.ok || !data.success || !data.quote) {
          setQuoteError({
            message: data.error || "No pudimos cargar la cotización.",
            whatsapp: "7224322053",
          });
          return;
        }

        const q = data.quote;

        // Validaciones estrictas de cotización
        if (q.esVersionActiva === false) {
          setQuoteError({
            message: "Hay una versión más reciente de esta cotización.",
            whatsapp: q.vendedorWhatsapp || "7224322053",
          });
          return;
        }

        const vencida = q.venceAt ? new Date(q.venceAt).getTime() < Date.now() : false;
        if (vencida) {
          setQuoteError({
            message: "Esta cotización venció, solicita una actualización a tu asesor",
            whatsapp: q.vendedorWhatsapp || "7224322053",
          });
          return;
        }

        if (q.estado === "pagada" || q.estado === "pagada_parcial") {
          setQuoteError({
            message: "Esta cotización ya cuenta con pagos registrados.",
            whatsapp: q.vendedorWhatsapp || "7224322053",
          });
          return;
        }

        if (q.estado === "pendiente_autorizacion") {
          setQuoteError({
            message: "Esta cotización se encuentra pendiente de autorización interna.",
            whatsapp: q.vendedorWhatsapp || "7224322053",
          });
          return;
        }

        // Prellenar carrito con los datos inmutables de la cotización
        const cartItems: CartItem[] = (q.items || []).map((it: any) => ({
          id: it.id,
          tipo: "producto" as const,
          nombre: it.nombre,
          categoria: it.categoria || "gps",
          precioSinIvaCentavos: it.precioSinIvaCentavos,
          cantidad: it.cantidad,
          esEquipoPrincipal: Boolean(it.esEquipoPrincipal),
          incluyeInstalacion: Boolean(it.incluyeInstalacion),
          incluyePlanPrimerAnio: Boolean(it.incluyePlanPrimerAnio),
        }));

        await saveCurrentState({
          items: cartItems,
          contacto: {
            nombre: q.cliente?.nombre || "",
            telefono: q.cliente?.telefono || "",
            correo: q.cliente?.correo || "",
            empresa: q.cliente?.empresa,
          },
          ...(q.cliente?.rfc
            ? {
                factura: {
                  requiereFactura: true,
                  rfc: q.cliente.rfc,
                  razonSocial: q.cliente.empresa || q.cliente.nombre || "",
                  usoCfdi: "G03",
                },
              }
            : {}),
          instalacion: q.instalacion
            ? {
                estadoClave: q.instalacion.estadoClave,
                estadoNombre: q.instalacion.estadoNombre,
                municipio: q.instalacion.municipio,
                direccion: "Por confirmar con asesor técnico",
                tipoLugar: "domicilio",
              }
            : q.estadoInstalacion
            ? {
                estadoClave: q.estadoInstalacion.clave,
                estadoNombre: q.estadoInstalacion.nombre,
                municipio: q.estadoInstalacion.nombre,
                direccion: "Por confirmar con asesor técnico",
                tipoLugar: "domicilio",
              }
            : undefined,
          pago: {
            planSeleccionado: q.condiciones?.planSeleccionado || "contado",
            metodoSeleccionado: "mercadopago",
          },
        });

        setQuoteLoaded(true);
      } catch (err) {
        console.error("Error al cargar cotización en checkout:", err);
        setQuoteError({
          message: "Ocurrió un error al cargar la información de la cotización.",
          whatsapp: "7224322053",
        });
      }
    }

    loadQuote();
    return () => {
      cancelled = true;
    };
  }, [cotizacionParam, tokenParam, quoteLoaded, saveCurrentState]);

  useEffect(() => {
    if (!isNaN(parsedStep) && parsedStep >= 1 && parsedStep <= 5) {
      setCurrentStep(parsedStep as CartStep);
    } else if (ctxStep) {
      setCurrentStep(ctxStep);
    }
  }, [parsedStep, ctxStep]);


  // Prellenar datos coherentes si se navega a pasos avanzados directamente
  useEffect(() => {
    const pasoParam = searchParams.get("paso");
    if (pasoParam && parseInt(pasoParam, 10) >= 2 && !cart?.contacto?.nombre) {
      saveCurrentState({
        contacto: {
          nombre: "Ing. Carlos Mendoza",
          telefono: "5550000000",
          correo: "carlos.mendoza@translog.mx",
          empresa: "Transportes del Centro S.A.",
        },
        instalacion: {
          estadoClave: "MEX",
          estadoNombre: "Estado de México",
          municipio: "Metepec",
          direccion: "Av. Benito Juárez #150, Col. San Francisco",
          tipoLugar: "domicilio",
          fechaTentativa: "2026-11-05",
          horarioTentativo: "manana",
          referencias: "Portón blanco, frente al parque",
        },
      });
    }
  }, [searchParams, cart?.contacto?.nombre, saveCurrentState]);

  const handleNextStep = async () => {
    const next = (currentStep + 1) as CartStep;
    if (next <= 5) {
      setCurrentStep(next);
      await goToStep(next);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBackStep = async () => {
    const prev = (currentStep - 1) as CartStep;
    if (prev >= 1) {
      setCurrentStep(prev);
      await goToStep(prev);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleConfirmOrder = async (
    planSeleccionado: string,
    metodoSeleccionado: "mercadopago" | "spei"
  ) => {
    try {
      setIsSubmitting(true);
      setOrderError(null);
      await saveCurrentState({
        estado: "activo",
        pago: { planSeleccionado, metodoSeleccionado },
      });

      const requestBody: any = {
        cartId: cart?.id,
        planSeleccionado,
        metodoSeleccionado,
      };
      if (cotizacionParam) {
        requestBody.cotizacionFolio = cotizacionParam;
        requestBody.token = tokenParam;
      }

      const res = await fetch("/api/checkout/crear-orden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (data.success && data.folio) {
        if (metodoSeleccionado === "mercadopago" && (data.mercadoPago?.checkoutUrl || data.mercadoPago?.initPoint)) {
          const redirectUrl =
            data.mercadoPago.checkoutUrl ||
            (process.env.NODE_ENV === "production"
              ? data.mercadoPago.initPoint
              : (data.mercadoPago.sandboxInitPoint || data.mercadoPago.initPoint));
          window.location.href = redirectUrl;
          return;
        }
        router.push(`/pedido/${data.folio}?t=${data.token}`);
      } else {
        setOrderError({
          message: data.error || "No pudimos generar tu orden",
          errorId: data.errorId,
        });
      }
    } catch (e: any) {
      console.error("Error al procesar la orden:", e);
      setOrderError({
        message: "No pudimos generar tu orden",
        errorId: `ERR_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3F2] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header con candado de seguridad */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200/60 pb-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-[#7A1428] block">
              Checkout Seguro CoSoAVL
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Configura tu Instalación y Pedido
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 self-start sm:self-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Encriptación SSL 256-Bit</span>
          </div>
        </div>

        {/* Aviso de error o cotización no pagable */}
        {quoteError ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-amber-200/80 shadow-md text-center max-w-lg mx-auto space-y-5 my-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-9 h-9" />
            </div>
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                Atención Comercial
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                {quoteError.message}
              </h2>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Por políticas de integridad y vigencia de precios en CosoTec, un asesor comercial te ayudará a reactivar tu cotización o confirmar la versión vigente en un solo clic.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              {quoteError.whatsapp && (
                <a
                  href={`https://wa.me/52${quoteError.whatsapp}?text=Hola,%20solicito%20actualizar%20mi%20cotizaci%C3%B3n%20${cotizacionParam || ""}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  Actualizar por WhatsApp
                </a>
              )}
              <Link
                href="/tienda"
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs transition-colors"
              >
                Ver Tienda
              </Link>
            </div>
          </div>
        ) : items.length === 0 && !cotizacionParam ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-200/80 shadow-md text-center max-w-lg mx-auto space-y-5 my-8">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
              <Package className="w-9 h-9 stroke-[1.5]" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900">Tu carrito está vacío</h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                No tienes productos o paquetes agregados a tu cotización. Selecciona una solución o equipo de nuestro catálogo para continuar con el proceso de checkout.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link
                href="/soluciones"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#7A1428] text-white text-xs font-bold hover:bg-[#4A0C18] transition-all shadow-xs"
              >
                Ver Soluciones
                <ArrowRight className="w-4 h-4 text-[#C9A15B]" />
              </Link>
              <Link
                href="/tienda"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-all"
              >
                Ver Tienda
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Stepper de 5 pasos */}
            <CheckoutStepper
              currentStep={currentStep}
              maxStepAllowed={maxStep}
              onSelectStep={(s) => goToStep(s)}
            />

            {/* Grid de Formulario Activo + Resumen Lateral */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Columna Principal: Paso Actual (7 columnas) */}
              <div className="lg:col-span-7 space-y-6">
                {currentStep === 1 && <Step1Contacto onNext={handleNextStep} />}
                {currentStep === 2 && (
                  <Step2Instalacion onNext={handleNextStep} onBack={handleBackStep} />
                )}
                {currentStep === 3 && (
                  <Step3Unidades onNext={handleNextStep} onBack={handleBackStep} />
                )}
                {currentStep === 4 && (
                  <Step4Factura onNext={handleNextStep} onBack={handleBackStep} />
                )}
                {currentStep === 5 && (
                  <Step5Pago
                    onBack={handleBackStep}
                    onConfirmOrder={handleConfirmOrder}
                    isSubmitting={isSubmitting}
                    orderError={orderError}
                  />
                )}
              </div>

              {/* Columna Secundaria: Resumen Financiero y Carrito (5 columnas) */}
              <div className="lg:col-span-5 lg:sticky lg:top-24">
                <CheckoutSummary />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-gray-500">Cargando checkout...</div>}>
      <CheckoutInner />
    </Suspense>
  );
}
