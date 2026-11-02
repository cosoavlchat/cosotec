import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  enviarEmail,
  notificarFichaInstalacionASoporte,
  notificarConfirmacionPedidoCliente,
  notificarResultadoSpeiCliente,
  notificarCobroDiferidoCliente,
  getSoporteEmails,
  getContactPie,
} from "@/lib/services/email-service";
import {
  limpiarTituloSaludo,
  formatFechaEspanol,
  formatHorarioEspanol,
  formatTelefonoLocal,
  DEFAULT_EMAIL_FOOTER,
} from "@/components/emails/email-helpers";
import { Order } from "@/types/order";

let mockEmailQueue: any[] = [];
let mockAuditLog: any[] = [];
let mockNotificationsDoc: any = null;
let mockContactDoc: any = null;
let mockShiftsDoc: any = null;
let mockBankDoc: any = null;

vi.mock("@/lib/firebase/admin", () => ({
  adminDb: {
    collection: (col: string) => ({
      add: vi.fn().mockImplementation(async (data: any) => {
        if (col === "emailQueue") mockEmailQueue.push(data);
        if (col === "auditLog") mockAuditLog.push(data);
        return { id: `doc_${Date.now()}` };
      }),
      doc: (id: string) => ({
        get: vi.fn().mockImplementation(async () => {
          if (col === "settings" && id === "notifications") {
            return {
              exists: Boolean(mockNotificationsDoc),
              data: () => mockNotificationsDoc,
            };
          }
          if (col === "settings" && id === "contact") {
            return {
              exists: Boolean(mockContactDoc),
              data: () => mockContactDoc,
            };
          }
          if (col === "settings" && id === "shifts") {
            return {
              exists: Boolean(mockShiftsDoc),
              data: () => mockShiftsDoc,
            };
          }
          if (col === "settings" && id === "bank") {
            return {
              exists: Boolean(mockBankDoc),
              data: () => mockBankDoc,
            };
          }
          return { exists: false, data: () => null };
        }),
        update: vi.fn().mockResolvedValue({}),
      }),
    }),
  },
}));

describe("Paso 3.6: Notificaciones por Correo con Resend y React Email (Ajustes de Calidad)", () => {
  const dummyOrder: Order = {
    id: "CT-1124451",
    folio: "CT-1124451",
    cartId: "cart_test_email",
    tokenHash: "dummy_hash_123",
    estado: "anticipo_pagado",
    metodoPago: "mercadopago",
    planPago: "credi_contado",
    montoPrimerPagoCentavos: 313026,
    saldoRestanteCentavos: 256112,
    totalCentavos: 569138,
    contacto: {
      nombre: "Ing. Roberto Domínguez",
      telefono: "7221340127",
      correo: "r.dominguez@ejemplo.com",
      empresa: "Logística del Centro",
    },
    instalacion: {
      tipoLugar: "domicilio",
      direccion: "Av. Tollocan 1250",
      municipio: "Toluca",
      estadoClave: "MEX",
      estadoNombre: "Estado de México",
      fechaTentativa: "2026-11-12",
      horarioTentativo: "manana",
      referencias: "Portón trasero, patio 2",
    },
    unidades: [
      {
        id: "u_kenworth_1",
        equipoIndex: 0,
        equipoNombre: "GPS Intermedio",
        tipoVehiculo: "Tractocamión",
        marca: "Kenworth",
        modelo: "T680",
        anio: "2024",
        color: "Blanco",
        numeroEconomico: "ECO-101",
        vin: "3AKJHGD8723654129",
        placas: "789-XY-2",
      },
    ],
    items: [
      {
        id: "gps-intermedio",
        nombre: "GPS Intermedio",
        cantidad: 1,
        precioSinIvaCentavos: 797700,
        totalSinIvaCentavos: 797700,
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
        externalReference: "CT-1124451:P1",
      },
      {
        id: "P2",
        numero: 2,
        concepto: "Finiquito 45% al concluir instalación",
        montoCentavos: 256112,
        momento: "al_instalar",
        estado: "pendiente",
        externalReference: "CT-1124451:P2",
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    mockEmailQueue = [];
    mockAuditLog = [];
    mockNotificationsDoc = null;
    mockContactDoc = null;
    mockShiftsDoc = null;
    mockBankDoc = null;
    delete process.env.RESEND_API_KEY;
    delete process.env.APP_BASE_URL;
    vi.restoreAllMocks();
  });

  describe("1. Formateadores y Ayudantes de Texto", () => {
    it("3. Saludo: limpia títulos de cortesía y profesionales (Ing., Lic., Sr., Sra., Dr.)", () => {
      expect(limpiarTituloSaludo("Ing. Roberto Domínguez")).toBe("Roberto Domínguez");
      expect(limpiarTituloSaludo("ing. roberto domínguez")).toBe("roberto domínguez");
      expect(limpiarTituloSaludo("Lic. María Pérez")).toBe("María Pérez");
      expect(limpiarTituloSaludo("Dr. Carlos Silva")).toBe("Carlos Silva");
      expect(limpiarTituloSaludo("Dra. Carmen Solís")).toBe("Carmen Solís");
      expect(limpiarTituloSaludo("Sr. Juan López")).toBe("Juan López");
      expect(limpiarTituloSaludo("Sra. Ana García")).toBe("Ana García");
      expect(limpiarTituloSaludo("Arq. Luis Barragán")).toBe("Luis Barragán");
      expect(limpiarTituloSaludo("Prof. Manuel Ruiz")).toBe("Manuel Ruiz");
      expect(limpiarTituloSaludo("Mtro. Gabriel Mendoza")).toBe("Gabriel Mendoza");
      expect(limpiarTituloSaludo("Roberto Domínguez")).toBe("Roberto Domínguez");
      expect(limpiarTituloSaludo("")).toBe("Cliente");
      expect(limpiarTituloSaludo(undefined)).toBe("Cliente");
    });

    it("7. Fechas: formatea fechas en español determinista", () => {
      expect(formatFechaEspanol("2026-11-12")).toBe("jueves 12 de noviembre de 2026");
      expect(formatFechaEspanol("2026-11-15")).toBe("domingo 15 de noviembre de 2026");
      expect(formatFechaEspanol("")).toBe("Por coordinar");
      expect(formatFechaEspanol(undefined)).toBe("Por coordinar");
    });

    it("7. Horario: utiliza 'ñ' para Mañana y formatea rangos", () => {
      expect(formatHorarioEspanol("manana")).toBe("Mañana (09:00–14:00)");
      expect(formatHorarioEspanol("mañana")).toBe("Mañana (09:00–14:00)");
      expect(formatHorarioEspanol("tarde")).toBe("Tarde (14:00–18:00)");
      expect(formatHorarioEspanol("completo")).toBe("Día completo (09:00–18:00)");
    });

    it("7. Teléfonos: formatea números a estándar local 10 dígitos (XXX XXX XXXX)", () => {
      expect(formatTelefonoLocal("7221340127")).toBe("722 134 0127");
      expect(formatTelefonoLocal("+527221340127")).toBe("722 134 0127");
      expect(formatTelefonoLocal("527224322053")).toBe("722 432 2053");
    });

    it("1. Pie único oficial: verifica el texto exacto predeterminado", () => {
      expect(DEFAULT_EMAIL_FOOTER).toBe(
        "CosoTec by CoSoAVL · Metepec, Estado de México · ventas@cosoavl.com · Tel. 722 134 0127 · WhatsApp 722 432 2053"
      );
    });

    it("2. Fallback de soporte: solo contiene ventas@cosoavl.com y no soporte@cosoavl.com", async () => {
      const soportes = await getSoporteEmails();
      expect(soportes).toEqual(["ventas@cosoavl.com"]);
      expect(soportes).not.toContain("soporte@cosoavl.com");
    });
  });

  describe("2. Ficha de Soporte (FichaInstalacionEmail)", () => {
    it("5. Ficha de soporte muestra 'Saldo pendiente (se cobra al cliente por link de pago; el técnico no cobra)', VIN, No. Económico, Color y Placas", async () => {
      await notificarFichaInstalacionASoporte(dummyOrder);

      expect(mockEmailQueue.length).toBe(1);
      const encolado = mockEmailQueue[0];
      const html = encolado.html;

      // 5. Cambio de texto de saldo
      expect(html).toContain("Saldo pendiente (se cobra al cliente por link de pago; el técnico no cobra)");
      expect(html).not.toContain("Saldo por cobrar al instalar");

      // 5. Datos de unidad agregados
      expect(html).toContain("ECO-101");
      expect(html).toContain("3AKJHGD8723654129");
      expect(html).toContain("Blanco");
      expect(html).toContain("789-XY-2");

      // Placas con estilo nowrap
      expect(html).toContain("white-space:nowrap");

      // 1. Pie único
      expect(html).toContain("CosoTec by CoSoAVL · Metepec, Estado de México · ventas@cosoavl.com");

      // 3. Saludo sin título
      expect(html).toContain("Roberto Domínguez");
      expect(html).not.toContain("Ing. Roberto Domínguez");

      // 7. Fecha y horario en español
      expect(html).toContain("jueves 12 de noviembre de 2026");
      expect(html).toContain("Mañana (09:00–14:00)");
    });
  });

  describe("3. Confirmación de Pedido: Dos Versiones (ConfirmacionPedidoEmail)", () => {
    it("6. Versión Pago Tarjeta/MP Aprobado: muestra '¡Pago Confirmado y Pedido en Proceso!' y pasos siguientes", async () => {
      await notificarConfirmacionPedidoCliente(dummyOrder, "token_seguro_mp");

      const html = mockEmailQueue[0].html;
      expect(html).toContain("¡Pago Confirmado y Pedido en Proceso!");
      expect(html).toContain("Hemos validado tu pago con éxito");
      expect(html).toContain("Ver Seguimiento de mi Pedido");
      expect(html).toContain("Hola, Roberto Domínguez");
      expect(html).toContain("Anticipo Cubierto");

      // Verificación de términos eliminados
      expect(html).not.toContain("plataforma de ingeniería satelital");
      expect(html).not.toContain("SIM cards M2M multicarrier");
      expect(html).not.toContain("CoSoAVL Telecomunicaciones");
    });

    it("6. Versión SPEI Pendiente: no dice que ya se inició nada, muestra datos de transferencia y botón para subir comprobante", async () => {
      const speiOrder: Order = {
        ...dummyOrder,
        metodoPago: "spei",
        estado: "pendiente_comprobante",
      };

      await notificarConfirmacionPedidoCliente(speiOrder, "token_seguro_spei");

      const html = mockEmailQueue[0].html;
      expect(html).toContain("Pedido Registrado · Pendiente de Pago SPEI");
      expect(html).toContain("Datos de Transferencia Bancaria (SPEI)");
      expect(html).toContain("Banco de prueba");
      expect(html).toContain("CUENTA DE PRUEBA – NO TRANSFERIR");
      expect(html).toContain("012180001234567897");
      expect(html).toContain("DATOS BANCARIOS DE PRUEBA – NO REALIZAR TRANSFERENCIAS");
      expect(html).toContain("Subir Comprobante de Pago");

      // No debe decir que ya se inició nada
      expect(html).not.toContain("Nuestro equipo ya inició");
      expect(html).not.toContain("plataforma de ingeniería satelital");
    });

    it("1. CANDADO ESTRICTO: ningún correo ni plantilla contiene 'BBVA', 'Bancomer' ni 'Beneficiario CoSoAVL'", async () => {
      // Probar todas las plantillas generadas
      await notificarFichaInstalacionASoporte(dummyOrder);
      await notificarConfirmacionPedidoCliente(dummyOrder, "tok1");
      const speiOrder = { ...dummyOrder, metodoPago: "spei" as const, estado: "pendiente_comprobante" as const };
      await notificarConfirmacionPedidoCliente(speiOrder, "tok2");
      await notificarResultadoSpeiCliente(dummyOrder, "tok3", "aprobado");
      await notificarResultadoSpeiCliente(dummyOrder, "tok4", "rechazado", "Motivo de prueba");
      await notificarCobroDiferidoCliente(dummyOrder, dummyOrder.pagos[1], "tok5", "/pedido/test");

      expect(mockEmailQueue.length).toBeGreaterThan(0);
      for (const item of mockEmailQueue) {
        expect(item.html).not.toMatch(/bbva/i);
        expect(item.html).not.toMatch(/bancomer/i);
        expect(item.html).not.toMatch(/beneficiario cosoavl/i);
      }
    });

    it("2. APP_BASE_URL: si falta en entorno, los links son relativos y se registra un error en auditLog", async () => {
      delete process.env.APP_BASE_URL;
      delete process.env.NEXT_PUBLIC_APP_URL;

      await notificarConfirmacionPedidoCliente(dummyOrder, "token_relativo");

      const html = mockEmailQueue[0].html;
      // El link debe comenzar directamente con /pedido/
      expect(html).toContain('href="/pedido/CT-1124451?t=token_relativo"');
      expect(html).not.toContain("https://cosotec7.web.app");

      // Debe registrar error en auditLog
      expect(mockAuditLog.some((l) => l.tipo === "error_configuracion_base_url")).toBe(true);
    });

    it("3. Horarios de turno se leen dinámicamente de settings/shifts", async () => {
      mockShiftsDoc = {
        manana: {
          id: "manana",
          nombre: "Mañana VIP",
          horario: "08:00–13:00",
          etiqueta: "Mañana Especial (08:00–13:00)",
        },
      };

      await notificarFichaInstalacionASoporte(dummyOrder);

      const html = mockEmailQueue[0].html;
      expect(html).toContain("Mañana Especial (08:00–13:00)");
    });
  });

  describe("4. Aviso SPEI y Montos por Pago (AvisoSpeiEmail)", () => {
    it("4. Aviso SPEI Aprobado muestra monto de ESE pago, lo acumulado y saldo restante con calendario", async () => {
      await notificarResultadoSpeiCliente(dummyOrder, "token_spei_ok", "aprobado");

      const html = mockEmailQueue[0].html;
      expect(html).toContain("¡Pago SPEI Acreditado con Éxito!");
      expect(html).toContain("Monto Acreditado en este Pago");
      expect(html).toContain("Total Pagado Acumulado");
      expect(html).toContain("Saldo Pendiente");
      expect(html).toContain("Próximas Exhibiciones Programadas");

      // Lenguaje neutro: sin 'departamento de contabilidad'
      expect(html).not.toContain("departamento de contabilidad");
      expect(html).toContain("Hemos validado tu pago");
    });

    it("Aviso SPEI Rechazado muestra motivo de rechazo y botón de corrección", async () => {
      const motivo = "No coincide el número de referencia ni la cuenta receptora";
      await notificarResultadoSpeiCliente(dummyOrder, "token_spei_fail", "rechazado", motivo);

      const html = mockEmailQueue[0].html;
      expect(html).toContain("Comprobante SPEI No Acreditado");
      expect(html).toContain(motivo);
      expect(html).toContain("Subir Nuevo Comprobante Corregido");
    });
  });

  describe("5. Cobro Diferido (CobroDiferidoEmail)", () => {
    it("Cobro diferido P2 incluye monto exacto, concepto, enlace de pago y pie corporativo único", async () => {
      const pagoP2 = dummyOrder.pagos[1];
      const linkCobro = "https://cosotec7.web.app/pedido/CT-1124451?t=tok_p2&pago=P2";

      await notificarCobroDiferidoCliente(dummyOrder, pagoP2, "tok_p2", linkCobro);

      const html = mockEmailQueue[0].html;
      expect(html).toContain("Monto a Liquidar (P2)");
      expect(html).toContain("Finiquito 45% al concluir instalación");
      expect(html).toContain("Pagar en Línea con Tarjeta / Consultar SPEI");
      expect(html).toContain("CosoTec by CoSoAVL · Metepec, Estado de México");
      expect(html).not.toContain("Soluciones de Rastreo e Ingeniería");
    });
  });
});
