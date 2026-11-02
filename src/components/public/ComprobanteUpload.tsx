"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, CheckCircle2, AlertTriangle, Loader2, ExternalLink } from "lucide-react";
import { OrderComprobanteSpei, OrderEstado } from "@/types/order";

interface ComprobanteUploadProps {
  folio: string;
  token: string;
  comprobante?: OrderComprobanteSpei;
  estado: OrderEstado;
}

export function ComprobanteUpload({
  folio,
  token,
  comprobante,
  estado,
}: ComprobanteUploadProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 5 * 1024 * 1024) {
        setErrorMsg("El archivo seleccionado excede el límite máximo de 5 MB.");
        return;
      }
      setFile(selected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg("Por favor selecciona un archivo.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("token", token);

      const res = await fetch(`/api/pedido/${folio}/subir-comprobante`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo subir el comprobante");
      }

      setSuccessMsg(data.message || "Comprobante cargado exitosamente.");
      setFile(null);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const estaAprobado = estado === "pagado" || estado === "anticipo_pagado";
  const estaEnRevision = estado === "comprobante_subido";
  const estaRechazado = estado === "comprobante_rechazado";

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 flex items-center gap-2">
          <Upload className="w-4 h-4 text-[#7A1428]" />
          <span>Comprobante de Transferencia SPEI</span>
        </h2>
        {estaAprobado ? (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
            Aprobado
          </span>
        ) : estaEnRevision ? (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
            En Revisión
          </span>
        ) : estaRechazado ? (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800">
            Rechazado
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
            Pendiente
          </span>
        )}
      </div>

      {/* Comprobante ya aprobado */}
      {estaAprobado && comprobante && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <p className="font-bold text-emerald-900">Transferencia verificada</p>
            <p className="text-emerald-700">
              Tu comprobante fue validado por el área de administración. Tu orden técnica está en proceso.
            </p>
            {comprobante.url && (
              <a
                href={comprobante.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-emerald-800 hover:underline pt-1"
              >
                Ver archivo enviado <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Comprobante en revisión */}
      {estaEnRevision && comprobante && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-start gap-3 text-xs">
            <FileText className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-blue-900">Comprobante en validación</p>
              <p className="text-blue-800">
                Hemos recibido tu archivo. Nuestro equipo contable verificará el abono en el estado de cuenta y actualizará tu orden en breve.
              </p>
              <p className="text-[11px] text-blue-600 font-mono">
                Subido el: {new Date(comprobante.subidoAt).toLocaleString("es-MX")}
              </p>
            </div>
          </div>
          {comprobante.url && (
            <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between text-xs">
              <span className="text-blue-700 truncate max-w-[200px]">
                {comprobante.fileName.split("/").pop()}
              </span>
              <a
                href={comprobante.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-bold text-blue-800 hover:underline"
              >
                Ver comprobante <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Comprobante rechazado */}
      {estaRechazado && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-2 text-xs">
          <div className="flex items-start gap-2 text-red-900 font-bold">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>Comprobante no aceptado por administración</span>
          </div>
          <p className="text-red-700">
            <strong>Motivo:</strong> {comprobante?.motivoRechazo || "El archivo no pudo validarse con el estado de cuenta."}
          </p>
          <p className="text-red-600">
            Por favor sube una captura o PDF claro y legible donde se visualice la clave de rastreo, fecha y monto exacto.
          </p>
        </div>
      )}

      {/* Formulario de subida (disponible si está pendiente, rechazado, o no tiene comprobante aprobado) */}
      {!estaAprobado && !estaEnRevision && (
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="border-2 border-dashed border-gray-200 hover:border-[#7A1428]/40 rounded-2xl p-6 text-center transition-colors">
            <input
              type="file"
              id="comprobanteInput"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="comprobanteInput"
              className="cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 hover:text-[#7A1428]">
                <Upload className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-800">
                  {file ? file.name : "Haz clic para seleccionar tu comprobante"}
                </p>
                <p className="text-[11px] text-gray-400">
                  Formatos aceptados: JPG, PNG, WebP o PDF (Máximo 5 MB)
                </p>
              </div>
            </label>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!file || loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#7A1428] hover:bg-[#5C0F1E] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-bold transition-colors shadow-xs"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Subiendo comprobante...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Enviar Comprobante para Validación</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

