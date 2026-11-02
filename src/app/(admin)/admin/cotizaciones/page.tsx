"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
  Phone,
  Mail,
  Copy,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Check,
  ExternalLink,
  DollarSign,
  User,
  Filter,
} from "lucide-react";
import { Quote, QuoteStatus } from "@/types/quote";
import { formatMxn } from "@/lib/pricing";
import { buildEnvioCotizacionWhatsAppLink } from "@/lib/utils/whatsapp";

export default function AdminCotizacionesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState<"admin" | "vendedor">("admin");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [copiedFolio, setCopiedFolio] = useState<string | null>(null);

  // Modal para autorizar descuento (Admin)
  const [autorizarModal, setAutorizarModal] = useState<Quote | null>(null);
  const [autorizando, setAutorizando] = useState(false);
  const [motivoAutorizacion, setMotivoAutorizacion] = useState("");

  useEffect(() => {
    cargarCotizaciones();
  }, [currentRole, filtroEstado]);

  const cargarCotizaciones = async () => {
    try {
      setLoading(true);
      const token = currentRole === "admin" ? "test-token-admin" : "test-token-vendedor";
      let url = `/api/admin/cotizaciones`;
      const params = new URLSearchParams();
      if (filtroEstado !== "todos") params.append("estado", filtroEstado);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setQuotes(data.quotes || []);
      }
    } catch (e) {
      console.error("Error cargando cotizaciones:", e);
    } finally {
      setLoading(false);
    }
  };

  const copiarEnlace = (q: Quote) => {
    const url = `${window.location.origin}${q.urlPublica}`;
    navigator.clipboard.writeText(url);
    setCopiedFolio(q.folio);
    setTimeout(() => setCopiedFolio(null), 2500);
  };

  const handleResolverAutorizacion = async (accion: "aprobar" | "rechazar") => {
    if (!autorizarModal) return;
    try {
      setAutorizando(true);
      const res = await fetch(`/api/admin/cotizaciones/${autorizarModal.folio}/autorizar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token-admin",
        },
        body: JSON.stringify({
          accion,
          motivo: motivoAutorizacion,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAutorizarModal(null);
        setMotivoAutorizacion("");
        cargarCotizaciones();
      }
    } catch (e) {
      console.error("Error al procesar autorización:", e);
    } finally {
      setAutorizando(false);
    }
  };

  const cotizacionesFiltradas = quotes.filter((q) => {
    if (!busqueda) return true;
    const s = busqueda.toLowerCase();
    return (
      q.folio.toLowerCase().includes(s) ||
      (q.cliente.nombre && q.cliente.nombre.toLowerCase().includes(s)) ||
      q.cliente.empresa?.toLowerCase().includes(s) ||
      q.cliente.telefono.includes(s)
    );
  });

  // Métricas
  const totalMontoCentavos = quotes.reduce((acc, q) => acc + (q.calculo?.totalCentavos || 0), 0);
  const pendientesAutorizacionCount = quotes.filter((q) => q.estado === "pendiente_autorizacion").length;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Cotizador de Vendedores</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#7A1428]/10 text-[#7A1428]">
              CoSoAVL
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Propuestas comerciales oficiales, control de descuentos y seguimiento de pagos en línea.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Selector de rol para simulación y pruebas */}
          <select
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value as any)}
            className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 font-semibold focus:outline-none"
          >
            <option value="admin">Vista Admin (Ver todas)</option>
            <option value="vendedor">Vista Vendedor (Solo mis cotizaciones)</option>
          </select>

          <Link
            href="/admin/cotizaciones/nueva"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#7A1428] hover:bg-[#4A0C18] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nueva Cotización</span>
          </Link>
        </div>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Cotizaciones Registradas
          </span>
          <span className="text-2xl font-black text-gray-900">{quotes.length}</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Monto Total del Periodo
          </span>
          <span className="text-2xl font-black text-[#7A1428] font-mono">
            {formatMxn(totalMontoCentavos)}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Pendientes de Autorización
          </span>
          <span
            className={`text-2xl font-black ${
              pendientesAutorizacionCount > 0 ? "text-amber-600" : "text-gray-400"
            }`}
          >
            {pendientesAutorizacionCount}
          </span>
        </div>
      </div>

      {/* Barra de Filtros y Buscador */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Chips de Estados */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: "todos", label: "Todas" },
            { id: "enviada", label: "Enviadas" },
            { id: "vista", label: "Vistas por Cliente" },
            { id: "pendiente_autorizacion", label: "Por Autorizar" },
            { id: "pagada", label: "Pagadas" },
            { id: "vencida", label: "Vencidas" },
          ].map((chip) => (
            <button
              key={chip.id}
              onClick={() => setFiltroEstado(chip.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                filtroEstado === chip.id
                  ? "bg-[#7A1428] text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por folio, cliente o teléfono..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:border-[#7A1428]"
          />
        </div>
      </div>

      {/* Lista de Cotizaciones */}
      {loading ? (
        <div className="py-20 text-center text-xs text-gray-400">Cargando cotizaciones...</div>
      ) : cotizacionesFiltradas.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-gray-200 space-y-3">
          <FileText className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="font-bold text-gray-900 text-sm">No hay cotizaciones para mostrar</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {filtroEstado !== "todos"
              ? `No se encontraron cotizaciones con el filtro seleccionado.`
              : "Comienza emitiendo una nueva cotización para tu cliente."}
          </p>
          <Link
            href="/admin/cotizaciones/nueva"
            className="inline-block px-4 py-2 bg-[#7A1428] text-white text-xs font-bold rounded-xl hover:bg-[#4A0C18]"
          >
            Nueva Cotización
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Folio y Versión</th>
                  <th className="px-6 py-3.5 font-bold">Cliente</th>
                  <th className="px-6 py-3.5 font-bold">Inversión (Total con IVA)</th>
                  <th className="px-6 py-3.5 font-bold">Plan y Descuento</th>
                  <th className="px-6 py-3.5 font-bold">Estado y Seguimiento</th>
                  <th className="px-6 py-3.5 font-bold text-right">Acciones Comerciales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cotizacionesFiltradas.map((q) => {
                  const esPendiente = q.estado === "pendiente_autorizacion";
                  const totalFormatted = formatMxn(q.calculo?.totalCentavos || 0);
                  const whatsappLink = buildEnvioCotizacionWhatsAppLink({
                    clienteWhatsapp: q.cliente.telefono,
                    clienteNombre: q.cliente.nombre || "Cliente",
                    folio: q.folio,
                    token: q.token || "token",
                    totalFormateado: totalFormatted,
                  });

                  return (
                    <tr key={q.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Folio */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-sm text-[#7A1428]">{q.folio}</span>
                          {(q.version || 1) > 1 && (
                            <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded font-bold">
                              v{q.version}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-400 block mt-0.5">
                          {new Date(q.createdAt).toLocaleDateString("es-MX", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium">Asesor: {q.vendedorNombre}</span>
                      </td>

                      {/* Cliente */}
                      <td className="px-6 py-4 space-y-0.5">
                        <strong className="text-sm font-bold text-gray-900 block">{q.cliente.nombre}</strong>
                        {q.cliente.empresa && (
                          <span className="text-[11px] text-gray-500 block">{q.cliente.empresa}</span>
                        )}
                        <a
                          href={`https://wa.me/521${q.cliente.telefono}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-semibold text-emerald-700 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <Phone className="w-3 h-3 text-[#25D366]" />
                          <span>{q.cliente.whatsappDisplay || q.cliente.telefono}</span>
                        </a>
                      </td>

                      {/* Total */}
                      <td className="px-6 py-4">
                        <span className="text-base font-black text-gray-900 font-mono block">
                          {totalFormatted}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {q.items?.length || 0} conceptos • IVA incluido
                        </span>
                      </td>

                      {/* Plan y Descuento */}
                      <td className="px-6 py-4 space-y-1">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-700">
                          {q.condiciones?.planSeleccionado === "credi_contado"
                            ? "Credi-Contado (55%/45%)"
                            : q.condiciones?.planSeleccionado === "contado"
                            ? "Contado (100%)"
                            : "Financiamiento"}
                        </span>
                        {(q.condiciones?.descuentoAdicionalPorcentaje ?? 0) > 0 && (
                          <span className="text-[11px] font-bold text-emerald-700 block">
                            Desc. Comercial: {q.condiciones?.descuentoAdicionalPorcentaje}%
                          </span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4 space-y-1">
                        {esPendiente ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" />
                            <span>Pendiente Autorización</span>
                          </span>
                        ) : q.estado === "pagada" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Pagada</span>
                          </span>
                        ) : q.estado === "vista" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            <ExternalLink className="w-3 h-3" />
                            <span>Vista ({q.vecesVista || 1} veces)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                            <span>Enviada</span>
                          </span>
                        )}

                        {q.fechaPrimeraVista && (
                          <span className="text-[10px] text-gray-400 block">
                            Abierta:{" "}
                            {new Date(q.fechaPrimeraVista).toLocaleDateString("es-MX", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4 text-right">
                        {esPendiente ? (
                          <div className="flex flex-col items-end gap-1.5">
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Bloqueado hasta autorización
                            </span>
                            {currentRole === "admin" && (
                              <button
                                onClick={() => setAutorizarModal(q)}
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-lg shadow-xs"
                              >
                                Resolver Autorización
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            {/* Copiar Link */}
                            <button
                              onClick={() => copiarEnlace(q)}
                              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                              title="Copiar enlace de cotización"
                            >
                              {copiedFolio === q.folio ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Enviar WhatsApp */}
                            <a
                              href={whatsappLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </a>

                            {/* Descargar PDF */}
                            <a
                              href={`/api/admin/cotizaciones/${q.folio}/pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                              title="Descargar PDF Carta"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Autorizar Descuento (Admin) */}
      {autorizarModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-gray-100">
            <h3 className="font-bold text-base text-gray-900">
              Autorizar Descuento — Folio {autorizarModal.folio}
            </h3>
            <p className="text-xs text-gray-500">
              El asesor <strong>{autorizarModal.vendedorNombre}</strong> solicitó un descuento del{" "}
              <strong>{autorizarModal.condiciones?.descuentoAdicionalPorcentaje ?? 0}%</strong> (Tope ordinario: 5%).
            </p>

            {autorizarModal.condiciones?.justificacionDescuento && (
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                <span className="font-bold text-gray-700 block">Justificación del Asesor:</span>
                <p className="text-gray-600 mt-0.5">{autorizarModal.condiciones.justificacionDescuento}</p>
              </div>
            )}

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-gray-700">Comentario o Motivo de Resolución (Opcional)</label>
              <textarea
                rows={2}
                value={motivoAutorizacion}
                onChange={(e) => setMotivoAutorizacion(e.target.value)}
                placeholder="Indica la resolución que se notificará al vendedor..."
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setAutorizarModal(null)}
                className="px-4 py-2 border border-gray-200 text-gray-600 font-bold text-xs rounded-xl"
              >
                Cerrar
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={autorizando}
                  onClick={() => handleResolverAutorizacion("rechazar")}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200"
                >
                  Rechazar
                </button>
                <button
                  type="button"
                  disabled={autorizando}
                  onClick={() => handleResolverAutorizacion("aprobar")}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Aprobar Descuento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
