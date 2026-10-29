"use client";

import { useState } from "react";
import Link from "next/link";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";
import { trackAnalyticsEvent } from "@/lib/analytics";

export function ContactoForm() {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [unidades, setUnidades] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [consentimiento, setConsentimiento] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setIsSubmitting(true);

    try {
      if (!consentimiento) {
        throw new Error("Debes aceptar el aviso de privacidad para enviar el formulario.");
      }

      const res = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          telefono,
          correo,
          empresa,
          unidades,
          mensaje,
          consentimientoPrivacidad: consentimiento,
          website_field_hp: honeypot, // Campo trampa anti-spam
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al enviar el formulario");
      }

      // Evento de Analítica Lead
      trackAnalyticsEvent("Lead", {
        method: "web_contact_form",
        unidades: unidades || "1",
      });

      setStatus({
        success: true,
        message: "¡Gracias por contactarnos! Tu solicitud fue registrada y un asesor te responderá a la brevedad.",
      });

      setNombre("");
      setTelefono("");
      setCorreo("");
      setEmpresa("");
      setUnidades("");
      setMensaje("");
      setConsentimiento(false);
    } catch (err: any) {
      setStatus({ success: false, message: err.message || "Error al enviar mensaje" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-xs space-y-6">
      <h2 className="text-lg font-black text-gray-900 tracking-tight">
        Envíanos un mensaje
      </h2>

      {status && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
            status.success
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {status.success ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{status.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Campo trampa Honeypot (invisible para humanos) */}
        <div className="hidden" aria-hidden="true">
          <input
            type="text"
            name="website_field_hp"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="font-semibold text-gray-700">Nombre Completo *</label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1428]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-gray-700">Teléfono / WhatsApp *</label>
            <input
              type="tel"
              required
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="10 dígitos (ej. 7221234567)"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1428]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="font-semibold text-gray-700">Correo Electrónico *</label>
            <input
              type="email"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="ejemplo@empresa.com"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1428]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-gray-700">Empresa (Opcional)</label>
            <input
              type="text"
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              placeholder="Nombre de tu empresa o negocio"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1428]"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-gray-700">¿Cuántas unidades necesitas proteger?</label>
          <input
            type="text"
            value={unidades}
            onChange={(e) => setUnidades(e.target.value)}
            placeholder="Ej. 1 vehículo particular, 8 tractocamiones, 3 motos..."
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1428]"
          />
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-gray-700">Mensaje o Requerimientos *</label>
          <textarea
            required
            rows={4}
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder="Cuéntanos qué problema buscas resolver (robo, combustible, video, monitoreo)..."
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1428]"
          />
        </div>

        {/* Casilla obligatoria de privacidad */}
        <div className="pt-2">
          <label className="flex items-start gap-2.5 cursor-pointer text-gray-600">
            <input
              type="checkbox"
              required
              checked={consentimiento}
              onChange={(e) => setConsentimiento(e.target.checked)}
              className="w-4 h-4 text-[#7A1428] rounded border-gray-300 mt-0.5 focus:ring-[#7A1428]"
            />
            <span className="leading-tight">
              He leído y acepto el{" "}
              <Link href="/privacidad" target="_blank" className="text-[#7A1428] underline font-semibold">
                Aviso de Privacidad
              </Link>{" "}
              para el tratamiento de mis datos de contacto con fines de cotización y servicio.
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto px-8 py-3.5 bg-[#7A1428] hover:bg-[#4A0C18] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
        >
          <Send className="w-4 h-4" />
          <span>{isSubmitting ? "Enviando mensaje..." : "Enviar Solicitud"}</span>
        </button>
      </form>
    </div>
  );
}

