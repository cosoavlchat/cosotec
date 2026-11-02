import { describe, it, expect, beforeEach, beforeAll, vi } from "vitest";

process.env.QUOTES_TOKEN_SECRET = "test_quotes_token_secret_123456";

import { NextRequest } from "next/server";
import { POST as subirComprobantePost } from "@/app/api/pedido/[folio]/subir-comprobante/route";
import { POST as validarSpeiPost } from "@/app/api/admin/pedidos/[folio]/validar-spei/route";
import { aprobarPagoSpei, rechazarComprobanteSpei } from "@/lib/services/order-service";
import { getBankSettings } from "@/lib/services/bank-service";
import { generarTokenAleatorio, hashToken } from "@/lib/quotes";
import { Order } from "@/types/order";

// In-memory Firestore mock store
let mockOrdersStore: Record<string, any> = {};
let mockInstallationsStore: Record<string, any> = {};
let mockAuditLogs: any[] = [];
let mockSettingsStore: Record<string, any> = {};

vi.mock("@/lib/firebase/admin", () => {
  return {
    adminDb: {
      collection: (colName: string) => ({
        doc: (id: string) => ({
          get: async () => ({
            exists: colName === "orders" ? Boolean(mockOrdersStore[id]) : colName === "settings" ? Boolean(mockSettingsStore[id]) : false,
            data: () => colName === "orders" ? mockOrdersStore[id] : mockSettingsStore[id],
          }),
          set: async (data: any, options?: any) => {
            if (colName === "orders") {
              mockOrdersStore[id] = options?.merge ? { ...mockOrdersStore[id], ...data } : data;
            } else if (colName === "installations") {
              mockInstallationsStore[id] = options?.merge ? { ...mockInstallationsStore[id], ...data } : data;
            } else if (colName === "settings") {
              mockSettingsStore[id] = options?.merge ? { ...mockSettingsStore[id], ...data } : data;
            }
          },
          update: async (data: any) => {
            if (colName === "orders") {
              mockOrdersStore[id] = { ...mockOrdersStore[id], ...data };
            }
          },
        }),
        add: async (data: any) => {
          if (colName === "auditLog") {
            mockAuditLogs.push(data);
          }
          return { id: `log_${Date.now()}` };
        },
        where: () => ({
          get: async () => ({ empty: true, docs: [] }),
        }),
      }),
    },
    adminStorage: {
      bucket: () => ({
        name: "cosotec7.appspot.com",
        file: (fileName: string) => ({
          save: async () => true,
        }),
      }),
    },
    adminAuth: {
      verifyIdToken: async () => ({ uid: "test-admin", email: "admin@cosoavl.com", role: "admin" }),
    },
  };
});

describe("Paso 3.5: Flujo de Transferencia SPEI, Comprobantes y Validación en Admin", () => {
  const folio = "CT-1124455";
  const validToken = "secure_token_spei_test_12345678";
  const validTokenHash = hashToken(validToken);

  beforeEach(() => {
    mockOrdersStore = {};
    mockInstallationsStore = {};
    mockAuditLogs = [];
    mockSettingsStore = {};

    // Orden inicial SPEI
    mockOrdersStore[folio] = {
      id: folio,
      folio,
      cartId: "cart_spei_123",
      tokenHash: validTokenHash,
      estado: "pendiente_comprobante",
      metodoPago: "spei",
      planPago: "contado",
      totalCentavos: 569138, // $5,691.38 MXN
      montoPrimerPagoCentavos: 569138,
      saldoRestanteCentavos: 0,
      contacto: {
        nombre: "Transportes Toluca S.A.",
        telefono: "5550000000",
        correo: "logistica@transportestoluca.com",
      },
      instalacion: {
        tipoLugar: "domicilio",
        direccion: "Av. Paseo Tollocan 1200",
        municipio: "Toluca",
        estadoId: "MEX",
        estadoNombre: "Estado de México",
      },
      items: [
        {
          id: "gps-vehicular-4g",
          nombre: "GPS Tracker 4G Alta Precisión",
          cantidad: 2,
          precioSinIvaCentavos: 245318,
          totalSinIvaCentavos: 490636,
          esEquipoPrincipal: true,
        },
      ],
      pagos: [
        {
          id: "P1",
          numero: 1,
          concepto: "Liquidación 100% SPEI",
          montoCentavos: 569138,
          momento: "inmediato",
          estado: "pendiente",
          externalReference: `${folio}:P1`,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Order;
  });

  describe("Subida de Comprobante por el Cliente (/api/pedido/[folio]/subir-comprobante)", () => {
    it("sube exitosamente un comprobante PDF con token válido y transiciona la orden a 'comprobante_subido'", async () => {
      const boundary = "----WebKitFormBoundaryTest";
      const fileContent = "%PDF-1.4 Fake PDF test content for receipt verification";
      const blob = new Blob([fileContent], { type: "application/pdf" });
      const file = new File([blob], "transferencia_spei_bbva.pdf", { type: "application/pdf" });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("token", validToken);

      const req = new NextRequest(`http://localhost:3000/api/pedido/${folio}/subir-comprobante`, {
        method: "POST",
        body: formData,
      });

      const res = await subirComprobantePost(req, { params: Promise.resolve({ folio }) });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.comprobante.mimeType).toBe("application/pdf");

      // Verificar que el estado de la orden en Firestore cambió a 'comprobante_subido'
      expect(mockOrdersStore[folio].estado).toBe("comprobante_subido");
      expect(mockOrdersStore[folio].comprobanteSpei).toBeDefined();
      expect(mockOrdersStore[folio].comprobanteSpei.fileName).toContain(folio);

      // Verificar registro en bitácora de auditoría
      expect(mockAuditLogs.some((l) => l.tipo === "spei_comprobante_subido_cliente")).toBe(true);
    });

    it("rechaza la subida con 403 si el token de seguridad es incorrecto o revocado", async () => {
      const blob = new Blob(["image data"], { type: "image/jpeg" });
      const file = new File([blob], "foto_ticket.jpg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("token", "token_falso_invalido_456");

      const req = new NextRequest(`http://localhost:3000/api/pedido/${folio}/subir-comprobante`, {
        method: "POST",
        body: formData,
      });

      const res = await subirComprobantePost(req, { params: Promise.resolve({ folio }) });
      expect(res.status).toBe(403);

      const json = await res.json();
      expect(json.error).toContain("Token de seguridad inválido");
    });

    it("rechaza la subida con 401 si no se envía token", async () => {
      const blob = new Blob(["image data"], { type: "image/png" });
      const file = new File([blob], "comprobante.png", { type: "image/png" });

      const formData = new FormData();
      formData.append("file", file);

      const req = new NextRequest(`http://localhost:3000/api/pedido/${folio}/subir-comprobante`, {
        method: "POST",
        body: formData,
      });

      const res = await subirComprobantePost(req, { params: Promise.resolve({ folio }) });
      expect(res.status).toBe(401);
    });

    it("rechaza formatos no autorizados (ej: archivo .exe o .txt)", async () => {
      const blob = new Blob(["malicious script"], { type: "text/plain" });
      const file = new File([blob], "archivo.txt", { type: "text/plain" });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("token", validToken);

      const req = new NextRequest(`http://localhost:3000/api/pedido/${folio}/subir-comprobante`, {
        method: "POST",
        body: formData,
      });

      const res = await subirComprobantePost(req, { params: Promise.resolve({ folio }) });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Formato de archivo no admitido");
    });

    it("rechaza si la extensión es .jpg pero los magic bytes son falsos (validación por contenido)", async () => {
      // Archivo con extensión image/jpeg pero contenido de texto plano sin cabecera FF D8 FF
      const blob = new Blob(["NOT_A_REAL_IMAGE_DATA_123456789"], { type: "image/jpeg" });
      const file = new File([blob], "falso_voucher.jpg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("token", validToken);

      const req = new NextRequest(`http://localhost:3000/api/pedido/${folio}/subir-comprobante`, {
        method: "POST",
        body: formData,
      });

      const res = await subirComprobantePost(req, { params: Promise.resolve({ folio }) });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("contenido binario");
    });
  });

  describe("Validación Administrativa: Aprobar Pago SPEI", () => {
    it("aprobarPagoSpei() liquida la orden, marca P1 como aprobado y genera la ficha en 'installations'", async () => {
      // Simular que el cliente ya subió su comprobante
      mockOrdersStore[folio].estado = "comprobante_subido";
      mockOrdersStore[folio].comprobanteSpei = {
        url: "https://storage.googleapis.com/cosotec7.appspot.com/comprobantes-spei/CT-1124455/test.pdf",
        fileName: "comprobantes-spei/CT-1124455/test.pdf",
        mimeType: "application/pdf",
        sizeBytes: 154000,
        subidoAt: new Date().toISOString(),
      };

      const resultado = await aprobarPagoSpei(folio, "admin@cosoavl.com", "Abono verificado en BBVA");

      expect(resultado.estado).toBe("pagado");
      expect(mockOrdersStore[folio].estado).toBe("pagado");
      expect(mockOrdersStore[folio].pagos[0].estado).toBe("aprobado");
      expect(mockOrdersStore[folio].comprobanteSpei.validadoPor).toBe("admin@cosoavl.com");

      // Verificar creación de la orden técnica en 'installations'
      const instId = `ins_${folio}`;
      expect(mockInstallationsStore[instId]).toBeDefined();
      expect(mockInstallationsStore[instId].folio).toBe(folio);
      expect(mockInstallationsStore[instId].estado).toBe("pendiente_asignacion");
      expect(mockInstallationsStore[instId].cliente.nombre).toBe("Transportes Toluca S.A.");
      expect(mockInstallationsStore[instId].totalEquipos).toBe(2);

      // Verificar auditoría
      expect(mockAuditLogs.some((l) => l.tipo === "spei_pago_aprobado_admin")).toBe(true);
    });

    it("en esquema credi-contado, aprobarPagoSpei() transiciona a 'anticipo_pagado'", async () => {
      mockOrdersStore[folio].planPago = "credi_contado";
      mockOrdersStore[folio].pagos = [
        { id: "P1", numero: 1, concepto: "Anticipo 55%", montoCentavos: 313026, estado: "pendiente" },
        { id: "P2", numero: 2, concepto: "Finiquito 45%", montoCentavos: 256112, estado: "pendiente" },
      ];

      const resultado = await aprobarPagoSpei(folio, "admin@cosoavl.com");
      expect(resultado.estado).toBe("anticipo_pagado");
      expect(mockOrdersStore[folio].pagos[0].estado).toBe("aprobado");
      expect(mockOrdersStore[folio].pagos[1].estado).toBe("pendiente");
    });
  });

  describe("Validación Administrativa: Rechazar Comprobante SPEI", () => {
    it("rechazarComprobanteSpei() actualiza estado a 'comprobante_rechazado' y guarda el motivo", async () => {
      mockOrdersStore[folio].estado = "comprobante_subido";

      const resultado = await rechazarComprobanteSpei(
        folio,
        "El comprobante no muestra la clave de rastreo legible",
        "admin@cosoavl.com"
      );

      expect(resultado.estado).toBe("comprobante_rechazado");
      expect(resultado.motivoRechazo).toContain("clave de rastreo");
      expect(mockOrdersStore[folio].estado).toBe("comprobante_rechazado");
      expect(mockOrdersStore[folio].comprobanteSpei.motivoRechazo).toContain("clave de rastreo");

      // La instalación técnica NO debe haberse creado
      const instId = `ins_${folio}`;
      expect(mockInstallationsStore[instId]).toBeUndefined();

      // Auditoría registrada
      expect(mockAuditLogs.some((l) => l.tipo === "spei_comprobante_rechazado_admin")).toBe(true);
    });

    it("lanza error si se intenta rechazar sin motivo", async () => {
      await expect(rechazarComprobanteSpei(folio, "", "admin@cosoavl.com")).rejects.toThrow(
        "Se requiere especificar el motivo del rechazo"
      );
    });
  });

  describe("Configuración Bancaria y Candado de Datos de Prueba", () => {
    it("getBankSettings() retorna datos por defecto con esPrueba: true", async () => {
      const settings = await getBankSettings();
      expect(settings.banco).toBe("Banco de prueba");
      expect(settings.titular).toBe("CUENTA DE PRUEBA – NO TRANSFERIR");
      expect(settings.clabe).toBe("012180001234567897");
      expect(settings.esPrueba).toBe(true);
    });

    it("cuando Firestore tiene datos reales (esPrueba: false), se reflejan", async () => {
      mockSettingsStore["bank"] = {
        banco: "BBVA Bancomer",
        titular: "CoSoAVL Telecomunicaciones S.A. de C.V.",
        clabe: "012180001234567890",
        esPrueba: false,
      };

      const settings = await getBankSettings();
      expect(settings.banco).toBe("BBVA Bancomer");
      expect(settings.titular).toBe("CoSoAVL Telecomunicaciones S.A. de C.V.");
      expect(settings.esPrueba).toBe(false);
    });
  });

  describe("Endpoint Administrativo (/api/admin/pedidos/[folio]/validar-spei)", () => {
    it("responde 200 al aprobar con rol admin", async () => {
      const req = new NextRequest(`http://localhost:3000/api/admin/pedidos/${folio}/validar-spei`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token-admin",
        },
        body: JSON.stringify({ accion: "aprobar", notasAdmin: "Todo OK" }),
      });

      const res = await validarSpeiPost(req, { params: Promise.resolve({ folio }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.estado).toBe("pagado");
    });

    it("responde 403 si un vendedor intenta validar una transferencia", async () => {
      const req = new NextRequest(`http://localhost:3000/api/admin/pedidos/${folio}/validar-spei`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token-vendedor",
        },
        body: JSON.stringify({ accion: "aprobar" }),
      });

      const res = await validarSpeiPost(req, { params: Promise.resolve({ folio }) });
      expect(res.status).toBe(403);
    });
  });
});
