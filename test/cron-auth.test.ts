import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET as getCarritosAbandonados } from "@/app/api/cron/carritos-abandonados/route";
import { GET as getCobrosProgramados } from "@/app/api/cron/cobros-programados/route";

vi.mock("@/lib/services/abandoned-cart-service", () => ({
  verificarCarritosAbandonados: vi.fn().mockResolvedValue({ procesados: 0, leadsCreados: 0 }),
}));

vi.mock("@/lib/services/order-service", () => ({
  verificarCobrosProgramadosVencidos: vi.fn().mockResolvedValue({ total: 0, vencidosProcesados: [] }),
}));

describe("Seguridad y Protección de Endpoints Programados (/api/cron/*)", () => {
  const testSecret = "super_secret_cron_token_12345";

  beforeEach(() => {
    process.env.CRON_SECRET = testSecret;
  });

  describe("GET /api/cron/carritos-abandonados", () => {
    it("responde 401 si no se envía ningún encabezado de autorización", async () => {
      const req = new NextRequest("http://localhost:3000/api/cron/carritos-abandonados");
      const res = await getCarritosAbandonados(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain("No autorizado");
    });

    it("responde 401 si el secreto enviado es inválido", async () => {
      const req = new NextRequest("http://localhost:3000/api/cron/carritos-abandonados", {
        headers: {
          Authorization: "Bearer token_falso_erroneo",
        },
      });
      const res = await getCarritosAbandonados(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain("inválido");
    });

    it("responde 200 con Authorization: Bearer <CRON_SECRET>", async () => {
      const req = new NextRequest("http://localhost:3000/api/cron/carritos-abandonados", {
        headers: {
          Authorization: `Bearer ${testSecret}`,
        },
      });
      const res = await getCarritosAbandonados(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });

    it("responde 200 con encabezado x-cron-secret", async () => {
      const req = new NextRequest("http://localhost:3000/api/cron/carritos-abandonados", {
        headers: {
          "x-cron-secret": testSecret,
        },
      });
      const res = await getCarritosAbandonados(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });

  describe("GET /api/cron/cobros-programados", () => {
    it("responde 401 si se llama públicamente sin credenciales", async () => {
      const req = new NextRequest("http://localhost:3000/api/cron/cobros-programados");
      const res = await getCobrosProgramados(req);

      expect(res.status).toBe(401);
    });

    it("responde 200 cuando se autentica con el secreto oficial", async () => {
      const req = new NextRequest("http://localhost:3000/api/cron/cobros-programados", {
        headers: {
          Authorization: `Bearer ${testSecret}`,
        },
      });
      const res = await getCobrosProgramados(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });
});

