"use client";

import React, { useState } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";

interface FaqItem {
  pregunta: string;
  respuesta: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  // Solo la primera desplegada por defecto (index 0)
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div
            key={idx}
            className={`rounded-2xl bg-white border transition-all duration-300 overflow-hidden shadow-xs ${
              isOpen
                ? "border-[#7A1428]/40 ring-1 ring-[#7A1428]/10 shadow-md"
                : "border-gray-200/80 hover:border-gray-300"
            }`}
          >
            <button
              type="button"
              onClick={() => toggle(idx)}
              aria-expanded={isOpen}
              className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1428] rounded-2xl"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isOpen
                      ? "bg-[#7A1428] text-white"
                      : "bg-[#7A1428]/10 text-[#7A1428]"
                  }`}
                >
                  <HelpCircle className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm leading-snug mt-0.5">
                  {item.pregunta}
                </h3>
              </div>

              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-gray-400 hover:text-gray-600 transition-transform duration-300 ${
                  isOpen ? "rotate-180 text-[#7A1428] bg-[#7A1428]/5" : ""
                }`}
              >
                <ChevronDown className="w-4 h-4" />
              </div>
            </button>

            {isOpen && (
              <div className="px-5 pb-5 pt-0 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="pl-10 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                  {item.respuesta}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
