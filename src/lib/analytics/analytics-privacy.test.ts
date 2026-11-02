import { describe, it, expect } from "vitest";
import {
  isSensitiveRoute,
  sanitizeAnalyticsUrl,
  sanitizeAnalyticsParams,
} from "./privacy";
import { securityHeaders } from "@/config/security-headers";

describe("Privacidad de Datos y Tokens en Analítica (GA4 y Meta Pixel)", () => {
  it("detecta correctamente rutas sensibles (/c/*, /checkout, /pedido/*)", () => {
    expect(isSensitiveRoute("/c/CT-1124451")).toBe(true);
    expect(isSensitiveRoute("/checkout")).toBe(true);
    expect(isSensitiveRoute("/checkout/paso-2")).toBe(true);
    expect(isSensitiveRoute("/pedido/CT-1124451")).toBe(true);

    expect(isSensitiveRoute("/tienda")).toBe(false);
    expect(isSensitiveRoute("/p/gps-flotilla")).toBe(false);
    expect(isSensitiveRoute("/")).toBe(false);
  });

  it("elimina estrictamente el query string (?t=...) en rutas sensibles para page_location y page_path", () => {
    const origin = "https://cosotec.com";

    // Ruta de cotización con token
    const resCotizacion = sanitizeAnalyticsUrl(
      origin,
      "/c/CT-1124451",
      "?t=c584c5352e06b66c8d3347ce78833309"
    );
    expect(resCotizacion.page_path).toBe("/c/CT-1124451");
    expect(resCotizacion.page_location).toBe("https://cosotec.com/c/CT-1124451");
    expect(resCotizacion.page_location).not.toContain("?t=");
    expect(resCotizacion.page_location).not.toContain("c584c5352e06b66c8d3347ce78833309");

    // Ruta de checkout con token y folio
    const resCheckout = sanitizeAnalyticsUrl(
      origin,
      "/checkout",
      "?folio=CT-1124451&t=secret_token_123"
    );
    expect(resCheckout.page_path).toBe("/checkout");
    expect(resCheckout.page_location).toBe("https://cosotec.com/checkout");
    expect(resCheckout.page_location).not.toContain("secret_token_123");

    // Ruta de pedido
    const resPedido = sanitizeAnalyticsUrl(
      origin,
      "/pedido/CT-1124451",
      "?token=abc"
    );
    expect(resPedido.page_path).toBe("/pedido/CT-1124451");
    expect(resPedido.page_location).toBe("https://cosotec.com/pedido/CT-1124451");
    expect(resPedido.page_location).not.toContain("abc");
  });

  it("rutas públicas preservan query params de navegación ordinaria (filtros, paginación)", () => {
    const origin = "https://cosotec.com";
    const resTienda = sanitizeAnalyticsUrl(origin, "/tienda", "?cat=gps&page=2");
    expect(resTienda.page_path).toBe("/tienda?cat=gps&page=2");
    expect(resTienda.page_location).toBe("https://cosotec.com/tienda?cat=gps&page=2");
  });

  it("sanitizeAnalyticsParams purga tokens y datos personales del cliente", () => {
    const paramsSucios = {
      content_name: "GPS Flotilla Pro",
      value: 8877.0,
      currency: "MXN",
      t: "secreto123",
      token: "token_sensible",
      telefono: "7221234567",
      correo: "cliente@empresa.com",
      nombre: "Juan Perez",
      rfc: "XAXX010101000",
    };

    const paramsLimpios = sanitizeAnalyticsParams(paramsSucios);

    expect(paramsLimpios).toEqual({
      content_name: "GPS Flotilla Pro",
      value: 8877.0,
      currency: "MXN",
    });
    expect(paramsLimpios?.t).toBeUndefined();
    expect(paramsLimpios?.token).toBeUndefined();
    expect(paramsLimpios?.telefono).toBeUndefined();
    expect(paramsLimpios?.correo).toBeUndefined();
    expect(paramsLimpios?.nombre).toBeUndefined();
    expect(paramsLimpios?.rfc).toBeUndefined();
  });

  it("security-headers define Referrer-Policy: strict-origin-when-cross-origin y noindex en rutas sensibles", async () => {
    const headersList = await securityHeaders();

    const sensitiveSources = ["/c/:path*", "/checkout", "/checkout/:path*", "/pedido/:path*"];

    for (const source of sensitiveSources) {
      const match = headersList.find((h: any) => h.source === source);
      expect(match).toBeDefined();

      if (match) {
        const refPolicy = match.headers.find((hdr: any) => hdr.key === "Referrer-Policy");
        expect(refPolicy?.value).toBe("strict-origin-when-cross-origin");

        const robots = match.headers.find((hdr: any) => hdr.key === "X-Robots-Tag");
        expect(robots?.value).toBe("noindex, nofollow");
      }
    }
  });
});
