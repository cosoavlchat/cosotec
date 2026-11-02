"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  UserPlus,
  Phone,
  Mail,
  Building2,
  FileText,
  UserCheck,
  Shield,
  ArrowRight,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Customer } from "@/types/customer";
import { formatearWhatsapp } from "@/lib/utils/whatsapp";
import { CustomerSelectModal } from "@/components/admin/CustomerSelectModal";

export default function AdminClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<"admin" | "vendedor">("admin");

  // Reasignación (Admin)
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [nuevoVendedorEmail, setNuevoVendedorEmail] = useState("");
  const [reassigning, setReassigning] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, [query]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const token = currentRole === "admin" ? "test-token-admin" : "test-token-vendedor";
      const res = await fetch(`/api/admin/customers${query ? `?q=${encodeURIComponent(query)}` : ""}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers || []);
      }
    } catch (err) {
      console.error("Error al cargar clientes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReasignar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !nuevoVendedorEmail) return;

    try {
      setReassigning(true);
      const token = "test-token-admin";
      const res = await fetch(`/api/admin/customers/${selectedCustomer.id}/reasignar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nuevoVendedor: {
            uid: `vendedor-${nuevoVendedorEmail.split("@")[0]}`,
            nombre: nuevoVendedorEmail.split("@")[0],
            email: nuevoVendedorEmail,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setReassignModalOpen(false);
        loadCustomers();
      }
    } catch (err) {
      console.error("Error reasignando:", err);
    } finally {
      setReassigning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Cartera de Clientes</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#7A1428]/10 text-[#7A1428]">
              {customers.length} {customers.length === 1 ? "cliente" : "clientes"}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Gestión comercial y asignación de prospectos y clientes de CoSoAVL.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Selector de rol para prueba rápida */}
          <select
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value as any)}
            className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 font-semibold focus:outline-none"
          >
            <option value="admin">Vista Admin (Ver todos)</option>
            <option value="vendedor">Vista Vendedor (Solo mis clientes)</option>
          </select>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#7A1428] hover:bg-[#4A0C18] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, empresa, WhatsApp o RFC..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#7A1428] focus:ring-1 focus:ring-[#7A1428]"
        />
      </div>

      {/* Tabla / Grid de Clientes */}
      {loading ? (
        <div className="py-20 text-center text-xs text-gray-400">Cargando cartera de clientes...</div>
      ) : customers.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-gray-200 space-y-3">
          <UserCheck className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="font-bold text-gray-900 text-sm">No hay clientes registrados</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {currentRole === "vendedor"
              ? "Aún no tienes clientes asignados en tu cartera. Agrega uno nuevo para cotizar."
              : "Comienza registrando prospectos o cotizando para generar clientes."}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-[#7A1428] text-white text-xs font-bold rounded-xl hover:bg-[#4A0C18]"
          >
            Registrar Primer Cliente
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Cliente / Empresa</th>
                  <th className="px-6 py-3.5 font-bold">Contacto (WhatsApp / Correo)</th>
                  <th className="px-6 py-3.5 font-bold">Asesor Asignado</th>
                  <th className="px-6 py-3.5 font-bold">Cotizaciones</th>
                  <th className="px-6 py-3.5 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 text-sm">{c.nombre}</div>
                      {c.empresa ? (
                        <span className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-gray-400" />
                          {c.empresa}
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">Particular</span>
                      )}
                      {c.rfc && (
                        <span className="text-[10px] font-mono text-gray-500 block mt-0.5">
                          RFC: {c.rfc}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 space-y-1">
                      <a
                        href={`https://wa.me/521${c.whatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5"
                      >
                        <Phone className="w-3 h-3 text-[#25D366]" />
                        <span>{c.whatsappDisplay || formatearWhatsapp(c.whatsapp)}</span>
                      </a>
                      {c.correo && (
                        <span className="text-gray-500 flex items-center gap-1.5 text-[11px]">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span>{c.correo}</span>
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-800">{c.vendedorNombre}</div>
                      <div className="text-[11px] text-gray-400">{c.vendedorEmail}</div>

                      {c.reasignacionSolicitada && (
                        <div className="mt-1.5 p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-[10px] text-amber-900 space-y-0.5">
                          <span className="font-bold flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                            Reasignación solicitada por {c.reasignacionSolicitada.vendedorSolicitanteNombre}
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-900 text-xs block">
                        {c.totalCotizaciones || 0}
                      </span>
                      <span className="text-[10px] text-gray-400">emitidas</span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {currentRole === "admin" && (
                          <button
                            onClick={() => {
                              setSelectedCustomer(c);
                              setReassignModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 border border-gray-200 hover:border-gray-300 text-gray-700 font-bold text-[11px] rounded-lg transition-colors"
                          >
                            Reasignar
                          </button>
                        )}

                        <a
                          href={`https://wa.me/521${c.whatsapp}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal para Crear Cliente */}
      <CustomerSelectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectCustomer={(c) => {
          loadCustomers();
        }}
        authToken={currentRole === "admin" ? "test-token-admin" : "test-token-vendedor"}
      />

      {/* Modal Reasignar (Solo Admin) */}
      {reassignModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-gray-100">
            <h3 className="font-bold text-base text-gray-900">Reasignar Asesor Comercial</h3>
            <p className="text-xs text-gray-500">
              Cambia el asesor asignado para <strong>{selectedCustomer.nombre}</strong> ({selectedCustomer.empresa || "Particular"}).
            </p>

            <form onSubmit={handleReasignar} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Correo del Nuevo Asesor *</label>
                <input
                  type="email"
                  required
                  value={nuevoVendedorEmail}
                  onChange={(e) => setNuevoVendedorEmail(e.target.value)}
                  placeholder="vendedor2@cosoavl.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#7A1428]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setReassignModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 font-bold text-xs rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={reassigning}
                  className="px-4 py-2 bg-[#7A1428] hover:bg-[#4A0C18] text-white font-bold text-xs rounded-xl"
                >
                  {reassigning ? "Guardando..." : "Confirmar Reasignación"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

