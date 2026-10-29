import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { PUT as putCatalogo } from "@/app/api/admin/catalogo/route";
import { PUT as putPrecios } from "@/app/api/admin/precios/route";
import { POST as postUpload } from "@/app/api/upload/route";

// Mock de servicios de backend para aislar la capa de autenticación y autorización en la API
vi.mock("@/lib/services/catalog-service", () => ({
  saveProduct: vi.fn().mockResolvedValue({ slug: "gps-test", nombreComercial: "Test GPS" }),
  savePackage: vi.fn().mockResolvedValue({ slug: "kit-test", nombre: "Kit Test" }),
}));

vi.mock("@/lib/services/pricing-service", () => ({
  updatePricingSettings: vi.fn().mockResolvedValue({ ivaPorcentaje: 16 }),
  updateTravelFee: vi.fn().mockResolvedValue({ id: "MEX", sinCosto: true }),
}));

describe("Seguridad y Verificación de Roles en Rutas API (/api/admin/*)", () => {
  describe("PUT /api/admin/catalogo", () => {
    it("responde 401 si no se envía encabezado de autorización", async () => {
      const req = new NextRequest("http://localhost:3000/api/admin/catalogo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "product",
          data: { slug: "gps-test", nombreComercial: "Test", categoria: "gps", precioSinIvaCentavos: 10000 },
        }),
      });

      const res = await putCatalogo(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain("Token de autenticación ausente");
    });

    it("responde 401 si el token es inválido", async () => {
      const req = new NextRequest("http://localhost:3000/api/admin/catalogo", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token-invalid",
        },
        body: JSON.stringify({
          entity: "product",
          data: { slug: "gps-test", nombreComercial: "Test", categoria: "gps", precioSinIvaCentavos: 10000 },
        }),
      });

      const res = await putCatalogo(req);
      expect(res.status).toBe(401);
    });

    it("responde 403 Forbidden cuando un VENDEDOR intenta modificar el catálogo", async () => {
      const req = new NextRequest("http://localhost:3000/api/admin/catalogo", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token-vendedor",
        },
        body: JSON.stringify({
          entity: "product",
          data: { slug: "gps-test", nombreComercial: "Modificado por Vendedor", categoria: "gps", precioSinIvaCentavos: 10000 },
        }),
      });

      const res = await putCatalogo(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain("no autorizado");
    });

    it("responde 200 OK cuando un ADMINISTRADOR modifica el catálogo", async () => {
      const req = new NextRequest("http://localhost:3000/api/admin/catalogo", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token-admin",
        },
        body: JSON.stringify({
          entity: "product",
          data: { slug: "gps-test", nombreComercial: "Aprobado por Admin", categoria: "gps", precioSinIvaCentavos: 10000 },
        }),
      });

      const res = await putCatalogo(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });

  describe("PUT /api/admin/precios", () => {
    it("responde 403 Forbidden cuando un VENDEDOR intenta modificar precios o reglas", async () => {
      const req = new NextRequest("http://localhost:3000/api/admin/precios", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token-vendedor",
        },
        body: JSON.stringify({
          target: "pricing",
          data: {
            ivaPorcentaje: 16,
            descuentoVolumen: { umbralUnidades: 5, porcentaje: 15 },
            topeDescuentoVendedor: 10,
            planesPago: ["contado"],
            msi: [3],
            comisionMsiAbsorbe: false,
            vigenciaDias: 15,
            ciudadesSinCosto: ["Toluca"],
          },
        }),
      });

      const res = await putPrecios(req);
      expect(res.status).toBe(403);
    });

    it("responde 200 OK cuando un ADMINISTRADOR modifica precios y reglas", async () => {
      const req = new NextRequest("http://localhost:3000/api/admin/precios", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token-admin",
        },
        body: JSON.stringify({
          target: "pricing",
          data: {
            ivaPorcentaje: 16,
            descuentoVolumen: { umbralUnidades: 5, porcentaje: 10 },
            topeDescuentoVendedor: 5,
            planesPago: ["contado"],
            msi: [3, 6],
            comisionMsiAbsorbe: false,
            vigenciaDias: 15,
            ciudadesSinCosto: ["Toluca"],
          },
        }),
      });

      const res = await putPrecios(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });

  describe("POST /api/upload", () => {
    it("responde 403 Forbidden si un vendedor intenta subir imágenes", async () => {
      const req = new NextRequest("http://localhost:3000/api/upload", {
        method: "POST",
        headers: {
          Authorization: "Bearer test-token-vendedor",
        },
      });

      const res = await postUpload(req);
      expect(res.status).toBe(403);
    });
  });
});
