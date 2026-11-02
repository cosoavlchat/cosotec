"use client";

import React from "react";
import { CartStep } from "@/types/cart";
import { Check, User, MapPin, Truck, FileText, CreditCard } from "lucide-react";

interface CheckoutStepperProps {
  currentStep: CartStep;
  onSelectStep?: (step: CartStep) => void;
  maxStepAllowed?: CartStep;
}

const STEPS = [
  { step: 1 as CartStep, label: "Contacto", icon: User },
  { step: 2 as CartStep, label: "Instalación", icon: MapPin },
  { step: 3 as CartStep, label: "Unidades", icon: Truck },
  { step: 4 as CartStep, label: "Factura", icon: FileText },
  { step: 5 as CartStep, label: "Pago", icon: CreditCard },
];

export function CheckoutStepper({ currentStep, onSelectStep, maxStepAllowed = 5 }: CheckoutStepperProps) {
  return (
    <div className="w-full bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs">
      <div className="flex items-center justify-between relative">
        {/* Progress bar background line */}
        <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-0.5 bg-gray-200 z-0" />
        
        {/* Active progress line */}
        <div
          className="absolute top-1/2 left-6 -translate-y-1/2 h-0.5 bg-[#7A1428] transition-all duration-300 z-0"
          style={{
            width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`,
            maxWidth: "calc(100% - 3rem)",
          }}
        />

        {STEPS.map((s) => {
          const isCompleted = s.step < currentStep;
          const isCurrent = s.step === currentStep;
          const isAccessible = s.step <= maxStepAllowed;
          const Icon = s.icon;

          return (
            <button
              key={s.step}
              type="button"
              disabled={!isAccessible}
              onClick={() => onSelectStep && isAccessible && onSelectStep(s.step)}
              className={`relative z-10 flex flex-col items-center gap-1.5 focus:outline-none transition-all ${
                isAccessible ? "cursor-pointer" : "cursor-not-allowed opacity-60"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-xs ${
                  isCompleted
                    ? "bg-[#7A1428] text-white"
                    : isCurrent
                    ? "bg-[#7A1428] text-white ring-4 ring-[#7A1428]/20"
                    : "bg-white border-2 border-gray-300 text-gray-500"
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span
                className={`text-[11px] font-bold tracking-tight whitespace-nowrap ${
                  isCurrent
                    ? "text-[#7A1428]"
                    : isCompleted
                    ? "text-gray-900"
                    : "text-gray-400"
                }`}
              >
                {s.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

