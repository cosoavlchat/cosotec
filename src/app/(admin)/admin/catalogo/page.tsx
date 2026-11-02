"use client";

import { useEffect, useState } from "react";
import { Product, Package, ProductCategory } from "@/types/catalog";
import { formatMxn, precioConIva } from "@/lib/pricing";
import { adminFetch } from "@/lib/auth/admin-fetch";
import { ProductModal } from "@/components/admin/ProductModal";
import { getProductImage } from "@/lib/catalog/product-image";
import {
  Plus,
  Search,
  Filter,
  Eye,
  EyeOff,
  Edit2,
  AlertTriangle,
  Layers,
  Box,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

export default function AdminCatalogoPage() {
  const [activeTab, setActiveTab] = useState<"products" | "packages">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Cargar catálogo desde la API
  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const res = await adminFetch("/api/admin/catalogo");
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
        setPackages(data.packages || []);
      }
    } catch (e) {
      console.error("Error al cargar catálogo:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Toggle de visibilidad (Activo / Oculto)
  const handleToggleStatus = async (slug: string, currentStatus: boolean, isPackage: boolean = false) => {
    try {
      const res = await adminFetch("/api/admin/catalogo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: isPackage ? "package" : "product",
          slug,
          activo: !currentStatus,
        }),
      });

      if (!res.ok) throw new Error("Error al cambiar estado");

      if (isPackage) {
        setPackages((prev) =>
          prev.map((pkg) => (pkg.slug === slug ? { ...pkg, activo: !currentStatus } : pkg))
        );
      } else {
        setProducts((prev) =>
          prev.map((p) => (p.slug === slug ? { ...p, activo: !currentStatus } : p))
        );
      }
      showToast(`Estado actualizado: ${!currentStatus ? "Visible en tienda" : "Oculto"}`);
    } catch (err: any) {
      alert(err.message || "Error al cambiar estado");
    }
  };

  // Guardar o actualizar producto
  const handleSaveProduct = async (productData: Partial<Product>) => {
    const res = await adminFetch("/api/admin/catalogo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "product", data: productData }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al guardar producto");

    showToast("Producto guardado y auditado con éxito");
    await fetchCatalog();
  };

  // Filtros de búsqueda
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.nombreComercial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || p.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredPackages = packages.filter((pkg) => {
    return (
      pkg.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

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
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Catálogo de Productos</h1>
          <p className="text-xs text-gray-500">
            Administra equipos GPS, DashCams, seguridad y kits comerciales.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedProduct(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#7A1428] hover:bg-[#4A0C18] text-white text-xs font-bold rounded-xl shadow-xs transition-colors self-start"
        >
          <Plus className="w-4 h-4" />
          Nuevo Producto
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("products")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-colors ${
            activeTab === "products"
              ? "border-[#7A1428] text-[#7A1428]"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          Productos Individuales ({products.length})
        </button>
        <button
          onClick={() => setActiveTab("packages")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-colors ${
            activeTab === "packages"
              ? "border-[#7A1428] text-[#7A1428]"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Box className="w-4 h-4" />
          Paquetes Comerciales ({packages.length})
        </button>
      </div>

      {/* Controls: Search & Category */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, modelo o slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A1428]"
          />
        </div>

        {activeTab === "products" && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1428]"
            >
              <option value="all">Todas las categorías</option>
              <option value="gps">GPS Vehicular</option>
              <option value="dashcam">DashCams</option>
              <option value="seguridad">Seguridad / Sensores</option>
              <option value="accesorio">Accesorios</option>
              <option value="dron">Drones</option>
              <option value="servicio">Servicios</option>
            </select>
          </div>
        )}
      </div>

      {/* Products Table */}
      {activeTab === "products" && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3">Producto / Modelo</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Precio sin IVA</th>
                  <th className="px-4 py-3">Precio con IVA (16%)</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-400">
                      Cargando catálogo...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-400">
                      No se encontraron productos con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const conIva = precioConIva(p.precioSinIvaCentavos, 16);
                    return (
                      <tr key={p.slug} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 shrink-0 overflow-hidden">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={getProductImage(p)}
                                alt={p.nombreComercial}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 flex items-center gap-2">
                                <span>{p.nombreComercial}</span>
                                {p.revisarPrecio && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                    <AlertTriangle className="w-3 h-3" />
                                    Revisar precio
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-gray-500 font-mono">
                                Modelo: {p.modelo || "N/A"} • slug: {p.slug}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase bg-gray-100 text-gray-700">
                            {p.categoria}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 font-semibold text-gray-800">
                          {p.precioSinIvaCentavos === 0 && p.categoria === "dron" ? (
                            <span className="text-gray-400 italic">Por definir</span>
                          ) : (
                            formatMxn(p.precioSinIvaCentavos)
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          {p.precioSinIvaCentavos === 0 && p.categoria === "dron" ? (
                            <span className="text-gray-400 italic">—</span>
                          ) : (
                            <span className="font-bold text-[#7A1428]">
                              {formatMxn(conIva)}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          {p.activo ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                              Oculto
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleToggleStatus(p.slug, p.activo, false)}
                              title={p.activo ? "Ocultar en tienda" : "Mostrar en tienda"}
                              className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                            >
                              {p.activo ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4 text-emerald-600" />
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedProduct(p);
                                setIsModalOpen(true);
                              }}
                              title="Editar producto"
                              className="p-1.5 text-gray-500 hover:text-[#7A1428] rounded-lg hover:bg-[#7A1428]/10"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Packages Table */}
      {activeTab === "packages" && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3">Paquete Comercial</th>
                  <th className="px-4 py-3">Contenido del Kit</th>
                  <th className="px-4 py-3">Precio sin IVA</th>
                  <th className="px-4 py-3">Precio con IVA (16%)</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-400">
                      Cargando paquetes...
                    </td>
                  </tr>
                ) : filteredPackages.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-400">
                      No hay paquetes disponibles.
                    </td>
                  </tr>
                ) : (
                  filteredPackages.map((pkg) => {
                    const conIva = precioConIva(pkg.precioSinIvaCentavos, 16);
                    return (
                      <tr key={pkg.slug} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-gray-900 flex items-center gap-2">
                            <span>{pkg.nombre}</span>
                            {pkg.revisarPrecio && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                <AlertTriangle className="w-3 h-3" />
                                Revisar precio
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500">{pkg.descripcion}</p>
                        </td>

                        <td className="px-4 py-3.5">
                          <ul className="text-[11px] text-gray-600 space-y-0.5 list-disc list-inside">
                            {pkg.queIncluye?.slice(0, 3).map((inc, i) => (
                              <li key={i}>{inc}</li>
                            ))}
                            {(pkg.queIncluye?.length || 0) > 3 && (
                              <li className="text-gray-400">
                                +{(pkg.queIncluye?.length || 0) - 3} más...
                              </li>
                            )}
                          </ul>
                        </td>

                        <td className="px-4 py-3.5 font-semibold text-gray-800">
                          {formatMxn(pkg.precioSinIvaCentavos)}
                        </td>

                        <td className="px-4 py-3.5 font-bold text-[#7A1428]">
                          {formatMxn(conIva)}
                        </td>

                        <td className="px-4 py-3.5">
                          {pkg.activo ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                              Oculto
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => handleToggleStatus(pkg.slug, pkg.activo, true)}
                            title={pkg.activo ? "Ocultar paquete" : "Publicar paquete"}
                            className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                          >
                            {pkg.activo ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4 text-emerald-600" />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
        product={selectedProduct}
      />
    </div>
  );
}

