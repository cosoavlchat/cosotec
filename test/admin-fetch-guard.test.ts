import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as getUsuarios, POST as postUsuarios } from "@/app/api/admin/usuarios/route";
import { adminFetch } from "@/lib/auth/admin-fetch";

// Mock firebase client auth
const mockGetIdToken = vi.fn();
let mockCurrentUser: { getIdToken: typeof mockGetIdToken } | null = null;

vi.mock("@/lib/firebase/client", () => ({
  auth: {
    get currentUser() {
      return mockCurrentUser;
    },
  },
}));

describe("Seguridad del Panel y Control de Acceso", () => {
  describe("API /api/admin/usuarios", () => {
    it("responde 401 si no se envía token", async () => {
      const req = new NextRequest("http://localhost:3000/api/admin/usuarios", {
        method: "GET",
      });
      const res = await getUsuarios(req);
      expect(res.status).toBe(401);
    });

    it("responde 403 Forbidden cuando un VENDEDOR intenta listar o crear usuarios", async () => {
      const getReq = new NextRequest("http://localhost:3000/api/admin/usuarios", {
        method: "GET",
        headers: { Authorization: "Bearer test-token-vendedor" },
      });
      const getRes = await getUsuarios(getReq);
      expect(getRes.status).toBe(403);

      const postReq = new NextRequest("http://localhost:3000/api/admin/usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token-vendedor",
        },
        body: JSON.stringify({
          data: { email: "nuevo@cosoavl.com", role: "vendedor", nombre: "Vendedor Test" },
        }),
      });
      const postRes = await postUsuarios(postReq);
      expect(postRes.status).toBe(403);
    });
  });

  describe("adminFetch y refresco automático de token", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      mockCurrentUser = null;
      // Mock global fetch and window
      (globalThis as any).window = {
        location: { href: "" },
      };
    });

    it("redirige al login si no hay usuario autenticado en Firebase", async () => {
      mockCurrentUser = null;
      await expect(adminFetch("/api/admin/test")).rejects.toThrow("No hay una sesión activa de Firebase Auth");
      expect((globalThis as any).window.location.href).toBe("/admin/login?expired=1");
    });

    it("refresca el token con getIdToken(true) y reintenta ante una respuesta 401", async () => {
      mockGetIdToken
        .mockResolvedValueOnce("token-inicial-expirado")
        .mockResolvedValueOnce("token-refrescado-fresco");

      mockCurrentUser = { getIdToken: mockGetIdToken };

      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation((url, init) => {
        callCount++;
        const authHeader = init?.headers?.["Authorization"] || init?.headers?.get?.("Authorization");
        if (callCount === 1) {
          expect(authHeader).toBe("Bearer token-inicial-expirado");
          return Promise.resolve(new Response(JSON.stringify({ error: "Token expirado" }), { status: 401 }));
        }
        expect(authHeader).toBe("Bearer token-refrescado-fresco");
        return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
      }) as any;

      const res = await adminFetch("/api/admin/test");
      expect(res.status).toBe(200);
      expect(mockGetIdToken).toHaveBeenCalledTimes(2);
      expect(mockGetIdToken).toHaveBeenNthCalledWith(2, true); // true for force refresh
    });
  });
});
