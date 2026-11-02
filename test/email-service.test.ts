import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  enviarEmail,
  notificarFichaInstalacionASoporte,
  notificarConfirmacionPedidoCliente,
  notificarResultadoSpeiCliente,
  notificarCobroDiferidoCliente,
} from "@/lib/services/email-service";
import { Order } from "@/types/order";

let mockEmailQueue: any[] = [];
let mockAuditLog: any[] = [];
let mockNotificationsDoc: any = null;

vi.mock("@/lib/firebase/admin", () => ({
  adminDb: {
    collection: (col: string) => ({
      add: vi.fn().mockImplementation(async (data: any) => {
        if (col === "emailQueue") mockEmailQueue.push(data);
        if (col === "auditLog") mockAuditLog.push(data);
        return { id: `doc_${Date.now()}` };
      }),
      doc: (id: string) => ({
        get: vi.fn().mockImplementation(async () => ({
          exists: Boolean(mockNotificationsDoc),
          data: () => mockNotificationsDoc,
        })),
        update: vi.fn().mockResolvedValue({}),
      }),
    }),
  },
}));

describe("Paso 3.6: Notificaciones por Correo con Resend y React Email", () => {
  const dummyOrder: Order = {
    id: "CT-1124456",
    folio: "CT-1124456",
    cartId: "cart_test_email",
    tokenHash: "dummy_hash_123",
    estado: "anticipo_pagado",
    metodoPago: "mercadopago",
    planPago: "credi_contado",
    montoPrimerPagoCentavos: 313026,
    saldoRestanteCentavos: 256112,
    totalCentavos: 569138,
    contacto: {
      nombre: "Transportes Cuauhtémoc S.A.",
      telefono: "5550000000",
      correo: "contacto@transportescuauhtemoc.com",
      empresa: "Transportes Cuauhtémoc",
    },
    instalacion: {
      tipoLugar: "domicilio",
      direccion: "Av. Industrial 45",
      municipio: "Toluca",
      estadoClave: "MEX",
      estadoNombre: "Estado de México",
      fechaTentativa: "2026-11-15",
      horarioTentativo: "manana",
    },
    unidades: [
      {
        id: "u_kenworth_1",
        equipoIndex: 0,
        equipoNombre: "GPS Tracker 4G Alta Precisión",
        tipoVehiculo: "Tractocamión",
        marca: "Kenworth",
        modelo: "T680",
        anio: "2024",
        placas: "789-XY-2",
      },
    ],
    items: [
      {
        id: "gps-vehicular-4g",
        nombre: "GPS Tracker 4G Alta Precisión",
        cantidad: 1,
        precioSinIvaCentavos: 245318,
        totalSinIvaCentavos: 245318,
        esEquipoPrincipal: true,
      },
    ],
    pagos: [
      {
        id: "P1",
        numero: 1,
        concepto: "Anticipo 55% al ordenar",
        montoCentavos: 313026,
        momento: "inmediato",
        estado: "aprobado",
        externalReference: "CT-1124456:P1",
      },
      {
        id: "P2",
        numero: 2,
        concepto: "Finiquito 45% al concluir instalación",
        montoCentavos: 256112,
        momento: "al_instalar",
        estado: "pendiente",
        externalReference: "CT-1124456:P2",
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    mockEmailQueue = [];
    mockAuditLog = [];
    mockNotificationsDoc = null;
    delete process.env.RESEND_API_KEY;
    vi.restoreAllMocks();
  });

  describe("Encolamiento Resiliente (Fallback sin RESEND_API_KEY)", () => {
    it("si RESEND_API_KEY no está configurada, el correo se guarda en 'emailQueue' como pendiente sin fallar", async () => {
      const res = await notificarFichaInstalacionASoporte(dummyOrder);

      expect(res.success).toBe(true);
      expect(res.queued).toBe(true);

      expect(mockEmailQueue.length).toBe(1);
      const encolado = mockEmailQueue[0];
      expect(encolado.estado).toBe("pendiente");
      expect(encolado.tipo).toBe("ficha_instalacion");
      expect(encolado.to).toContain("ventas@cosoavl.com");
      expect(encolado.subject).toContain("CT-1124456");
      expect(encolado.html).toContain("Kenworth");
      expect(encolado.html).toContain("Saldo por Cobrar al Instalar");
    });

    it("si RESEND_API_KEY tiene el valor temporal 'temporal-pendiente', también encola sin romper el flujo", async () => {
      process.env.RESEND_API_KEY = "temporal-pendiente";

      const res = await notificarConfirmacionPedidoCliente(dummyOrder, "test_token_abc");
      expect(res.success).toBe(true);
      expect(res.queued).toBe(true);
      expect(mockEmailQueue[0].tipo).toBe("confirmacion_pedido");
    });
  });

  describe("Envío Exitoso con Resend API Mock", () => {
    it("cuando RESEND_API_KEY existe, envía petición a api.resend.com y registra en auditLog", async () => {
      process.env.RESEND_API_KEY = "re_test_key_123456";

      // Mock de global.fetch
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: "msg_resend_98765" }),
      });
      global.fetch = fetchMock;

      const res = await notificarConfirmacionPedidoCliente(dummyOrder, "token_seguro_xyz");

      expect(res.success).toBe(true);
      expect(res.resendId).toBe("msg_resend_98765");

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.resend.com/emails",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer re_test_key_123456",
          }),
        })
      );

      // Auditoría registrada
      expect(mockAuditLog.some((l) => l.tipo === "email_enviado_resend")).toBe(true);
    });
  });

  describe("Plantillas y Contenido Visual", () => {
    it("Confirmación de Pedido contiene enlace con token seguro y marca CosoTec", async () => {
      await notificarConfirmacionPedidoCliente(dummyOrder, "my_secret_token_123");

      const html = mockEmailQueue[0].html;
      expect(html).toContain("Coso");
      expect(html).toContain("Tec");
      expect(html).toContain("#7A1428"); // Color vino
      expect(html).toContain("/pedido/CT-1124456?t=my_secret_token_123");
      expect(html).toContain("Transportes");
    });

    it("Aviso SPEI Aprobado muestra confirmación de abono y citas técnicas", async () => {
      await notificarResultadoSpeiCliente(dummyOrder, "token_spei_aprobado", "aprobado");

      const html = mockEmailQueue[0].html;
      expect(html).toContain("Pago SPEI Acreditado");
      expect(html).toContain("#15803D"); // Verde
      expect(html).toContain("programada");
    });

    it("Aviso SPEI Rechazado destaca el motivo reportado y botón de corrección", async () => {
      const motivo = "La clave de rastreo bancaria está cortada en la foto";
      await notificarResultadoSpeiCliente(dummyOrder, "token_spei_rechazado", "rechazado", motivo);

      const html = mockEmailQueue[0].html;
      expect(html).toContain("Comprobante SPEI No Acreditado");
      expect(html).toContain(motivo);
      expect(html).toContain("Subir Nuevo Comprobante Corregido");
      expect(html).toContain("#991B1B"); // Rojo
    });

    it("Cobro diferido P2/P3 incluye desglose de monto y botón directo de pago", async () => {
      const pagoP2 = dummyOrder.pagos[1];
      const linkCobro = "https://cosotec.com/pedido/CT-1124456?t=token_p2&pago=P2";

      await notificarCobroDiferidoCliente(dummyOrder, pagoP2, "token_p2", linkCobro);

      const html = mockEmailQueue[0].html;
      expect(html).toContain("Finiquito 45% al concluir instalación");
      expect(html).toContain("P2");
      expect(html).toContain("token_p2");
      expect(html).toContain("pago=P2");
    });
  });
});
