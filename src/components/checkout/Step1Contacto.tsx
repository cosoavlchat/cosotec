"use client";

import React, { useState } from "react";
import { useCart } from "@/context/CartContext";
import { User, Phone, Mail, Building, ArrowRight, ShieldCheck } from "lucide-react";
import { normalizePhoneE164, formatPhoneLocal, isValidMexicanPhone } from "@/lib/utils/phone";

interface Step1ContactoProps {
  onNext: () => void;
}

export function Step1Contacto({ onNext }: Step1ContactoProps) {
  const { cart, updateContacto } = useCart();
  const contacto = cart?.contacto || {};

  const [nombre, setNombre] = useState(contacto.nombre || "");
  const [telefono, setTelefono] = useState(contacto.telefono || "");
  const [correo, setCorreo] = useState(contacto.correo || "");
  const [empresa, setEmpresa] = useState(contacto.empresa || "");

  const [errors, setErrors] = useState<{ nombre?: string; telefono?: string; correo?: string }>({});

  const handleBlur = (field: "nombre" | "telefono" | "correo" | "empresa", value: string) => {
    updateContacto({ [field]: value.trim() }, true);
  };

  const validateAndProceed = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { nombre?: string; telefono?: string; correo?: string } = {};

    if (!nombre.trim()) {
      newErrors.nombre = "El nombre de contacto es obligatorio.";
    }

    const digits = telefono.replace(/\D/g, "");
    if (!digits || !isValidMexicanPhone(digits)) {
      newErrors.telefono = "Ingresa un número telefónico o WhatsApp válido de 10 dígitos.";
    }

    if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      newErrors.correo = "Ingresa un correo electrónico válido.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    updateContacto(
      {
        nombre: nombre.trim(),
        telefono: normalizePhoneE164(digits),
        correo: correo.trim(),
        empresa: empresa.trim(),
      },
      true
    );
    onNext();
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7A1428]/10 text-[#7A1428] text-xs font-bold mb-2">
          <span>Paso 1 de 5</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
          Datos de Contacto y Seguimiento
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Usaremos esta información para coordinar tu entrega técnica, enviar tu cotización oficial y confirmar la instalación.
        </p>
      </div>

      <form onSubmit={validateAndProceed} className="space-y-4">
        {/* Nombre completo */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
            Nombre Completo *
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onBlur={(e) => handleBlur("nombre", e.target.value)}
              placeholder="Ej. Ing. Carlos Mendoza"
              className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm text-gray-900 bg-gray-50/50 focus:bg-white focus:outline-none transition-all ${
                errors.nombre
                  ? "border-red-400 focus:ring-2 focus:ring-red-200"
                  : "border-gray-200 focus:border-[#7A1428] focus:ring-2 focus:ring-[#7A1428]/15"
              }`}
            />
          </div>
          {errors.nombre && <p className="text-xs text-red-600 mt-1">{errors.nombre}</p>}
        </div>

        {/* Teléfono / WhatsApp */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Teléfono / WhatsApp (10 dígitos) *
            </label>
            <span className="text-[11px] text-gray-400">Notificaciones y coordinación</span>
          </div>
          <div className="relative">
            <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="tel"
              name="telefono"
              value={telefono}
              maxLength={14}
              onChange={(e) => setTelefono(e.target.value)}
              onBlur={(e) => handleBlur("telefono", e.target.value)}
              placeholder="Ej. 55 5000 0000"
              className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm text-gray-900 bg-gray-50/50 focus:bg-white focus:outline-none transition-all ${
                errors.telefono
                  ? "border-red-400 focus:ring-2 focus:ring-red-200"
                  : "border-gray-200 focus:border-[#7A1428] focus:ring-2 focus:ring-[#7A1428]/15"
              }`}
            />
          </div>
          {errors.telefono && <p className="text-xs text-red-600 mt-1">{errors.telefono}</p>}
        </div>

        {/* Correo Electrónico */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
            Correo Electrónico (Opcional)
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              name="correo"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              onBlur={(e) => handleBlur("correo", e.target.value)}
              placeholder="carlos@empresa.com"
              className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm text-gray-900 bg-gray-50/50 focus:bg-white focus:outline-none transition-all ${
                errors.correo
                  ? "border-red-400 focus:ring-2 focus:ring-red-200"
                  : "border-gray-200 focus:border-[#7A1428] focus:ring-2 focus:ring-[#7A1428]/15"
              }`}
            />
          </div>
          {errors.correo && <p className="text-xs text-red-600 mt-1">{errors.correo}</p>}
        </div>

        {/* Empresa / Razón Social preliminar */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
            Empresa / Flotilla (Opcional)
          </label>
          <div className="relative">
            <Building className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="empresa"
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              onBlur={(e) => handleBlur("empresa", e.target.value)}
              placeholder="Ej. Transportes del Centro S.A."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-[#7A1428] focus:ring-2 focus:ring-[#7A1428]/15 transition-all"
            />
          </div>
        </div>

        <div className="pt-4 flex items-center justify-between gap-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Tus datos se guardan en tiempo real de forma segura.</span>
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#7A1428] hover:bg-[#4A0C18] text-white font-bold text-sm rounded-xl shadow-md transition-all hover:scale-[1.02]"
          >
            <span>Continuar a Instalación</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

