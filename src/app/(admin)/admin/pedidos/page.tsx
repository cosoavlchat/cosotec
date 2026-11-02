"use client";

import React, { useEffect, useState } from "react";
import { Order, OrderEstado } from "@/types/order";
import { formatMxn } from "@/lib/pricing";
import { adminFetch } from "@/lib/auth/admin-fetch";
import {
  DollarSign,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  FileText,
  ExternalLink,
  ShieldAlert,
  XCircle,
  Truck,
  User,
  Calendar,
  Loader2,
  RefreshCw,
  MessageCircle,
} from "lucide-react";

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState<string>("todos");
  const [filterMetodo, setFilterMetodo] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modales
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [processingAction, setProcessingAction] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await adminFetch("/api/admin/pedidos");
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders || []);
      } else {
        console.error("Error al obtener pedidos:", data.error);
      }
    } catch (err) {
      console.error("Error de conexión:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleAprobarSpei = async (folio: string) => {
    if (!confirm(`¿Confirmas la aprobación del pago SPEI para la orden ${folio}? Esto generará la orden técnica para el equipo de instalaciones.`)) {
      return;
    }

    setProcessingAction(true);
    try {
      const res = await adminFetch(`/api/admin/pedidos/${folio}/validar-spei`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "aprobar" }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al aprobar pago");
      }

      showToast(`✅ Pago de orden ${folio} aprobado con éxito. Ficha técnica generada.`);
      await fetchOrders();
      if (selectedOrder?.folio === folio) {
        setIsDetailModalOpen(false);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRechazarSpei = async () => {
    if (!selectedOrder) return;
    if (!motivoRechazo.trim()) {
      alert("Por favor ingresa el motivo del rechazo del comprobante.");
      return;
    }

    setProcessingAction(true);
    try {
      const res = await adminFetch(`/api/admin/pedidos/${selectedOrder.folio}/validar-spei`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accion: "rechazar",
          motivoRechazo: motivoRechazo.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al rechazar comprobante");
      }

      showToast(`Comprobante de orden ${selectedOrder.folio} rechazado. El cliente fue notificado.`);
      setIsRejectModalOpen(false);
      setMotivoRechazo("");
      await fetchOrders();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setProcessingAction(false);
    }
  };

  // Filtrado
  const filteredOrders = orders.filter((o) => {
    if (filterEstado !== "todos") {
      if (filterEstado === "spei_pendientes" && o.estado !== "comprobante_subido") return false;
      if (filterEstado === "aprobados" && o.estado !== "pagado" && o.estado !== "anticipo_pagado") return false;
      if (filterEstado === "revision" && o.estado !== "revision_manual") return false;
      if (filterEstado === "rechazados" && o.estado !== "comprobante_rechazado" && o.estado !== "pago_rechazado") return false;
    }
    if (filterMetodo !== "todos" && o.metodoPago !== filterMetodo) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchFolio = o.folio?.toLowerCase().includes(term);
      const matchNombre = o.contacto?.nombre?.toLowerCase().includes(term);
      const matchTel = o.contacto?.telefono?.toLowerCase().includes(term);
      const matchCorreo = o.contacto?.correo?.toLowerCase().includes(term);
      return matchFolio || matchNombre || matchTel || matchCorreo;
    }
    return true;
  });

  // Métricas
  const countSpeiPendientes = orders.filter((o) => o.estado === "comprobante_subido").length;
  const countRevisionManual = orders.filter((o) => o.estado === "revision_manual").length;
  const countAprobados = orders.filter((o) => o.estado === "pagado" || o.estado === "anticipo_pagado").length;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A1428]">
            Administración de Ventas y Finanzas
          </span>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-[#7A1428]" />
            <span>Gestión de Pedidos y Validación SPEI</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Supervisión omnicanal de cobros por Mercado Pago, revisión de transferencias interbancarias y órdenes de instalación.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Tarjetas de Resumen Rápido */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Total Órdenes
          </span>
          <p className="text-2xl font-black text-gray-900">{orders.length}</p>
          <p className="text-[11px] text-gray-500">Histórico de pedidos en el sistema</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border-2 border-blue-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
              SPEI por Validar
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
          </div>
          <p className="text-2xl font-black text-blue-900">{countSpeiPendientes}</p>
          <p className="text-[11px] text-blue-600">Comprobantes listos para revisión</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            Pagos Acreditados
          </span>
          <p className="text-2xl font-black text-emerald-900">{countAprobados}</p>
          <p className="text-[11px] text-emerald-600">Con orden técnica activa</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
            Revisión Manual
          </span>
          <p className="text-2xl font-black text-amber-900">{countRevisionManual}</p>
          <p className="text-[11px] text-amber-600">Alertas o discrepancias de pasarela</p>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Input de Búsqueda */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por folio (CT-XXXXXXX), nombre, teléfono o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#7A1428] transition-colors"
            />
          </div>

          {/* Filtros Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white focus:outline-none focus:border-[#7A1428]"
            >
              <option value="todos">Todos los Estados</option>
              <option value="spei_pendientes">SPEI: Pendientes de Validar ({countSpeiPendientes})</option>
              <option value="aprobados">Pagados / Anticipo ({countAprobados})</option>
              <option value="revision">En Revisión Manual ({countRevisionManual})</option>
              <option value="rechazados">Rechazados</option>
            </select>

            <select
              value={filterMetodo}
              onChange={(e) => setFilterMetodo(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white focus:outline-none focus:border-[#7A1428]"
            >
              <option value="todos">Cualquier Método</option>
              <option value="spei">Transferencia SPEI</option>
              <option value="mercadopago">Mercado Pago</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Pedidos */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#7A1428] animate-spin mx-auto" />
            <p className="text-xs text-gray-500 font-medium">Cargando registros de pedidos...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <DollarSign className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-sm font-bold text-gray-800">No se encontraron pedidos</p>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              No hay transacciones registradas con los filtros seleccionados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/70 border-b border-gray-200/80 text-gray-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 font-bold">Folio / Fecha</th>
                  <th className="py-3 px-4 font-bold">Cliente</th>
                  <th className="py-3 px-4 font-bold">Método & Plan</th>
                  <th className="py-3 px-4 font-bold">Inversión</th>
                  <th className="py-3 px-4 font-bold">Estado</th>
                  <th className="py-3 px-4 font-bold">Comprobante SPEI</th>
                  <th className="py-3 px-4 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredOrders.map((o) => {
                  const tieneComprobante = Boolean(o.comprobanteSpei?.url);
                  const esSpeiPendiente = o.estado === "comprobante_subido";

                  return (
                    <tr
                      key={o.id || o.folio}
                      className={`hover:bg-gray-50/60 transition-colors ${
                        esSpeiPendiente ? "bg-blue-50/30" : ""
                      }`}
                    >
                      {/* Folio */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="font-mono font-bold text-gray-900 block text-xs">
                            {o.folio}
                          </span>
                          <span className="text-[10px] text-gray-400 block">
                            {o.createdAt ? new Date(o.createdAt).toLocaleDateString("es-MX") : "—"}
                          </span>
                        </div>
                      </td>

                      {/* Cliente */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-gray-900 truncate max-w-[160px]">
                            {o.contacto?.nombre || "Sin nombre"}
                          </p>
                          <p className="text-[11px] text-gray-500 font-mono">
                            {o.contacto?.telefono}
                          </p>
                          {o.contacto?.empresa && (
                            <p className="text-[10px] text-gray-400 truncate max-w-[160px]">
                              {o.contacto.empresa}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Método & Plan */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              o.metodoPago === "spei"
                                ? "bg-indigo-100 text-indigo-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {o.metodoPago === "spei" ? "SPEI Banco" : "Mercado Pago"}
                          </span>
                          <p className="text-[11px] text-gray-500 capitalize">
                            {o.planPago ? o.planPago.replace("_", " ") : "Contado"}
                          </p>
                        </div>
                      </td>

                      {/* Montos */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="font-black text-gray-900 block">
                            {formatMxn(o.totalCentavos)}
                          </span>
                          {o.saldoRestanteCentavos > 0 && (
                            <span className="text-[10px] text-amber-700 block font-semibold">
                              Saldo pendiente: {formatMxn(o.saldoRestanteCentavos)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4">
                        {o.estado === "pagado" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Liquidado</span>
                          </span>
                        ) : o.estado === "anticipo_pagado" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Anticipo Pagado</span>
                          </span>
                        ) : o.estado === "comprobante_subido" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 animate-pulse">
                            <Clock className="w-3 h-3" />
                            <span>Validar SPEI</span>
                          </span>
                        ) : o.estado === "comprobante_rechazado" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3" />
                            <span>Comprobante Rechazado</span>
                          </span>
                        ) : o.estado === "revision_manual" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                            <ShieldAlert className="w-3 h-3" />
                            <span>Revisión Manual</span>
                          </span>
                        ) : o.estado === "pago_rechazado" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800">
                            <AlertTriangle className="w-3 h-3" />
                            <span>MP Rechazado</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700">
                            <Clock className="w-3 h-3" />
                            <span>Pendiente Pago</span>
                          </span>
                        )}
                      </td>

                      {/* Comprobante SPEI */}
                      <td className="py-3 px-4">
                        {tieneComprobante ? (
                          <div className="space-y-1">
                            <a
                              href={o.comprobanteSpei?.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-[11px] transition-colors"
                            >
                              <FileText className="w-3 h-3 text-[#7A1428]" />
                              <span>Ver Archivo</span>
                              <ExternalLink className="w-2.5 h-2.5 text-gray-400" />
                            </a>
                            {o.comprobanteSpei?.subidoAt && (
                              <p className="text-[10px] text-gray-400 font-mono">
                                {new Date(o.comprobanteSpei.subidoAt).toLocaleTimeString("es-MX", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            )}
                          </div>
                        ) : o.metodoPago === "spei" ? (
                          <span className="text-[11px] text-gray-400 italic">No subido aún</span>
                        ) : (
                          <span className="text-[11px] text-gray-400">—</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Botones de Aprobación/Rechazo SPEI */}
                          {esSpeiPendiente && (
                            <>
                              <button
                                onClick={() => handleAprobarSpei(o.folio)}
                                disabled={processingAction}
                                title="Aprobar pago SPEI"
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors shadow-2xs"
                              >
                                Aprobar
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedOrder(o);
                                  setIsRejectModalOpen(true);
                                }}
                                disabled={processingAction}
                                title="Rechazar comprobante"
                                className="px-2.5 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-bold text-[11px] transition-colors"
                              >
                                Rechazar
                              </button>
                            </>
                          )}

                          {/* Botón de Ficha Completa */}
                          <button
                            onClick={() => {
                              setSelectedOrder(o);
                              setIsDetailModalOpen(true);
                            }}
                            title="Ver detalles de orden"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Rechazar Comprobante */}
      {isRejectModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Rechazar Comprobante SPEI
                </h3>
                <p className="text-xs text-gray-500">Orden {selectedOrder.folio}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 block">
                Motivo del rechazo (se mostrará al cliente para su corrección):
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {[
                  "Monto depositado no coincide",
                  "Comprobante ilegible / borroso",
                  "No se encuentra en estado de cuenta",
                  "Falta clave de rastreo bancaria",
                ].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setMotivoRechazo(sug)}
                    className="text-[10px] px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                  >
                    {sug}
                  </button>
                ))}
              </div>
              <textarea
                rows={3}
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                placeholder="Escribe la razón detallada para que el cliente corrija..."
                className="w-full p-3 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-red-600 transition-colors"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                disabled={processingAction}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRechazarSpei}
                disabled={processingAction || !motivoRechazo.trim()}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-xs font-bold transition-colors"
              >
                {processingAction ? "Procesando..." : "Confirmar Rechazo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Detalle Completo de la Orden */}
      {isDetailModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A1428]">
                  Ficha Técnica de Pedido
                </span>
                <h3 className="text-lg font-black text-gray-900">{selectedOrder.folio}</h3>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {/* Datos del Cliente */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-xs">
              <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#7A1428]" />
                <span>Datos del Comprador</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 text-gray-600">
                <p><strong>Nombre:</strong> {selectedOrder.contacto?.nombre}</p>
                <p><strong>Teléfono:</strong> {selectedOrder.contacto?.telefono}</p>
                <p><strong>Correo:</strong> {selectedOrder.contacto?.correo}</p>
                <p><strong>Empresa:</strong> {selectedOrder.contacto?.empresa || "—"}</p>
              </div>
            </div>

            {/* Instalación Técnica */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-xs">
              <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#7A1428]" />
                <span>Cita y Lugar de Instalación</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 text-gray-600">
                <p>
                  <strong>Lugar:</strong>{" "}
                  {selectedOrder.instalacion?.tipoLugar === "taller_cosoavl"
                    ? "Taller Matriz Metepec"
                    : `${selectedOrder.instalacion?.direccion || ""}, ${selectedOrder.instalacion?.municipio || ""}, ${selectedOrder.instalacion?.estadoNombre || ""}`}
                </p>
                <p>
                  <strong>Fecha y Turno:</strong>{" "}
                  {selectedOrder.instalacion?.fechaTentativa || "Por definir"} ({selectedOrder.instalacion?.horarioTentativo || "Matutino"})
                </p>
              </div>
            </div>

            {/* Unidades Vehiculares */}
            {selectedOrder.unidades && selectedOrder.unidades.length > 0 && (
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-gray-900">Unidades Vehiculares Declaradas:</h4>
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                  {selectedOrder.unidades.map((u, i) => (
                    <div key={i} className="p-2.5 bg-white flex justify-between text-gray-700">
                      <span><strong>Unidad #{i + 1}:</strong> {u.marca} {u.modelo} ({u.tipoVehiculo})</span>
                      <span className="font-mono text-gray-500">Año: {u.anio || "—"} | Placas: {u.placas || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Productos y Equipos */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-gray-900">Desglose de Equipos Adquiridos:</h4>
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="p-2.5 bg-white flex justify-between text-gray-700">
                    <span>
                      {item.cantidad}× {item.nombre}
                    </span>
                    <span className="font-bold text-gray-900">
                      {formatMxn(item.totalSinIvaCentavos)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Botón de Aprobación rápida si está pendiente */}
            {selectedOrder.estado === "comprobante_subido" && (
              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <button
                  onClick={() => handleAprobarSpei(selectedOrder.folio)}
                  disabled={processingAction}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs"
                >
                  Aprobar Pago SPEI
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

