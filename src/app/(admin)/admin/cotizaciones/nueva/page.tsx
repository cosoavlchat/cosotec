"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  User,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Shield,
  Truck,
  ArrowRight,
  ArrowLeft,
  Building2,
  Phone,
  Sparkles,
  HelpCircle,
  DollarSign,
  Clock,
  Layers,
} from "lucide-react";
import { Customer } from "@/types/customer";
import { Product, Package } from "@/types/catalog";
import { CustomerSelectModal } from "@/components/admin/CustomerSelectModal";
import { formatMxn } from "@/lib/pricing";
import { initialZonasSinCosto, getMunicipiosSinCosto } from "@/lib/pricing/zonas-sin-costo";

interface RenglonCotizacion {
  id: string; // ID temporal
  tipo: "producto" | "paquete" | "concepto_libre";
  catalogoId?: string;
  nombre: string;
  categoria?: string;
  precioSinIvaCentavos: number;
  cantidad: number;
  esConceptoLibre?: boolean;
  descripcionLibre?: string;
  advertencia?: string;
}

export default function NuevaCotizacionPage() {
  const router = useRouter();

  // 1. Estado Cliente
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // 2. Catálogo disponible
  const [products, setProducts] = useState<Product[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  // Renglones seleccionados
  const [renglones, setRenglones] = useState<RenglonCotizacion[]>([]);

  // 3. Ubicación e Instalación
  const [estadoClave, setEstadoClave] = useState("MEX");
  const [municipio, setMunicipio] = useState("Metepec");
  const [municipiosDisponibles, setMunicipiosDisponibles] = useState<string[]>([]);
  const [esForaneo, setEsForaneo] = useState(false);
  const [viaticosManualPesos, setViaticosManualPesos] = useState<number>(0);

  // 4. Condiciones Comerciales
  const [planPago, setPlanPago] = useState<"contado" | "credi_contado" | "enganche_mensualidades" | "msi">("contado");
  const [descuentoAdicional, setDescuentoAdicional] = useState<number>(0);
  const [topeDescuento, setTopeDescuento] = useState<number>(5);
  const [justificacionDescuento, setJustificacionDescuento] = useState("");
  const [vigenciaDias, setVigenciaDias] = useState<number>(15);
  const [notasCliente, setNotasCliente] = useState("");
  const [notasInternas, setNotasInternas] = useState("");

  // Concepto libre habilitado
  const [permitirConceptoLibre, setPermitirConceptoLibre] = useState(false);
  const [conceptoLibreModal, setConceptoLibreModal] = useState(false);
  const [libreNombre, setLibreNombre] = useState("");
  const [libreDesc, setLibreDesc] = useState("");
  const [librePrecioPesos, setLibrePrecioPesos] = useState<number>(0);

  const [guardando, setGuardando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  useEffect(() => {
    cargarCatalogo();
    actualizarMunicipios(estadoClave);
  }, []);

  const cargarCatalogo = async () => {
    try {
      setCatalogLoading(true);
      const res = await fetch("/api/admin/catalogo?type=all", {
        headers: { Authorization: "Bearer test-token-vendedor" },
      });
      const data = await res.json();
      if (data.products) setProducts(data.products);
      if (data.packages) setPackages(data.packages);
    } catch (e) {
      console.error("Error cargando catálogo:", e);
    } finally {
      setCatalogLoading(false);
    }
  };

  const actualizarMunicipios = (edo: string) => {
    const munis = getMunicipiosSinCosto(edo);
    setMunicipiosDisponibles(munis);
    if (munis.length > 0) {
      setMunicipio(munis[0]);
      setEsForaneo(false);
    } else {
      setMunicipio("Otro municipio");
      setEsForaneo(true);
    }
  };

  const handleEstadoChange = (edo: string) => {
    setEstadoClave(edo);
    actualizarMunicipios(edo);
  };

  const handleMunicipioChange = (mun: string) => {
    if (mun === "OTRO") {
      setEsForaneo(true);
      setMunicipio("Municipio Foráneo");
    } else {
      setEsForaneo(false);
      setMunicipio(mun);
    }
  };

  // Agregar producto del catálogo
  const agregarProducto = (p: Product) => {
    let advertencia: string | undefined;
    if (p.categoria === "dashcam" || p.modelo === "JC450" || p.modelo === "JC181") {
      advertencia = "Requiere memoria microSD de alta velocidad para video continuo.";
    }

    const nuevo: RenglonCotizacion = {
      id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tipo: "producto",
      catalogoId: p.id,
      nombre: p.nombreComercial,
      categoria: p.categoria,
      precioSinIvaCentavos: p.precioSinIvaCentavos,
      cantidad: 1,
      advertencia,
    };
    setRenglones((prev) => [...prev, nuevo]);
  };

  // Agregar paquete del catálogo
  const agregarPaquete = (pkg: Package) => {
    const nuevo: RenglonCotizacion = {
      id: `pkg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tipo: "paquete",
      catalogoId: pkg.id,
      nombre: pkg.nombre,
      categoria: "paquete",
      precioSinIvaCentavos: pkg.precioSinIvaCentavos,
      cantidad: 1,
    };
    setRenglones((prev) => [...prev, nuevo]);
  };

  // Agregar concepto libre
  const handleAgregarConceptoLibre = (e: React.FormEvent) => {
    e.preventDefault();
    if (!libreNombre) return;

    const precioCentavos = Math.round(Number(librePrecioPesos) * 100);
    const nuevo: RenglonCotizacion = {
      id: `libre-${Date.now()}`,
      tipo: "concepto_libre",
      nombre: libreNombre,
      descripcionLibre: libreDesc,
      precioSinIvaCentavos: precioCentavos,
      cantidad: 1,
      esConceptoLibre: true,
    };
    setRenglones((prev) => [...prev, nuevo]);
    setLibreNombre("");
    setLibreDesc("");
    setLibrePrecioPesos(0);
    setConceptoLibreModal(false);
  };

  const actualizarCantidad = (id: string, cant: number) => {
    if (cant <= 0) return;
    setRenglones((prev) => prev.map((r) => (r.id === id ? { ...r, cantidad: cant } : r)));
  };

  const eliminarRenglon = (id: string) => {
    setRenglones((prev) => prev.filter((r) => r.id !== id));
  };

  // Cálculo en pantalla
  const subtotalBrutoSinIvaCentavos = renglones.reduce(
    (acc, r) => acc + r.precioSinIvaCentavos * r.cantidad,
    0
  );
  const totalEquipos = renglones.reduce((acc, r) => acc + r.cantidad, 0);

  // Descuento por volumen (> 5 unidades = 10%)
  const aplicaVolumen = totalEquipos > 5;
  const descuentoVolumenCentavos = aplicaVolumen
    ? Math.round(subtotalBrutoSinIvaCentavos * 0.1)
    : 0;

  // Descuento adicional vendedor
  const subtotalTrasVolumen = subtotalBrutoSinIvaCentavos - descuentoVolumenCentavos;
  const descuentoAdicionalCentavos = Math.round(
    subtotalTrasVolumen * (Number(descuentoAdicional) / 100)
  );
  const subtotalNetoSinIvaCentavos = subtotalTrasVolumen - descuentoAdicionalCentavos;

  // Viáticos
  const viaticosCentavos = esForaneo ? Math.round(Number(viaticosManualPesos) * 100) : 0;

  // IVA y Total
  const baseGravableCentavos = subtotalNetoSinIvaCentavos + viaticosCentavos;
  const ivaCentavos = Math.round(baseGravableCentavos * 0.16);
  const totalFinalCentavos = baseGravableCentavos + ivaCentavos;

  // Requiere autorización
  const requiereAutorizacion = Number(descuentoAdicional) > topeDescuento;

  const handleGuardarCotizacion = async () => {
    setErrorEnvio(null);

    if (!selectedCustomer) {
      setErrorEnvio("Por favor selecciona o registra un cliente antes de continuar.");
      return;
    }
    if (renglones.length === 0) {
      setErrorEnvio("Agrega al menos un equipo o concepto a la cotización.");
      return;
    }
    if (requiereAutorizacion && !justificacionDescuento.trim()) {
      setErrorEnvio("Indica la justificación comercial para solicitar autorización de descuento a Dirección.");
      return;
    }

    try {
      setGuardando(true);
      const payload = {
        clienteId: selectedCustomer.id,
        items: renglones.map((r) => ({
          id: r.catalogoId || r.id,
          tipo: r.tipo,
          cantidad: r.cantidad,
          esConceptoLibre: r.esConceptoLibre,
          nombreLibre: r.nombre,
          descripcionLibre: r.descripcionLibre,
          precioLibreSinIvaCentavos: r.precioSinIvaCentavos,
        })),
        instalacion: {
          estadoClave,
          municipio,
          viaticosManualCentavos: viaticosCentavos,
        },
        condiciones: {
          planSeleccionado: planPago,
          descuentoAdicionalPorcentaje: Number(descuentoAdicional),
          solicitoExcesoDescuento: requiereAutorizacion,
          justificacionDescuento: justificacionDescuento.trim(),
          vigenciaDias: Number(vigenciaDias),
          notasCliente: notasCliente.trim(),
          notasInternas: notasInternas.trim(),
        },
      };

      const res = await fetch("/api/admin/cotizaciones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token-vendedor",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo generar la cotización.");
      }

      // Redirigir al listado o detalle
      router.push("/admin/cotizaciones");
    } catch (err: any) {
      setErrorEnvio(err.message || "Error al procesar la cotización.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/cotizaciones"
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Nueva Cotización</h1>
            <p className="text-xs text-gray-500">
              Genera una propuesta en menos de 2 minutos para envío por WhatsApp y pago en línea.
            </p>
          </div>
        </div>
      </div>

      {errorEnvio && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <strong>No se pudo emitir la cotización:</strong>
            <p className="mt-0.5">{errorEnvio}</p>
          </div>
        </div>
      )}

      {/* Grid 2 Columnas Desktop / 1 Columna Móvil */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Formulario de Armado (8 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Bloque 1: Cliente */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#7A1428] text-white text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <h2 className="font-bold text-sm text-gray-900">Cliente o Empresa</h2>
              </div>
              <button
                type="button"
                onClick={() => setCustomerModalOpen(true)}
                className="text-xs font-bold text-[#7A1428] hover:underline"
              >
                {selectedCustomer ? "Cambiar Cliente" : "+ Seleccionar / Crear"}
              </button>
            </div>

            {selectedCustomer ? (
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <strong className="text-sm font-bold text-gray-900">{selectedCustomer.nombre}</strong>
                    {selectedCustomer.empresa && (
                      <span className="text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded-md">
                        {selectedCustomer.empresa}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1 font-semibold text-emerald-700">
                      <Phone className="w-3 h-3 text-[#25D366]" />
                      {selectedCustomer.whatsappDisplay || selectedCustomer.whatsapp}
                    </span>
                    {selectedCustomer.rfc && (
                      <span className="font-mono text-[11px]">RFC: {selectedCustomer.rfc}</span>
                    )}
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCustomerModalOpen(true)}
                className="w-full py-6 px-4 border-2 border-dashed border-gray-200 hover:border-[#7A1428] rounded-2xl text-center text-xs text-gray-500 hover:text-gray-800 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <User className="w-6 h-6 text-gray-400" />
                <span>Haz clic para buscar o registrar al cliente</span>
              </button>
            )}
          </div>

          {/* Bloque 2: Renglones y Catálogo */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#7A1428] text-white text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <h2 className="font-bold text-sm text-gray-900">Conceptos y Equipos</h2>
              </div>
              <span className="text-xs text-gray-400 font-medium">{renglones.length} en cotización</span>
            </div>

            {/* Renglones Seleccionados */}
            {renglones.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-200/80 text-xs text-gray-400">
                Selecciona equipos o kits abajo para agregarlos a la cotización.
              </div>
            ) : (
              <div className="space-y-2">
                {renglones.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-2xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <strong className="text-xs font-bold text-gray-900">{r.nombre}</strong>
                        {r.esConceptoLibre && (
                          <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.2 rounded font-semibold">
                            Concepto Libre
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-500 font-mono">
                        {formatMxn(r.precioSinIvaCentavos)} + IVA c/u
                      </span>
                      {r.advertencia && (
                        <p className="text-[10px] text-amber-700 flex items-center gap-1 font-medium mt-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{r.advertencia}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1 bg-gray-50">
                        <button
                          type="button"
                          onClick={() => actualizarCantidad(r.id, r.cantidad - 1)}
                          className="w-6 h-6 rounded bg-white text-gray-700 font-bold hover:bg-gray-100 flex items-center justify-center text-xs"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-bold text-xs">{r.cantidad}</span>
                        <button
                          type="button"
                          onClick={() => actualizarCantidad(r.id, r.cantidad + 1)}
                          className="w-6 h-6 rounded bg-white text-gray-700 font-bold hover:bg-gray-100 flex items-center justify-center text-xs"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-bold text-xs text-gray-900 w-24 text-right">
                        {formatMxn(r.precioSinIvaCentavos * r.cantidad)}
                      </span>

                      <button
                        type="button"
                        onClick={() => eliminarRenglon(r.id)}
                        className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                        title="Eliminar renglón"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Selector Rápido del Catálogo */}
            <div className="pt-2 border-t border-gray-100 space-y-3">
              <span className="text-[11px] uppercase font-bold text-gray-400 tracking-wider block">
                Agregar desde el Catálogo Oficial:
              </span>

              {catalogLoading ? (
                <div className="text-xs text-gray-400">Cargando equipos...</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {/* Paquetes */}
                  {packages.map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => agregarPaquete(pkg)}
                      className="p-2.5 rounded-xl border border-gray-200 hover:border-[#7A1428] text-left hover:bg-gray-50 transition-all flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-gray-900 block truncate">{pkg.nombre}</span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {formatMxn(pkg.precioSinIvaCentavos)} + IVA
                        </span>
                      </div>
                      <Plus className="w-4 h-4 text-[#7A1428] shrink-0" />
                    </button>
                  ))}

                  {/* Productos */}
                  {products
                    .filter((p) => p.activo && !p.revisarPrecio)
                    .map((prod) => (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => agregarProducto(prod)}
                        className="p-2.5 rounded-xl border border-gray-200 hover:border-[#7A1428] text-left hover:bg-gray-50 transition-all flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-gray-900 block truncate">{prod.nombreComercial}</span>
                          <span className="text-[10px] text-gray-500 font-mono">
                            {formatMxn(prod.precioSinIvaCentavos)} + IVA
                          </span>
                        </div>
                        <Plus className="w-4 h-4 text-[#7A1428] shrink-0" />
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Bloque 3: Ubicación y Viáticos */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#7A1428] text-white text-xs font-bold flex items-center justify-center">
                3
              </span>
              <h2 className="font-bold text-sm text-gray-900">Ubicación de Instalación</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Estado</label>
                <select
                  value={estadoClave}
                  onChange={(e) => handleEstadoChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-medium"
                >
                  <option value="MEX">Estado de México (Toluca / Naucalpan)</option>
                  <option value="CDMX">Ciudad de México (CDMX)</option>
                  <option value="NL">Nuevo León (Monterrey)</option>
                  <option value="JAL">Jalisco (Guadalajara)</option>
                  <option value="QRO">Querétaro (Zona Metropolitana)</option>
                  <option value="PUE">Puebla</option>
                  <option value="GTO">Guanajuato</option>
                  <option value="VER">Veracruz</option>
                  <option value="OTRO">Otro Estado</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Municipio</label>
                <select
                  value={municipio}
                  onChange={(e) => handleMunicipioChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-medium"
                >
                  {municipiosDisponibles.map((m) => (
                    <option key={m} value={m}>
                      {m} (Sin Costo)
                    </option>
                  ))}
                  <option value="OTRO">Otro municipio (Se cotiza viáticos)</option>
                </select>
              </div>
            </div>

            {/* Banner de Viáticos */}
            {esForaneo ? (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block">Municipio fuera de zona metropolitana gratuita</strong>
                    <span className="text-[11px] text-amber-800">
                      Captura el monto de viáticos acordado para traslado del instalador:
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 max-w-xs">
                  <span className="font-bold text-gray-700">$</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={viaticosManualPesos}
                    onChange={(e) => setViaticosManualPesos(Number(e.target.value))}
                    className="w-32 px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-xs font-bold"
                    placeholder="0.00"
                  />
                  <span className="text-[11px] text-gray-500 font-semibold">+ IVA</span>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>¡Viáticos sin costo!</strong> Dentro de la zona metropolitana oficial.
                </span>
              </div>
            )}
          </div>

          {/* Bloque 4: Condiciones y Notas */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#7A1428] text-white text-xs font-bold flex items-center justify-center">
                4
              </span>
              <h2 className="font-bold text-sm text-gray-900">Condiciones Comerciales</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Plan de Pago</label>
                <select
                  value={planPago}
                  onChange={(e) => setPlanPago(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-medium"
                >
                  <option value="contado">Pago de Contado (100%)</option>
                  <option value="credi_contado">
                    Credi-Contado (55% al confirmar y 45% al instalar pagado por link)
                  </option>
                  <option value="enganche_mensualidades">Enganche 55% + 2 Mensualidades</option>
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-gray-700">Descuento Comercial</label>
                  <span className="text-[10px] text-gray-400">Tope asesor: {topeDescuento}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={descuentoAdicional}
                    onChange={(e) => setDescuentoAdicional(Number(e.target.value))}
                    className={`w-24 px-3 py-2 rounded-xl border text-xs font-bold ${
                      requiereAutorizacion ? "border-amber-400 bg-amber-50" : "border-gray-200"
                    }`}
                  />
                  <span className="font-bold text-gray-700">%</span>
                  {requiereAutorizacion && (
                    <span className="text-[10px] font-bold text-amber-700">Requiere Autorización</span>
                  )}
                </div>
              </div>
            </div>

            {/* Justificación si excede tope */}
            {requiereAutorizacion && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-2">
                <span className="font-bold text-amber-900 block">
                  Justificación de Descuento para Dirección *
                </span>
                <textarea
                  rows={2}
                  required
                  value={justificacionDescuento}
                  onChange={(e) => setJustificacionDescuento(e.target.value)}
                  placeholder="Ej. Cierre de flotilla de 8 unidades antes de fin de mes..."
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs text-gray-900 focus:outline-none"
                />
              </div>
            )}

            <div className="space-y-3 pt-2 border-t border-gray-100 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Notas para el Cliente (Salen en el PDF)</label>
                <textarea
                  rows={2}
                  value={notasCliente}
                  onChange={(e) => setNotasCliente(e.target.value)}
                  placeholder="Ej. Incluye programación de corte de motor y capacitación de app..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700">
                  Notas Internas Privadas (NUNCA mostradas al cliente ni en PDF)
                </label>
                <textarea
                  rows={2}
                  value={notasInternas}
                  onChange={(e) => setNotasInternas(e.target.value)}
                  placeholder="Ej. El cliente solicita factura a nombre de otra razón social la próxima semana..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50/70"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Resumen de Totales y Emisión (5 cols) */}
        <div className="lg:col-span-5 sticky top-6 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-md space-y-6">
            <h3 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-3 flex items-center justify-between">
              <span>Resumen de Inversión</span>
              <span className="text-[11px] font-semibold text-[#7A1428] bg-[#7A1428]/10 px-2 py-0.5 rounded-md">
                {planPago === "credi_contado" ? "Credi-Contado" : planPago === "contado" ? "Contado" : "Financiamiento"}
              </span>
            </h3>

            {/* Desglose Monetario */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal Bruto ({totalEquipos} unidades):</span>
                <span className="font-mono">{formatMxn(subtotalBrutoSinIvaCentavos)}</span>
              </div>

              {aplicaVolumen && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Descuento por Volumen (10%):</span>
                  <span className="font-mono">-{formatMxn(descuentoVolumenCentavos)}</span>
                </div>
              )}

              {descuentoAdicionalCentavos > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Descuento Asesor ({descuentoAdicional}%):</span>
                  <span className="font-mono">-{formatMxn(descuentoAdicionalCentavos)}</span>
                </div>
              )}

              {viaticosCentavos > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Viáticos Foráneos:</span>
                  <span className="font-mono">+{formatMxn(viaticosCentavos)}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-600 border-t border-gray-100 pt-2">
                <span>IVA (16%):</span>
                <span className="font-mono">+{formatMxn(ivaCentavos)}</span>
              </div>

              <div className="flex justify-between items-baseline border-t border-gray-200 pt-3 text-gray-900 font-black">
                <span className="text-sm">Inversión Total:</span>
                <span className="text-2xl text-[#7A1428] font-mono">{formatMxn(totalFinalCentavos)}</span>
              </div>
            </div>

            {/* Plan de Pagos Resumen */}
            {planPago === "credi_contado" && (
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-1.5">
                <span className="font-bold text-gray-900 block text-[11px]">Esquema de Pago:</span>
                <div className="flex justify-between text-gray-600">
                  <span>1. Anticipo al confirmar (55%):</span>
                  <strong className="font-mono text-gray-900">
                    {formatMxn(Math.round(totalFinalCentavos * 0.55))}
                  </strong>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>2. Al instalar pagado por link (45%):</span>
                  <strong className="font-mono text-gray-900">
                    {formatMxn(totalFinalCentavos - Math.round(totalFinalCentavos * 0.55))}
                  </strong>
                </div>
              </div>
            )}

            {/* Botón Principal */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleGuardarCotizacion}
                disabled={guardando}
                className={`w-full py-4 px-6 text-white font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  requiereAutorizacion
                    ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/30"
                    : "bg-[#7A1428] hover:bg-[#4A0C18] shadow-[#7A1428]/30"
                }`}
              >
                {guardando ? (
                  <span>Procesando cotización...</span>
                ) : requiereAutorizacion ? (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>Solicitar Autorización</span>
                  </>
                ) : (
                  <>
                    <span>Emitir Cotización y Generar PDF</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-[11px] text-gray-400 text-center leading-snug">
                {requiereAutorizacion
                  ? "El descuento supera tu tope. La cotización quedará guardada y se notificará al Administrador."
                  : "La cotización quedará lista de inmediato para descargar PDF y compartir por WhatsApp al cliente."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Selección de Cliente */}
      <CustomerSelectModal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        selectedCustomerId={selectedCustomer?.id}
        onSelectCustomer={(c) => setSelectedCustomer(c)}
        authToken="test-token-vendedor"
      />
    </div>
  );
}

