"use client";

import React, { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { Truck, ArrowRight, ArrowLeft, ShieldCheck, Car, HelpCircle } from "lucide-react";
import { CartUnidadVehiculo } from "@/types/cart";

interface Step3UnidadesProps {
  onNext: () => void;
  onBack: () => void;
}

export function Step3Unidades({ onNext, onBack }: Step3UnidadesProps) {
  const { cart, updateUnidades } = useCart();
  const items = cart?.items || [];

  // Calcular número de equipos principales
  const equiposPrincipales = items.filter((i) => i.esEquipoPrincipal);
  const totalEquipos = equiposPrincipales.reduce((acc, curr) => acc + curr.cantidad, 0);
  const countToDisplay = Math.max(totalEquipos, 1);

  // Inicializar o sincronizar lista de vehículos
  const [unidades, setUnidades] = useState<CartUnidadVehiculo[]>(() => {
    if (cart?.unidades && cart.unidades.length > 0) {
      return cart.unidades;
    }
    const initialList: CartUnidadVehiculo[] = [];
    let idx = 0;
    for (const eq of equiposPrincipales) {
      for (let c = 0; c < eq.cantidad; c++) {
        idx++;
        initialList.push({
          id: `vehiculo_${idx}`,
          equipoIndex: idx,
          equipoNombre: eq.nombre,
          tipoVehiculo: "auto",
          vin: "",
          placas: "",
          marca: "",
          modelo: "",
          anio: "",
          color: "",
          numeroEconomico: "",
        });
      }
    }
    if (initialList.length === 0) {
      initialList.push({
        id: "vehiculo_1",
        equipoIndex: 1,
        equipoNombre: "GPS Principal",
        tipoVehiculo: "auto",
        vin: "",
        placas: "",
        marca: "",
        modelo: "",
        anio: "",
        color: "",
        numeroEconomico: "",
      });
    }
    return initialList;
  });

  const [llenarDespues, setLlenarDespues] = useState(false);

  const handleFieldChange = (index: number, field: keyof CartUnidadVehiculo, value: string) => {
    const nextList = [...unidades];
    nextList[index] = {
      ...nextList[index],
      [field]: value,
    };
    setUnidades(nextList);
  };

  const handleBlur = () => {
    updateUnidades(unidades, true);
  };

  const handleProceed = (e: React.FormEvent) => {
    e.preventDefault();
    updateUnidades(unidades, true);
    onNext();
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7A1428]/10 text-[#7A1428] text-xs font-bold mb-2">
          <span>Paso 3 de 5</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
          Datos de las Unidades Vehiculares
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Registra los vehículos donde se instalarán los dispositivos. Si aún no tienes los datos a la mano, puedes omitirlos y proporcionarlos el día de la instalación.
        </p>
      </div>

      {/* Opción rápida de posponer */}
      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <HelpCircle className="w-5 h-5 text-gray-400 shrink-0" />
          <span className="text-xs text-gray-700">
            ¿No tienes las placas o fichas de tus vehículos en este momento?
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            setLlenarDespues(!llenarDespues);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
            llenarDespues
              ? "bg-[#7A1428] text-white border-[#7A1428]"
              : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
          }`}
        >
          {llenarDespues ? "✓ Proporcionar al técnico" : "Llenar después"}
        </button>
      </div>

      {!llenarDespues && (
        <form onSubmit={handleProceed} className="space-y-6">
          <div className="space-y-4">
            {unidades.map((u, i) => (
              <div
                key={u.id || i}
                className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-[#7A1428]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-800">
                      Unidad #{i + 1} — {u.equipoNombre || "Equipo Principal"}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400">Instalación #{i + 1}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Tipo de Unidad *
                    </label>
                    <select
                      value={u.tipoVehiculo || "auto"}
                      onChange={(e) => handleFieldChange(i, "tipoVehiculo", e.target.value)}
                      onBlur={handleBlur}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 bg-white focus:outline-none focus:border-[#7A1428]"
                    >
                      <option value="auto">Auto / Sedán</option>
                      <option value="camioneta">Camioneta / SUV</option>
                      <option value="taxi">Taxi / Plataforma</option>
                      <option value="tractocamion">Tractocamión</option>
                      <option value="camion">Camión / Torton</option>
                      <option value="moto">Motocicleta</option>
                      <option value="caja_seca">Caja Seca / Refrigerada</option>
                      <option value="maquinaria">Maquinaria Pesada</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Placas
                    </label>
                    <input
                      type="text"
                      value={u.placas || ""}
                      onChange={(e) => handleFieldChange(i, "placas", e.target.value.toUpperCase())}
                      onBlur={handleBlur}
                      placeholder="ABC-123-D"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 bg-white focus:outline-none focus:border-[#7A1428] uppercase font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Marca
                    </label>
                    <input
                      type="text"
                      value={u.marca || ""}
                      onChange={(e) => handleFieldChange(i, "marca", e.target.value)}
                      onBlur={handleBlur}
                      placeholder="Ej. Nissan, Ford"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 bg-white focus:outline-none focus:border-[#7A1428]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Modelo / Versión
                    </label>
                    <input
                      type="text"
                      value={u.modelo || ""}
                      onChange={(e) => handleFieldChange(i, "modelo", e.target.value)}
                      onBlur={handleBlur}
                      placeholder="Ej. Versa, F-150"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 bg-white focus:outline-none focus:border-[#7A1428]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Año
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={u.anio || ""}
                      onChange={(e) => handleFieldChange(i, "anio", e.target.value)}
                      onBlur={handleBlur}
                      placeholder="2024"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 bg-white focus:outline-none focus:border-[#7A1428]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Color
                    </label>
                    <input
                      type="text"
                      value={u.color || ""}
                      onChange={(e) => handleFieldChange(i, "color", e.target.value)}
                      onBlur={handleBlur}
                      placeholder="Blanco, Gris, Rojo"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 bg-white focus:outline-none focus:border-[#7A1428]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      No. Económico (Flotilla)
                    </label>
                    <input
                      type="text"
                      value={u.numeroEconomico || ""}
                      onChange={(e) => handleFieldChange(i, "numeroEconomico", e.target.value)}
                      onBlur={handleBlur}
                      placeholder="ECO-04"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 bg-white focus:outline-none focus:border-[#7A1428]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      VIN / Serie (Opcional)
                    </label>
                    <input
                      type="text"
                      maxLength={17}
                      value={u.vin || ""}
                      onChange={(e) => handleFieldChange(i, "vin", e.target.value.toUpperCase())}
                      onBlur={handleBlur}
                      placeholder="17 caracteres"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 bg-white focus:outline-none focus:border-[#7A1428] uppercase font-mono"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 flex items-center justify-between gap-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 px-5 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Instalación</span>
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#7A1428] hover:bg-[#4A0C18] text-white font-bold text-sm rounded-xl shadow-md transition-all hover:scale-[1.02]"
            >
              <span>Continuar a Facturación</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {llenarDespues && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <p>
              Has elegido proporcionar los datos de tus vehículos directamente a tu asesor técnico o al instalador en el momento del servicio.
            </p>
          </div>

          <div className="pt-4 flex items-center justify-between gap-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 px-5 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Instalación</span>
            </button>

            <button
              type="button"
              onClick={onNext}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#7A1428] hover:bg-[#4A0C18] text-white font-bold text-sm rounded-xl shadow-md transition-all hover:scale-[1.02]"
            >
              <span>Continuar a Facturación</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

