"use client";

import React, { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import {
  MapPin,
  Building,
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Wrench,
} from "lucide-react";
import { initialTravelFees } from "../../../scripts/seed-data";
import { getMunicipiosSinCosto, esMunicipioSinCosto } from "@/lib/pricing/zonas-sin-costo";

interface Step2InstalacionProps {
  onNext: () => void;
  onBack: () => void;
  instalacionEnTaller?: boolean; // REGLA 4: Desactivada por defecto hasta confirmación del cliente
}

export const DIRECCION_TALLER_MATRIZ = "Segunda privada Callejón del Sol #44, Col. San Jerónimo Chicahualco, C.P. 52170, Metepec, Estado de México";

export function Step2Instalacion({ onNext, onBack, instalacionEnTaller = false }: Step2InstalacionProps) {
  const { cart, updateInstalacion } = useCart();
  const instalacion = cart?.instalacion || {};

  const [estadoClave, setEstadoClave] = useState(instalacion.estadoClave || "MEX");
  const [municipio, setMunicipio] = useState(instalacion.municipio || "");
  const [direccion, setDireccion] = useState(instalacion.direccion || "");
  const [tipoLugar, setTipoLugar] = useState<"domicilio" | "taller_cosoavl">(
    instalacionEnTaller ? (instalacion.tipoLugar || "domicilio") : "domicilio"
  );
  const [fechaTentativa, setFechaTentativa] = useState(instalacion.fechaTentativa || "");
  const [horarioTentativo, setHorarioTentativo] = useState<"manana" | "tarde" | "completo">(
    instalacion.horarioTentativo || "manana"
  );
  const [referencias, setReferencias] = useState(instalacion.referencias || "");
  const [errors, setErrors] = useState<{ estado?: string; municipio?: string; direccion?: string }>({});

  const municipiosDisponibles = getMunicipiosSinCosto(estadoClave);
  const tieneZonaSinCosto = municipiosDisponibles.length > 0;
  const esOtroMunicipioInicial = tieneZonaSinCosto && Boolean(municipio) && !municipiosDisponibles.includes(municipio);
  const [esModoOtro, setEsModoOtro] = useState(esOtroMunicipioInicial);
  const [municipioOtroTexto, setMunicipioOtroTexto] = useState(esOtroMunicipioInicial ? municipio : "");

  // Si no había municipio pero el estado tiene lista, inicializamos con el primero
  useEffect(() => {
    if (!municipio && municipiosDisponibles.length > 0) {
      setMunicipio(municipiosDisponibles[0]);
    }
  }, [estadoClave, municipiosDisponibles, municipio]);

  const esSinCostoActual = esMunicipioSinCosto(estadoClave, esModoOtro ? municipioOtroTexto : municipio);

  const handleEstadoChange = (nuevaClave: string) => {
    setEstadoClave(nuevaClave);
    const nuevosMunicipios = getMunicipiosSinCosto(nuevaClave);
    const primerMunicipio = nuevosMunicipios.length > 0 ? nuevosMunicipios[0] : "";
    setMunicipio(primerMunicipio);
    setEsModoOtro(false);
    setMunicipioOtroTexto("");
    const fee = initialTravelFees.find((t) => t.id === nuevaClave);
    const esSinCosto = nuevosMunicipios.length > 0;

    updateInstalacion(
      {
        estadoClave: nuevaClave,
        estadoNombre: fee?.estadoNombre || nuevaClave,
        municipio: primerMunicipio,
        viaticosPorConfirmar: !esSinCosto,
      },
      true
    );
  };

  const handleMunicipioSelectChange = (val: string) => {
    if (val === "otro") {
      setEsModoOtro(true);
      const nuevoMun = municipioOtroTexto.trim() || "Otro municipio";
      setMunicipio(nuevoMun);
      updateInstalacion({ municipio: nuevoMun, viaticosPorConfirmar: true }, true);
    } else {
      setEsModoOtro(false);
      setMunicipio(val);
      updateInstalacion({ municipio: val, viaticosPorConfirmar: false }, true);
    }
  };

  const handleMunicipioOtroChange = (val: string) => {
    setMunicipioOtroTexto(val);
    setMunicipio(val);
    updateInstalacion({ municipio: val.trim(), viaticosPorConfirmar: true }, true);
  };

  const handleBlur = (field: string, value: string) => {
    updateInstalacion({ [field]: value.trim() }, true);
  };

  const validateAndProceed = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { estado?: string; municipio?: string; direccion?: string } = {};

    if (!estadoClave) {
      newErrors.estado = "Selecciona el estado para la instalación.";
    }

    const munFinal = esModoOtro ? municipioOtroTexto.trim() : municipio.trim();
    if (!munFinal) {
      newErrors.municipio = "Selecciona o ingresa el municipio o alcaldía.";
    }

    if (tipoLugar === "domicilio" && !direccion.trim()) {
      newErrors.direccion = "Ingresa la dirección o ubicación para la instalación.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    const fee = initialTravelFees.find((t) => t.id === estadoClave);
    const esTaller = instalacionEnTaller && tipoLugar === "taller_cosoavl";
    const esSinCosto = esTaller || esMunicipioSinCosto(estadoClave, munFinal);

    updateInstalacion(
      {
        estadoClave: esTaller ? "MEX" : estadoClave,
        estadoNombre: esTaller ? "Estado de México" : (fee?.estadoNombre || estadoClave),
        municipio: esTaller ? "Metepec" : munFinal,
        direccion: esTaller ? DIRECCION_TALLER_MATRIZ : direccion.trim(),
        tipoLugar: esTaller ? "taller_cosoavl" : "domicilio",
        fechaTentativa,
        horarioTentativo,
        referencias: referencias.trim(),
        viaticosPorConfirmar: !esSinCosto,
        viaticosCentavos: esSinCosto ? 0 : undefined,
      },
      true
    );
    onNext();
  };

  // Fecha mínima: 2 días hábiles hacia adelante (formato YYYY-MM-DD)
  const minDate = new Date(Date.now() + 48 * 3600 * 1000).toISOString().split("T")[0];

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7A1428]/10 text-[#7A1428] text-xs font-bold mb-2">
          <span>Paso 2 de 5</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
          Lugar y Fecha de Instalación Técnica
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Nuestros técnicos certificados pueden acudir a tu domicilio/empresa o puedes acudir al taller matriz de CoSoAVL.
        </p>
      </div>

      <form onSubmit={validateAndProceed} className="space-y-5">
        {/* Modalidad de instalación */}
        {instalacionEnTaller ? (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
              Modalidad de Instalación *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setTipoLugar("domicilio");
                  updateInstalacion({ tipoLugar: "domicilio" }, true);
                }}
                className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  tipoLugar === "domicilio"
                    ? "border-[#7A1428] bg-[#7A1428]/5 ring-2 ring-[#7A1428]/20"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    tipoLugar === "domicilio" ? "bg-[#7A1428] text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-bold text-sm text-gray-900">A Domicilio / En Empresa</span>
                  <span className="text-xs text-gray-500 block mt-0.5">
                    El técnico acude a tu cochera, nave o patio de maniobras.
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTipoLugar("taller_cosoavl");
                  updateInstalacion({ tipoLugar: "taller_cosoavl", direccion: DIRECCION_TALLER_MATRIZ }, true);
                }}
                className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  tipoLugar === "taller_cosoavl"
                    ? "border-[#7A1428] bg-[#7A1428]/5 ring-2 ring-[#7A1428]/20"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    tipoLugar === "taller_cosoavl" ? "bg-[#7A1428] text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-bold text-sm text-gray-900">Taller Matriz CoSoAVL</span>
                  <span className="text-xs text-gray-500 block mt-0.5">
                    Metepec, Estado de México (Sin costo de viáticos).
                  </span>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#7A1428]/10 text-[#7A1428] flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block">
                Instalación Técnica a Domicilio o Empresa
              </span>
              <span className="text-[11px] text-gray-500 block">
                Nuestros técnicos certificados acudirán a la ubicación que indiques a continuación.
              </span>
            </div>
          </div>
        )}

        {/* Estado y Viáticos */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
            Estado de la República *
          </label>
          <select
            value={estadoClave}
            onChange={(e) => handleEstadoChange(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-[#7A1428] focus:ring-2 focus:ring-[#7A1428]/15 font-medium"
          >
            {initialTravelFees.map((fee) => (
              <option key={fee.id} value={fee.id}>
                {fee.estadoNombre} {fee.sinCosto ? "— [Zona Metropolitana sin costo]" : "— [Se cotiza]"}
              </option>
            ))}
          </select>
        </div>

        {/* Municipio y Dirección */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Municipio / Alcaldía *
              </label>

              {tieneZonaSinCosto ? (
                <div className="space-y-2">
                  <select
                    value={esModoOtro ? "otro" : municipio}
                    onChange={(e) => handleMunicipioSelectChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-[#7A1428] focus:ring-2 focus:ring-[#7A1428]/15 font-medium"
                  >
                    <option value="" disabled>-- Selecciona tu municipio --</option>
                    {municipiosDisponibles.map((m) => (
                      <option key={m} value={m}>
                        {m} (Sin costo de viáticos)
                      </option>
                    ))}
                    <option value="otro">Otro municipio (Resto del estado — se cotiza)</option>
                  </select>

                  {esModoOtro && (
                    <input
                      type="text"
                      value={municipioOtroTexto}
                      onChange={(e) => handleMunicipioOtroChange(e.target.value)}
                      placeholder="Escribe el nombre de tu municipio..."
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#7A1428] focus:ring-2 focus:ring-[#7A1428]/15"
                    />
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  name="municipio"
                  value={municipio}
                  onChange={(e) => setMunicipio(e.target.value)}
                  onBlur={(e) => handleBlur("municipio", e.target.value)}
                  placeholder="Ej. Puebla, Cuernavaca, Pachuca..."
                  className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-900 bg-gray-50/50 focus:bg-white focus:outline-none transition-all ${
                    errors.municipio
                      ? "border-red-400 focus:ring-2 focus:ring-red-200"
                      : "border-gray-200 focus:border-[#7A1428] focus:ring-2 focus:ring-[#7A1428]/15"
                  }`}
                />
              )}
              {errors.municipio && <p className="text-xs text-red-600 mt-1">{errors.municipio}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                {tipoLugar === "domicilio" ? "Dirección Completa *" : "Ubicación del Taller"}
              </label>
              <input
                type="text"
                name="direccion"
                disabled={tipoLugar === "taller_cosoavl"}
                value={tipoLugar === "taller_cosoavl" ? "Taller Matriz CoSoAVL Metepec" : direccion}
                onChange={(e) => setDireccion(e.target.value)}
                onBlur={(e) => handleBlur("direccion", e.target.value)}
                placeholder="Calle, Número, Colonia y C.P."
                className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-900 bg-gray-50/50 focus:bg-white focus:outline-none transition-all ${
                  errors.direccion
                    ? "border-red-400 focus:ring-2 focus:ring-red-200"
                    : "border-gray-200 focus:border-[#7A1428] focus:ring-2 focus:ring-[#7A1428]/15"
                }`}
              />
              {errors.direccion && <p className="text-xs text-red-600 mt-1">{errors.direccion}</p>}
            </div>
          </div>

          {/* Banner de Viáticos dinámico por Municipio */}
          {tipoLugar === "taller_cosoavl" ? (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>¡Sin costo de viáticos!</strong> Instalación programada directamente en el Taller Matriz CoSoAVL Metepec.
              </span>
            </div>
          ) : esSinCostoActual ? (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>¡Sin costo de viáticos!</strong> El municipio seleccionado ({esModoOtro ? municipioOtroTexto : municipio}) forma parte de la zona metropolitana oficial cubierta directamente por nuestros técnicos.
              </span>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Viáticos por confirmar (Se cotiza)</strong>
                <span className="text-[11px] text-amber-800 block mt-0.5">
                  El checkout no te cobrará viáticos en este momento. Tu orden se guardará con estatus de <em>"viáticos por confirmar"</em> y un asesor te contactará para validar la distancia exacta y cotizarte los viáticos según kilometraje y casetas.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Fecha y Horario Tentativo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Fecha Tentativa Preferida
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                min={minDate}
                value={fechaTentativa}
                onChange={(e) => {
                  setFechaTentativa(e.target.value);
                  updateInstalacion({ fechaTentativa: e.target.value }, true);
                }}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-[#7A1428] focus:ring-2 focus:ring-[#7A1428]/15"
              />
            </div>
            <span className="text-[11px] text-gray-400 block mt-1">Sujeta a confirmación de agenda técnica</span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Horario Preferido
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <select
                value={horarioTentativo}
                onChange={(e) => {
                  const val = e.target.value as "manana" | "tarde" | "completo";
                  setHorarioTentativo(val);
                  updateInstalacion({ horarioTentativo: val }, true);
                }}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-[#7A1428] focus:ring-2 focus:ring-[#7A1428]/15"
              >
                <option value="manana">Matutino (9:00 AM - 1:00 PM)</option>
                <option value="tarde">Vespertino (1:00 PM - 6:00 PM)</option>
                <option value="completo">Cualquier horario disponible</option>
              </select>
            </div>
          </div>
        </div>

        {/* Referencias del lugar */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
            Referencias o Indicaciones para el Instalador
          </label>
          <textarea
            rows={2}
            value={referencias}
            onChange={(e) => setReferencias(e.target.value)}
            onBlur={(e) => handleBlur("referencias", e.target.value)}
            placeholder="Ej. Portón blanco, preguntar por Ing. Carlos, acceso por caseta principal..."
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-[#7A1428] focus:ring-2 focus:ring-[#7A1428]/15"
          />
        </div>

        <div className="pt-4 flex items-center justify-between gap-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-5 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Contacto</span>
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#7A1428] hover:bg-[#4A0C18] text-white font-bold text-sm rounded-xl shadow-md transition-all hover:scale-[1.02]"
          >
            <span>Continuar a Unidades</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

