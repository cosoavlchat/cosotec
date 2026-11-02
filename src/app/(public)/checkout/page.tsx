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
import { ShieldCheck, Plus, ShoppingCart, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function CheckoutInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, items, currentStep: ctxStep, goToStep, addItem, saveCurrentState } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [maxStep, setMaxStep] = useState<CartStep>(5);

  const pasoParam = searchParams.get("paso");
  const parsedStep = pasoParam ? parseInt(pasoParam, 10) : NaN;
  const targetStep: CartStep = (!isNaN(parsedStep) && parsedStep >= 1 && parsedStep <= 5)
    ? (parsedStep as CartStep)
    : (ctxStep || 1);

  const [currentStep, setCurrentStep] = useState<CartStep>(targetStep);
  const [orderError, setOrderError] = useState<{ message: string; errorId?: string } | null>(null);

  useEffect(() => {
    if (!isNaN(parsedStep) && parsedStep >= 1 && parsedStep <= 5) {
      setCurrentStep(parsedStep as CartStep);
    } else if (ctxStep) {
      setCurrentStep(ctxStep);
    }
  }, [parsedStep, ctxStep]);

  // Si no hay items, asegurar que exista al menos 1 producto principal de prueba
  useEffect(() => {
    if (items.length === 0) {
      const defaultGps: CartItem = {
        id: "gps-tracker-4g",
        tipo: "producto",
        nombre: "GPS Tracker 4G Alta Precisión",
        categoria: "gps",
        precioSinIvaCentavos: 474138, // $4,741.38 MXN
        cantidad: 1,
        esEquipoPrincipal: true,
        incluyeInstalacion: false, // Genera instalación de $950 por separado
      };
      addItem(defaultGps);
    }
  }, [items.length, addItem]);

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

      const res = await fetch("/api/checkout/crear-orden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartId: cart?.id }),
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
