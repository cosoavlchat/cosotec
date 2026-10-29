"use client";

import { useEffect, useState } from "react";
import { AppUser, UserRole } from "@/types/user";
import { Users, UserPlus, ShieldCheck, ShieldAlert, CheckCircle2, AlertTriangle, Key } from "lucide-react";

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("vendedor");
  const [topeDescuento, setTopeDescuento] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/usuarios");
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      }
    } catch (e) {
      console.error("Error al cargar usuarios:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            email,
            nombre,
            password,
            role,
            topeDescuento: role === "vendedor" ? Number(topeDescuento) : 0,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear usuario");

      showToast(`Usuario ${email} dado de alta con rol '${role}' y Custom Claims`);
      setIsModalOpen(false);
      setEmail("");
      setNombre("");
      setPassword("");
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || "Error al procesar solicitud");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: { uid, role: newRole },
        }),
      });
      if (!res.ok) throw new Error("Error al actualizar rol");
      setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, role: newRole } : u)));
      showToast(`Rol actualizado a '${newRole}' con Custom Claim`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1C1C1E] text-white text-xs px-4 py-2.5 rounded-xl shadow-lg border border-white/10 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Usuarios y Control de Roles</h1>
          <p className="text-xs text-gray-500">
            Control de acceso basado en Firebase Auth Custom Claims (`role: admin | vendedor | soporte`).
          </p>
        </div>

        <button
          onClick={() => {
            setError(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#7A1428] hover:bg-[#4A0C18] text-white text-xs font-bold rounded-xl shadow-xs transition-colors self-start"
        >
          <UserPlus className="w-4 h-4" />
          Dar de Alta Usuario
        </button>
      </div>

      {/* Role explanation cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-white border-l-4 border-[#7A1428] shadow-xs space-y-1">
          <span className="font-bold text-[#7A1428] uppercase text-[10px] tracking-wider">Rol: Administrador</span>
          <p className="text-gray-700 font-semibold">Acceso Total</p>
          <p className="text-gray-500 text-[11px]">
            Edición de catálogo, precios sin IVA, reglas de descuento, viáticos, usuarios y validación de transferencias SPEI.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border-l-4 border-blue-600 shadow-xs space-y-1">
          <span className="font-bold text-blue-600 uppercase text-[10px] tracking-wider">Rol: Vendedor</span>
          <p className="text-gray-700 font-semibold">Cotizador y CRM Ligero</p>
          <p className="text-gray-500 text-[11px]">
            Crea y envía cotizaciones, aplica descuentos hasta su tope fijado. <strong>No puede modificar precios del catálogo</strong>.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border-l-4 border-emerald-600 shadow-xs space-y-1">
          <span className="font-bold text-emerald-600 uppercase text-[10px] tracking-wider">Rol: Soporte / Instalaciones</span>
          <p className="text-gray-700 font-semibold">Servicio Técnico</p>
          <p className="text-gray-500 text-[11px]">
            Consulta fichas de instalación, cambia estados, reprograma citas y sube evidencia técnica e IMEI instalados.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3">Nombre / Correo</th>
                <th className="px-4 py-3">Rol Asignado</th>
                <th className="px-4 py-3">Tope Descuento</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Cambiar Rol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-400">
                    Cargando usuarios...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-400">
                    No hay usuarios registrados aún. Usa &ldquo;Dar de Alta Usuario&rdquo; o el script `set-role.ts`.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.uid} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-gray-900">{u.nombre || "Usuario"}</div>
                      <div className="text-[11px] text-gray-500 font-mono">{u.email}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      {u.role === "admin" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7A1428] bg-[#7A1428]/10 px-2.5 py-0.5 rounded-full border border-[#7A1428]/20">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Administrador
                        </span>
                      )}
                      {u.role === "vendedor" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Vendedor
                        </span>
                      )}
                      {u.role === "soporte" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          Soporte Técnico
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-gray-700">
                      {u.role === "vendedor" ? (
                        <span className="font-semibold">{u.topeDescuento ?? 5}%</span>
                      ) : (
                        <span className="text-gray-400 italic">N/A</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      {u.activo ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                          Inactivo
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                        className="text-xs px-2.5 py-1 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#7A1428]"
                      >
                        <option value="admin">Administrador</option>
                        <option value="vendedor">Vendedor</option>
                        <option value="soporte">Soporte</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear Usuario */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/70 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Dar de Alta Usuario en Panel</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4 text-xs">
              {error && (
                <div className="p-2.5 rounded-lg bg-red-50 text-red-700 border border-red-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Rodrigo Morales"
                  className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A1428]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@cosoavl.com"
                  className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A1428]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Contraseña Inicial *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A1428]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Rol del Usuario *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1428]"
                >
                  <option value="vendedor">Vendedor (Cotizador sin edición de precios)</option>
                  <option value="admin">Administrador (Total)</option>
                  <option value="soporte">Soporte Técnico (Fichas e Instalaciones)</option>
                </select>
              </div>

              {role === "vendedor" && (
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Tope de Descuento Permitido (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={topeDescuento}
                    onChange={(e) => setTopeDescuento(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A1428]"
                  />
                  <p className="text-[11px] text-gray-500">
                    Máximo porcentaje que el vendedor podrá aplicar a una cotización.
                  </p>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#7A1428] hover:bg-[#4A0C18] text-white font-bold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5" />
                  {isSubmitting ? "Creando..." : "Crear y Asignar Rol"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
