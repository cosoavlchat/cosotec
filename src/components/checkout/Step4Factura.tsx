"use client";

import React, { useState } from "react";
import { useCart } from "@/context/CartContext";
import { FileText, ArrowRight, ArrowLeft, Check, ShieldAlert, Building2, Mail } from "lucide-react";

interface Step4FacturaProps {
  onNext: () => void;
  onBack: () => void;
}

const REGIMENES_FISCALES = [
  { clave: "601", nombre: "601 — General de Ley Personas Morales" },
  { clave: "612", nombre: "612 — Personas Físicas con Actividades Empresariales y Profesionales" },
  { clave: "626", nombre: "626 — Régimen Simplificado de Confianza (RESICO)" },
  { clave: "605", nombre: "605 — Sueldos y Salarios e Ingresos Asimilados a Salarios" },
  { clave: "606", nombre: "606 — Arrendamiento" },
  { clave: "616", nombre: "616 — Sin obligaciones fiscales" },
  { clave: "625", nombre: "625 — Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas" },
];

const USOS_CFDI = [
  { clave: "G03", nombre: "G03 — Gastos en general" },
  { clave: "CP01", nombre: "CP01 — Pagos" },
  { clave: "I08", nombre: "I08 — Otra maquinaria y equipo" },
  { clave: "S01", nombre: "S01 — Sin efectos fiscales" },
];

export function Step4Factura({ onNext, onBack }: Step4FacturaProps) {
  const { cart, updateFactura } = useCart();
  const factura = cart?.factura || { requiereFactura: false };

  const [requiereFactura, setRequiereFactura] = useState(factura.requiereFactura || false);
  const [rfc, setRfc] = useState(factura.rfc || "");
  const [razonSocial, setRazonSocial] = useState(factura.razonSocial || "");
  const [regimenFiscal, setRegimenFiscal] = useState(factura.regimenFiscal || "601");
  const [usoCfdi, setUsoCfdi] = useState(factura.usoCfdi || "G03");
  const [codigoPostalFiscal, setCodigoPostalFiscal] = useState(factura.codigoPostalFiscal || "");
  const [correoFiscal, setCorreoFiscal] = useState(factura.correoFiscal || cart?.contacto?.correo || "");

  const [errors, setErrors] = useState<{
    rfc?: string;
    razonSocial?: string;
    codigoPostalFiscal?: string;
  }>({});

  const handleToggle = (val: boolean) => {
    setRequiereFactura(val);
    updateFactura({ requiereFactura: val }, true);
  };

  const handleBlur = (field: string, value: string) => {
    updateFactura({ [field]: value.trim() }, true);
  };

  const validateAndProceed = (e: React.FormEvent) => {
    e.preventDefault();

    if (!requiereFactura) {
      updateFactura({ requiereFactura: false }, true);
      onNext();
      return;
    }

    const newErrors: { rfc?: string; razonSocial?: string; codigoPostalFiscal?: string } = {};

    const cleanRfc = rfc.trim().toUpperCase();
    if (!cleanRfc || cleanRfc.length < 12 || cleanRfc.length > 13) {
      newErrors.rfc = "El RFC debe tener 12 caracteres (moral) o 13 (física).";
    }

    if (!razonSocial.trim()) {
      newErrors.razonSocial = "Ingresa la razón social o nombre registrado ante el SAT.";
    }

    const cleanCp = codigoPostalFiscal.trim();
    if (!cleanCp || cleanCp.length !== 5 || !/^\d{5}$/.test(cleanCp)) {
      newErrors.codigoPostalFiscal = "Ingresa un Código Postal Fiscal válido de 5 dígitos.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    updateFactura(
      {
        requiereFactura: true,
        rfc: cleanRfc,
        razonSocial: razonSocial.trim(),
        regimenFiscal,
        usoCfdi,
        codigoPostalFiscal: cleanCp,
        correoFiscal: correoFiscal.trim(),
      },
      true
    );
    onNext();
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7A1428]/10 text-[#7A1428] text-xs font-bold mb-2">
          <span>Paso 4 de 5</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
          Datos de Facturación Fiscal (CFDI 4.0)
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          La facturación es completamente opcional. Si la necesitas, emitimos tu factura timbrada con el 100% de deducibilidad fiscal.
        </p>
      </div>

      {/* Switch / Toggle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleToggle(false)}
          className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
            !requiereFactura
              ? "border-[#7A1428] bg-[#7A1428]/5 ring-2 ring-[#7A1428]/20"
              : "border-gray-200 hover:border-gray-300 bg-white"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              !requiereFactura ? "bg-[#7A1428] text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            <Check className="w-4 h-4" />
          </div>
          <div>
            <span className="block font-bold text-sm text-gray-900">Nota de Compra Estándar</span>
            <span className="text-xs text-gray-500 block mt-0.5">
              Sin factura inmediata. Puedes solicitarla posteriormente con tu comprobante.
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleToggle(true)}
          className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
            requiereFactura
              ? "border-[#7A1428] bg-[#7A1428]/5 ring-2 ring-[#7A1428]/20"
              : "border-gray-200 hover:border-gray-300 bg-white"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              requiereFactura ? "bg-[#7A1428] text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <span className="block font-bold text-sm text-gray-900">Requiere Factura CFDI 4.0</span>
            <span className="text-xs text-gray-500 block mt-0.5">
              Deduce impuestos para tu empresa o persona física con actividad empresarial.
            </span>
          </div>
        </button>
      </div>

      <form onSubmit={validateAndProceed} className="space-y-4">
        {requiereFactura ? (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  RFC (Registro Federal de Contribuyentes) *
                </label>
                <input
                  type="text"
                  maxLength={13}
                  value={rfc}
                  onChange={(e) => setRfc(e.target.value.toUpperCase())}
                  onBlur={(e) => handleBlur("rfc", e.target.value.toUpperCase())}
                  placeholder="XAXX010101000"
                  className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-900 bg-gray-50/50 focus:bg-white focus:outline-none uppercase font-mono ${
                    errors.rfc
                      ? "border-red-400 focus:ring-2 focus:ring-red-200"
                      : "border-gray-200 focus:border-[#7A1428] focus:ring-2 focus:ring-[#7A1428]/15"
                  }`}
                />
                {errors.rfc && <p className="text-xs text-red-600 mt-1">{errors.rfc}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Código Postal Fiscal *
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={codigoPostalFiscal}
                  onChange={(e) => setCodigoPostalFiscal(e.target.value)}
                  onBlur={(e) => handleBlur("codigoPostalFiscal", e.target.value)}
                  placeholder="50140"
                  className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-900 bg-gray-50/50 focus:bg-white focus:outline-none font-mono ${
                    errors.codigoPostalFiscal
                      ? "border-red-400 focus:ring-2 focus:ring-red-200"
                      : "border-gray-200 focus:border-[#7A1428] focus:ring-2 focus:ring-[#7A1428]/15"
                  }`}
                />
                {errors.codigoPostalFiscal && (
                  <p className="text-xs text-red-600 mt-1">{errors.codigoPostalFiscal}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Razón Social / Nombre Fiscal Completo *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value.toUpperCase())}
                  onBlur={(e) => handleBlur("razonSocial", e.target.value.toUpperCase())}
                  placeholder="Sin régimen societario (ej. TRANSPORTES DEL NORTE)"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm text-gray-900 bg-gray-50/50 focus:bg-white focus:outline-none uppercase ${
                    errors.razonSocial
                      ? "border-red-400 focus:ring-2 focus:ring-red-200"
                      : "border-gray-200 focus:border-[#7A1428] focus:ring-2 focus:ring-[#7A1428]/15"
                  }`}
                />
              </div>
              {errors.razonSocial && <p className="text-xs text-red-600 mt-1">{errors.razonSocial}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Régimen Fiscal SAT *
                </label>
                <select
                  value={regimenFiscal}
                  onChange={(e) => {
                    setRegimenFiscal(e.target.value);
                    updateFactura({ regimenFiscal: e.target.value }, true);
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs text-gray-900 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-[#7A1428] focus:ring-2 focus:ring-[#7A1428]/15 font-medium"
                >
                  {REGIMENES_FISCALES.map((r) => (
                    <option key={r.clave} value={r.clave}>
                      {r.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Uso de CFDI *
                </label>
                <select
                  value={usoCfdi}
                  onChange={(e) => {
                    setUsoCfdi(e.target.value);
                    updateFactura({ usoCfdi: e.target.value }, true);
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs text-gray-900 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-[#7A1428] focus:ring-2 focus:ring-[#7A1428]/15 font-medium"
                >
                  {USOS_CFDI.map((u) => (
                    <option key={u.clave} value={u.clave}>
                      {u.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Correo Electrónico para Entrega de Factura (XML y PDF)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={correoFiscal}
                  onChange={(e) => setCorreoFiscal(e.target.value)}
                  onBlur={(e) => handleBlur("correoFiscal", e.target.value)}
                  placeholder="facturacion@empresa.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-[#7A1428] focus:ring-2 focus:ring-[#7A1428]/15"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-600 space-y-1">
            <p className="font-semibold text-gray-800">Has seleccionado nota de venta estándar.</p>
            <p>
              Tu orden se procesará de forma inmediata. Al realizar tu pago se adjuntará tu comprobante digital y podrás facturar dentro del mes en curso contactando a nuestro equipo administrativo.
            </p>
          </div>
        )}

        <div className="pt-4 flex items-center justify-between gap-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-5 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Unidades</span>
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#7A1428] hover:bg-[#4A0C18] text-white font-bold text-sm rounded-xl shadow-md transition-all hover:scale-[1.02]"
          >
            <span>Continuar a Métodos de Pago</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

