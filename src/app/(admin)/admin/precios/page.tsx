"use client";

import { useEffect, useState } from "react";
import { PricingSettings, TravelFee } from "@/types/pricing";
import { formatMxn, parseToCentavos } from "@/lib/pricing";
import { adminFetch } from "@/lib/auth/admin-fetch";
import { Sliders, MapPin, CheckCircle2, Save, AlertTriangle, ShieldCheck } from "lucide-react";

export default function AdminPreciosPage() {
  const [pricing, setPricing] = useState<PricingSettings | null>(null);
  const [travelFees, setTravelFees] = useState<TravelFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSavingPricing, setIsSavingPricing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null);
  const [tempVisitaPesos, setTempVisitaPesos] = useState("");
  const [tempUnidadPesos, setTempUnidadPesos] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await adminFetch("/api/admin/precios");
      const data = await res.json();
      if (res.ok) {
        setPricing(data.pricing);
        setTravelFees(data.travelFees || []);
      }
    } catch (e) {
      console.error("Error al cargar reglas de precio:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pricing) return;
    setIsSavingPricing(true);
    try {
      const res = await adminFetch("/api/admin/precios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "pricing", data: pricing }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar reglas de precio");
      showToast("Reglas comerciales y de IVA actualizadas y auditadas");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSavingPricing(false);
    }
  };

  const handleToggleFeeSinCosto = async (fee: TravelFee) => {
    try {
      const updated = { ...fee, sinCosto: !fee.sinCosto };
      const res = await adminFetch("/api/admin/precios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "travelFee", id: fee.id, data: updated }),
      });
      if (!res.ok) throw new Error("Error al actualizar viático");
      setTravelFees((prev) => prev.map((f) => (f.id === fee.id ? updated : f)));
      showToast(`Viático para ${fee.estadoNombre}: ${!fee.sinCosto ? "Marcado SIN COSTO" : "Con costo activo"}`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveFeeMontos = async (fee: TravelFee) => {
    try {
      const updated = {
        ...fee,
        montoPorVisitaCentavos: parseToCentavos(tempVisitaPesos),
        montoPorUnidadCentavos: parseToCentavos(tempUnidadPesos),
      };
      const res = await adminFetch("/api/admin/precios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "travelFee", id: fee.id, data: updated }),
      });
      if (!res.ok) throw new Error("Error al actualizar viático");
      setTravelFees((prev) => prev.map((f) => (f.id === fee.id ? updated : f)));
      setEditingFeeId(null);
      showToast(`Montos actualizados para ${fee.estadoNombre}`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading || !pricing) {
    return <div className="text-center py-20 text-gray-500 text-xs">Cargando reglas y viáticos...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1C1C1E] text-white text-xs px-4 py-2.5 rounded-xl shadow-lg border border-white/10 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Precios, Descuentos y Viáticos</h1>
        <p className="text-xs text-gray-500">
          Configuración global del motor de cálculo `calcularCotizacion()`. Todo cambio se registra en `auditLog`.
        </p>
      </div>

      {/* Formulario de Reglas Globales */}
      <form onSubmit={handleSavePricing} className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#7A1428]" />
            <h2 className="text-sm font-bold text-gray-900">Reglas Comerciales Globales</h2>
          </div>
          <button
            type="submit"
            disabled={isSavingPricing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#7A1428] hover:bg-[#4A0C18] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSavingPricing ? "Guardando..." : "Guardar Reglas"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* IVA */}
          <div className="space-y-1.5 p-3.5 rounded-xl bg-gray-50/70 border border-gray-200/70">
            <label className="text-xs font-bold text-gray-700 block">IVA Federal (%)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={pricing.ivaPorcentaje}
                onChange={(e) => setPricing({ ...pricing, ivaPorcentaje: Number(e.target.value) })}
                className="w-20 text-sm font-bold px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white"
              />
              <span className="text-xs text-gray-500">% sobre subtotal</span>
            </div>
            <p className="text-[11px] text-gray-500">Por ley mexicana: 16%</p>
          </div>

          {/* Descuento por Volumen */}
          <div className="space-y-1.5 p-3.5 rounded-xl bg-gray-50/70 border border-gray-200/70">
            <label className="text-xs font-bold text-gray-700 block">Descuento por Volumen (%)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={pricing.descuentoVolumen.porcentaje}
                onChange={(e) =>
                  setPricing({
                    ...pricing,
                    descuentoVolumen: {
                      ...pricing.descuentoVolumen,
                      porcentaje: Number(e.target.value),
                    },
                  })
                }
                className="w-20 text-sm font-bold px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white"
              />
              <span className="text-xs text-gray-500">% de descuento</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-1">
              <span>Al superar:</span>
              <input
                type="number"
                min="1"
                value={pricing.descuentoVolumen.umbralUnidades}
                onChange={(e) =>
                  setPricing({
                    ...pricing,
                    descuentoVolumen: {
                      ...pricing.descuentoVolumen,
                      umbralUnidades: Number(e.target.value),
                    },
                  })
                }
                className="w-14 text-xs font-semibold px-1 py-0.5 border border-gray-300 rounded bg-white"
              />
              <span>unidades</span>
            </div>
          </div>

          {/* Tope Vendedor */}
          <div className="space-y-1.5 p-3.5 rounded-xl bg-gray-50/70 border border-gray-200/70">
            <label className="text-xs font-bold text-gray-700 block">Tope Descuento Vendedor (%)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={pricing.topeDescuentoVendedor}
                onChange={(e) =>
                  setPricing({ ...pricing, topeDescuentoVendedor: Number(e.target.value) })
                }
                className="w-20 text-sm font-bold px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white"
              />
              <span className="text-xs text-gray-500">% máx discrecional</span>
            </div>
            <p className="text-[11px] text-gray-500">Límite para cotizaciones de asesores</p>
          </div>

          {/* Vigencia Cotizaciones */}
          <div className="space-y-1.5 p-3.5 rounded-xl bg-gray-50/70 border border-gray-200/70">
            <label className="text-xs font-bold text-gray-700 block">Vigencia de Cotización</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={pricing.vigenciaDias}
                onChange={(e) => setPricing({ ...pricing, vigenciaDias: Number(e.target.value) })}
                className="w-20 text-sm font-bold px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white"
              />
              <span className="text-xs text-gray-500">días naturales</span>
            </div>
            <p className="text-[11px] text-gray-500">Expira enlace de pago público</p>
          </div>

          {/* Instalación de Accesorios con Equipo Principal */}
          <div className="space-y-1.5 p-3.5 rounded-xl bg-gray-50/70 border border-gray-200/70 col-span-1 sm:col-span-2 lg:col-span-4">
            <label className="text-xs font-bold text-gray-700 block">Regla de Instalación de Accesorios</label>
            <label className="flex items-center gap-2 cursor-pointer mt-1">
              <input
                type="checkbox"
                checked={pricing.instalacionAccesorioConEquipo ?? false}
                onChange={(e) =>
                  setPricing({
                    ...pricing,
                    instalacionAccesorioConEquipo: e.target.checked,
                  })
                }
                className="w-4 h-4 text-[#7A1428] rounded border-gray-300 focus:ring-[#7A1428]"
              />
              <span className="text-xs font-semibold text-gray-800">
                Cobrar instalación de accesorios aun cuando la cotización incluya un equipo principal con instalación
              </span>
            </label>
            <p className="text-[11px] text-gray-500">
              Por defecto desactivado: Si la cotización incluye un equipo principal con instalación incluida, los accesorios no cobran mano de obra por separado ($0). Si se activa, cada accesorio cobrará su mano de obra técnica independiente ($950.00 MXN s/IVA).
            </p>
          </div>
        </div>
      </form>

      {/* Matriz de Viáticos por Estado (32 Estados) */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#7A1428]" />
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                Matriz de Viáticos por Estado (32 Entidades Federativas)
              </h2>
              <p className="text-xs text-gray-500">
                Estados marcados sin costo: Estado de México (Toluca), CDMX, Nuevo León (MTY), Jalisco (GDL) y Querétaro.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full self-start">
            {travelFees.filter((f) => f.sinCosto).length} estados sin costo
          </span>
        </div>

        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 uppercase tracking-wider text-[10px] sticky top-0 z-10">
              <tr>
                <th className="px-5 py-3">Clave / Estado</th>
                <th className="px-4 py-3">Monto por Visita</th>
                <th className="px-4 py-3">Monto por Unidad Adicional</th>
                <th className="px-4 py-3">Estatus de Cobertura</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {travelFees.map((fee) => {
                const isEditing = editingFeeId === fee.id;
                return (
                  <tr
                    key={fee.id}
                    className={`hover:bg-gray-50/70 transition-colors ${
                      fee.sinCosto ? "bg-emerald-50/20" : ""
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-gray-900 flex items-center gap-2">
                        <span className="font-mono text-[10px] text-gray-500 px-1.5 py-0.5 rounded bg-gray-100">
                          {fee.claveInegi}
                        </span>
                        <span>{fee.estadoNombre}</span>
                      </div>
                      {fee.notas && <p className="text-[11px] text-gray-500 mt-0.5">{fee.notas}</p>}
                    </td>

                    <td className="px-4 py-3.5">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={tempVisitaPesos}
                          onChange={(e) => setTempVisitaPesos(e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-xs"
                        />
                      ) : (
                        <span className="font-semibold text-gray-800">
                          {fee.sinCosto ? "$0.00" : formatMxn(fee.montoPorVisitaCentavos)}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={tempUnidadPesos}
                          onChange={(e) => setTempUnidadPesos(e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-xs"
                        />
                      ) : (
                        <span className="font-semibold text-gray-800">
                          {fee.sinCosto ? "$0.00" : formatMxn(fee.montoPorUnidadCentavos)}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      {fee.sinCosto ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Sin Costo (Exento)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full">
                          Con viático regular
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right space-x-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSaveFeeMontos(fee)}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px] font-bold"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => setEditingFeeId(null)}
                            className="px-2 py-1 text-gray-500 hover:text-gray-700 text-[11px]"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingFeeId(fee.id);
                              setTempVisitaPesos((fee.montoPorVisitaCentavos / 100).toFixed(2));
                              setTempUnidadPesos((fee.montoPorUnidadCentavos / 100).toFixed(2));
                            }}
                            className="text-xs text-[#7A1428] hover:underline font-semibold"
                          >
                            Editar montos
                          </button>
                          <button
                            onClick={() => handleToggleFeeSinCosto(fee)}
                            className="text-xs text-gray-500 hover:text-gray-900 underline"
                          >
                            {fee.sinCosto ? "Cobrar viático" : "Hacer gratis"}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

