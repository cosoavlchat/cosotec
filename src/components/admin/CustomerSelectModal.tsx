"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  UserPlus,
  X,
  Check,
  AlertCircle,
  Building2,
  Phone,
  Mail,
  FileText,
  UserCheck,
} from "lucide-react";
import { Customer } from "@/types/customer";
import { normalizarWhatsapp, formatearWhatsapp } from "@/lib/utils/whatsapp";

interface CustomerSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: Customer) => void;
  selectedCustomerId?: string;
  authToken?: string; // Para llamadas a API autenticadas
}

export function CustomerSelectModal({
  isOpen,
  onClose,
  onSelectCustomer,
  selectedCustomerId,
  authToken = "test-token-vendedor",
}: CustomerSelectModalProps) {
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Formulario nuevo cliente
  const [nombre, setNombre] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [correo, setCorreo] = useState("");
  const [rfc, setRfc] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [conflictCustomerId, setConflictCustomerId] = useState<string | null>(null);
  const [reassignSuccess, setReassignSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCustomers(query);
    }
  }, [isOpen, query]);

  const loadCustomers = async (search: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/customers${search ? `?q=${encodeURIComponent(search)}` : ""}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers || []);
      }
    } catch (err) {
      console.error("Error cargando clientes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setConflictCustomerId(null);
    setReassignSuccess(null);

    const norm = normalizarWhatsapp(whatsapp);
    if (!norm || norm.length !== 10) {
      setFormError("El WhatsApp debe tener exactamente 10 dígitos numéricos.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          nombre,
          empresa,
          whatsapp: norm,
          correo,
          rfc,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          // Cliente asignado a otro asesor
          setFormError("Este número pertenece a un cliente asignado a otro asesor.");
          // Checamos ID para reasignación
          const checkRes = await fetch("/api/admin/customers/check-whatsapp", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ whatsapp: norm }),
          });
          const checkData = await checkRes.json();
          if (checkData.customerId) {
            setConflictCustomerId(checkData.customerId);
          }
          return;
        }
        throw new Error(data.error || "No se pudo crear el cliente.");
      }

      // Éxito
      onSelectCustomer(data.customer);
      setIsCreating(false);
      onClose();
    } catch (err: any) {
      setFormError(err.message || "Error al registrar cliente.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSolicitarReasignacion = async () => {
    if (!conflictCustomerId) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/customers/${conflictCustomerId}/solicitar-reasignacion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ motivo: `El vendedor desea cotizar con el contacto ${whatsapp}` }),
      });
      const data = await res.json();
      if (data.success) {
        setReassignSuccess("Solicitud de reasignación enviada al administrador exitosamente.");
      }
    } catch (err) {
      setFormError("Error al enviar solicitud de reasignación.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
        {/* Header Modal */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {isCreating ? "Registrar Nuevo Cliente" : "Seleccionar Cliente"}
            </h3>
            <p className="text-xs text-gray-500">
              {isCreating
                ? "El cliente quedará registrado en tu cartera y disponible para futuras cotizaciones."
                : "Busca por nombre, WhatsApp, empresa o RFC."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {!isCreating ? (
            <>
              {/* Buscador + Botón Nuevo */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar cliente (nombre, 722..., empresa, RFC)..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#7A1428] focus:ring-1 focus:ring-[#7A1428]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className="px-4 py-2.5 bg-[#7A1428] hover:bg-[#4A0C18] text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Nuevo</span>
                </button>
              </div>

              {/* Lista de Clientes */}
              {loading ? (
                <div className="py-12 text-center text-xs text-gray-400">Cargando clientes...</div>
              ) : customers.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <UserCheck className="w-8 h-8 text-gray-300 mx-auto" />
                  <p className="text-xs text-gray-500 font-medium">No se encontraron clientes.</p>
                  <button
                    type="button"
                    onClick={() => setIsCreating(true)}
                    className="text-xs font-bold text-[#7A1428] hover:underline"
                  >
                    Registrar a este cliente ahora
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {customers.map((c) => {
                    const isSelected = selectedCustomerId === c.id;
                    return (
                      <div
                        key={c.id}
                        onClick={() => {
                          onSelectCustomer(c);
                          onClose();
                        }}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? "border-[#7A1428] bg-[#7A1428]/5 ring-1 ring-[#7A1428]/20"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/80"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-gray-900">{c.nombre}</span>
                            {c.empresa && (
                              <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                                {c.empresa}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-[#C9A15B]" />
                              {c.whatsappDisplay || formatearWhatsapp(c.whatsapp)}
                            </span>
                            {c.correo && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-gray-400" />
                                {c.correo}
                              </span>
                            )}
                            {c.rfc && (
                              <span className="flex items-center gap-1 font-mono text-[11px]">
                                <FileText className="w-3 h-3 text-gray-400" />
                                {c.rfc}
                              </span>
                            )}
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-[#7A1428] text-white flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* Formulario Alta Rápida */
            <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                  {conflictCustomerId && !reassignSuccess && (
                    <button
                      type="button"
                      onClick={handleSolicitarReasignacion}
                      disabled={submitting}
                      className="mt-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-lg transition-colors"
                    >
                      {submitting ? "Enviando..." : "Solicitar Reasignación al Administrador"}
                    </button>
                  )}
                  {reassignSuccess && (
                    <p className="text-[11px] text-emerald-700 font-semibold">{reassignSuccess}</p>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Nombre de Contacto *</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Ing. Carlos Mendoza"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#7A1428]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">WhatsApp (10 dígitos) *</label>
                  <input
                    type="tel"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="7221234567"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#7A1428]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Empresa / Razón Social</label>
                  <input
                    type="text"
                    value={empresa}
                    onChange={(e) => setEmpresa(e.target.value)}
                    placeholder="Ej. Transportes Toluca S.A."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#7A1428]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Correo Electrónico (Opcional)</label>
                  <input
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="cliente@empresa.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#7A1428]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">RFC (Facturación opcional)</label>
                  <input
                    type="text"
                    value={rfc}
                    onChange={(e) => setRfc(e.target.value.toUpperCase())}
                    placeholder="XAXX010101000"
                    maxLength={13}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm uppercase focus:outline-none focus:border-[#7A1428]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 font-bold text-xs rounded-xl hover:bg-gray-50"
                >
                  Volver al Buscador
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-[#7A1428] hover:bg-[#4A0C18] text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  {submitting ? "Guardando..." : "Guardar y Seleccionar"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
