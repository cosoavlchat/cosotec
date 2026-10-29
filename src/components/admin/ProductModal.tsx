"use client";

import { useState, useEffect } from "react";
import { Product, ProductCategory } from "@/types/catalog";
import { desglosePrecio, formatMxn, parseToCentavos } from "@/lib/pricing";
import { X, Upload, Plus, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Partial<Product>) => Promise<void>;
  product?: Product | null;
}

export function ProductModal({ isOpen, onClose, onSave, product }: ProductModalProps) {
  const [nombreComercial, setNombreComercial] = useState("");
  const [slug, setSlug] = useState("");
  const [modelo, setModelo] = useState("");
  const [categoria, setCategoria] = useState<ProductCategory>("gps");
  const [precioSinIvaPesos, setPrecioSinIvaPesos] = useState<string>("0");
  const [descripcionCorta, setDescripcionCorta] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [queIncluye, setQueIncluye] = useState<string[]>([]);
  const [nuevoItemIncluye, setNuevoItemIncluye] = useState("");
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [nuevaImagenUrl, setNuevaImagenUrl] = useState("");
  const [esEquipoPrincipal, setEsEquipoPrincipal] = useState(false);
  const [activo, setActivo] = useState(true);
  const [revisarPrecio, setRevisarPrecio] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setNombreComercial(product.nombreComercial || "");
      setSlug(product.slug || "");
      setModelo(product.modelo || "");
      setCategoria(product.categoria || "gps");
      setPrecioSinIvaPesos((product.precioSinIvaCentavos / 100).toFixed(2));
      setDescripcionCorta(product.descripcionCorta || "");
      setDescripcion(product.descripcion || "");
      setQueIncluye(product.queIncluye || []);
      setImagenes(product.imagenes || []);
      setEsEquipoPrincipal(product.esEquipoPrincipal || false);
      setActivo(product.activo ?? true);
      setRevisarPrecio(product.revisarPrecio || false);
    } else {
      // Default reset
      setNombreComercial("");
      setSlug("");
      setModelo("");
      setCategoria("gps");
      setPrecioSinIvaPesos("0.00");
      setDescripcionCorta("");
      setDescripcion("");
      setQueIncluye(["Equipo GPS", "Instalación estándar", "SIM 4G"]);
      setImagenes(["https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=600&q=80"]);
      setEsEquipoPrincipal(true);
      setActivo(true);
      setRevisarPrecio(false);
    }
    setError(null);
  }, [product, isOpen]);

  // Generar slug automático si es nuevo
  const handleNombreChange = (val: string) => {
    setNombreComercial(val);
    if (!product) {
      const generatedSlug = val
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setSlug(generatedSlug);
    }
  };

  // Cálculo en tiempo real de IVA y Total en centavos
  const centavosSinIva = parseToCentavos(precioSinIvaPesos);
  const desglose = desglosePrecio(centavosSinIva, 16);

  // Manejador de subida de imágenes a Firebase Storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir la imagen");

      setImagenes((prev) => [...prev, data.url]);
    } catch (err: any) {
      setError(err.message || "Error al subir imagen");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddIncluye = () => {
    if (!nuevoItemIncluye.trim()) return;
    setQueIncluye([...queIncluye, nuevoItemIncluye.trim()]);
    setNuevoItemIncluye("");
  };

  const handleRemoveIncluye = (index: number) => {
    setQueIncluye(queIncluye.filter((_, i) => i !== index));
  };

  const handleAddImageUrl = () => {
    if (!nuevaImagenUrl.trim()) return;
    setImagenes([...imagenes, nuevaImagenUrl.trim()]);
    setNuevaImagenUrl("");
  };

  const handleRemoveImage = (index: number) => {
    setImagenes(imagenes.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!slug.trim()) throw new Error("El slug es obligatorio");
      if (!nombreComercial.trim()) throw new Error("El nombre comercial es obligatorio");

      await onSave({
        slug,
        nombreComercial,
        modelo,
        categoria,
        precioSinIvaCentavos: centavosSinIva,
        descripcionCorta,
        descripcion,
        queIncluye,
        imagenes,
        esEquipoPrincipal,
        activo,
        revisarPrecio,
        orden: product?.orden ?? 0,
      });

      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar el producto");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/70 rounded-t-2xl">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {product ? "Editar Producto" : "Nuevo Producto en Catálogo"}
            </h3>
            <p className="text-xs text-gray-500">
              Todos los precios se guardan en centavos sin IVA en el servidor.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Nombre Comercial y Modelo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-gray-700">Nombre Comercial *</label>
              <input
                type="text"
                required
                value={nombreComercial}
                onChange={(e) => handleNombreChange(e.target.value)}
                placeholder="Ej. GPS Flotilla Pro"
                className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A1428]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Modelo Secundario</label>
              <input
                type="text"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                placeholder="Ej. JC450, GTX3"
                className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A1428]"
              />
            </div>
          </div>

          {/* Slug y Categoría */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Slug identificador (ID)</label>
              <input
                type="text"
                required
                disabled={!!product}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 disabled:text-gray-500 font-mono text-xs focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Categoría *</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as ProductCategory)}
                className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1428]"
              >
                <option value="gps">GPS Vehicular</option>
                <option value="dashcam">DashCam</option>
                <option value="seguridad">Seguridad / Chapas / Sensores</option>
                <option value="accesorio">Accesorio</option>
                <option value="dron">Dron</option>
                <option value="servicio">Servicio / Mano de obra</option>
              </select>
            </div>
          </div>

          {/* REGLA 1 & 2: Precio sin IVA y cálculo en vivo */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800">
                Precio de Venta (Sin IVA en BD) *
              </label>
              <span className="text-[11px] text-gray-500">Se almacena: {centavosSinIva} centavos</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-500 font-semibold">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={precioSinIvaPesos}
                onChange={(e) => setPrecioSinIvaPesos(e.target.value)}
                className="w-48 text-base font-bold px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A1428]"
              />
              <span className="text-xs text-gray-500">MXN sin IVA</span>
            </div>

            {/* Cálculo en vivo */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200 text-xs">
              <div>
                <span className="text-gray-500 block">Subtotal:</span>
                <span className="font-semibold text-gray-900">{formatMxn(desglose.precioSinIvaCentavos)}</span>
              </div>
              <div>
                <span className="text-gray-500 block">IVA (16%):</span>
                <span className="font-semibold text-gray-900">+{formatMxn(desglose.ivaCentavos)}</span>
              </div>
              <div className="bg-[#7A1428]/10 p-1.5 rounded-md border border-[#7A1428]/20">
                <span className="text-[#7A1428] font-bold block">Total con IVA:</span>
                <span className="font-black text-sm text-[#7A1428]">{formatMxn(desglose.totalConIvaCentavos)}</span>
              </div>
            </div>
          </div>

          {/* Descripción corta */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">Descripción Corta</label>
            <input
              type="text"
              value={descripcionCorta}
              onChange={(e) => setDescripcionCorta(e.target.value)}
              placeholder="Resumen visible en tarjetas y catálogo"
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A1428]"
            />
          </div>

          {/* Qué Incluye (Constructor de lista) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700">Qué incluye (viñetas)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={nuevoItemIncluye}
                onChange={(e) => setNuevoItemIncluye(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddIncluye())}
                placeholder="Ej. Relevador de paro de motor, SIM 4G..."
                className="flex-1 text-xs px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A1428]"
              />
              <button
                type="button"
                onClick={handleAddIncluye}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {queIncluye.map((item, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-800 rounded-md text-xs"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => handleRemoveIncluye(idx)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* REGLA 5: Subida de Imágenes a Firebase Storage */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700">Imágenes del Producto</label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-[#7A1428]/10 hover:bg-[#7A1428]/20 text-[#7A1428] text-xs font-semibold rounded-lg transition-colors border border-[#7A1428]/30">
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploading ? "Subiendo..." : "Subir archivo a Storage"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>

              <div className="flex-1 flex gap-1">
                <input
                  type="url"
                  value={nuevaImagenUrl}
                  onChange={(e) => setNuevaImagenUrl(e.target.value)}
                  placeholder="O pegar URL de imagen..."
                  className="flex-1 text-xs px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-xs rounded-lg"
                >
                  +
                </button>
              </div>
            </div>

            {/* Galería de imágenes cargadas */}
            <div className="flex gap-2 overflow-x-auto py-2">
              {imagenes.map((url, idx) => (
                <div
                  key={idx}
                  className="relative group w-16 h-16 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-gray-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="Producto" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Opciones y Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-200">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
              <input
                type="checkbox"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                className="w-4 h-4 text-[#7A1428] rounded border-gray-300 focus:ring-[#7A1428]"
              />
              <span>Activo en tienda pública</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
              <input
                type="checkbox"
                checked={esEquipoPrincipal}
                onChange={(e) => setEsEquipoPrincipal(e.target.checked)}
                className="w-4 h-4 text-[#7A1428] rounded border-gray-300 focus:ring-[#7A1428]"
              />
              <span>Es Equipo Principal</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-amber-700 font-medium">
              <input
                type="checkbox"
                checked={revisarPrecio}
                onChange={(e) => setRevisarPrecio(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
              />
              <span>Marcar &ldquo;Revisar precio&rdquo;</span>
            </label>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 bg-gray-50/70 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-200/60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 bg-[#7A1428] hover:bg-[#4A0C18] text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSubmitting ? "Guardando..." : "Guardar Producto"}
          </button>
        </div>
      </div>
    </div>
  );
}
