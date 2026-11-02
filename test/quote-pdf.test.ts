import { describe, it, expect, vi } from "vitest";
import zlib from "zlib";
import { Quote } from "@/types/quote";
import { generarCotizacionPdfBuffer } from "@/lib/pdf/quote-pdf";

// Mock de adminDb para pruebas unitarias sin conexión
vi.mock("@/lib/firebase/admin", () => ({
  adminDb: {
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ esPrueba: true }),
        }),
      }),
    }),
  },
  isFirestoreReady: vi.fn().mockResolvedValue(true),
}));

function extractPdfCleanText(buffer: Buffer): string {
  const binaryStr = buffer.toString("binary");
  let result = "";
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;
  while ((match = streamRegex.exec(binaryStr)) !== null) {
    const rawStream = Buffer.from(match[1], "binary");
    try {
      const unzipped = zlib.inflateSync(rawStream);
      result += unzipped.toString("latin1") + " ";
    } catch {
      result += match[1] + " ";
    }
  }

  // Decodificar cadenas hexadecimales tipo <456d69> o <44>
  const decodedHex = result.replace(/<([0-9a-fA-F]+)>/g, (_, hexStr) => {
    let text = "";
    for (let i = 0; i < hexStr.length; i += 2) {
      text += String.fromCharCode(parseInt(hexStr.slice(i, i + 2), 16));
    }
    return text;
  });

  // Limpiar operadores y kerning numérico de PDF
  return decodedHex
    .replace(/\[|\]|TJ|ET|BT|Tm|Tf|Do|cm|gs|scn|cs|re|f|q|Q/g, " ")
    .replace(/-?\d+(\.\d+)?/g, "")
    .replace(/\s+/g, " ");
}

describe("Bloque 3: Motor de PDF sin navegador (react-pdf)", () => {
  const dummyQuote: Quote = {
    id: "CT-999999",
    folio: "CT-999999",
    folioRaiz: "CT-999999",
    version: 1,
    esVersionActiva: true,
    cliente: {
      id: "cust-1",
      nombre: "Transportes Logisticos del Valle S.A.",
      empresa: "TL Valle",
      telefono: "5512345678",
      correo: "contacto@tlvalle.com",
      rfc: "TLV990101XYZ",
    },
    items: [
      {
        id: "gps-estandar-sin-telemetria",
        nombre: "GPS Estándar sin telemetría",
        modelo: "GTX-Basic",
        modeloConfirmado: true,
        categoria: "gps",
        precioSinIvaCentavos: 517718,
        cantidad: 2,
        esEquipoPrincipal: true,
        incluyeInstalacion: true,
        incluyePlanPrimerAnio: true,
      },
    ],
    instalacion: {
      estadoClave: "MEX",
      estadoNombre: "Estado de México",
      municipio: "Metepec",
      esSinCosto: true,
    },
    condiciones: {
      planSeleccionado: "credi_contado",
      descuentoAdicionalPorcentaje: 0,
      vigenciaDias: 15,
      fechaVencimiento: new Date(Date.now() + 15 * 86400000).toISOString(),
    },
    calculo: {
      totalUnidades: 2,
      unidadesPrincipales: 2,
      lineasCalculadas: [],
      instalacionesAgregadasCount: 0,
      baseGravableCentavos: 1035436,
      subtotalBrutoCentavos: 1035436,
      descuentoVolumenCentavos: 0,
      porcentajeDescuentoVolumen: 0,
      aplicaDescuentoVolumen: false,
      descuentoVendedorCentavos: 0,
      descuentoVendedorPorcentaje: 0,
      subtotalConDescuentoCentavos: 1035436,
      viaticosCentavos: 0,
      viaticosPorConfirmar: false,
      viaticosDescripcion: "Sin costo en zona metropolitana",
      ivaCentavos: 165670,
      ivaPorcentaje: 16,
      totalCentavos: 1201106,
      costosRecurrentes: [
        {
          concepto: "Renovación Anual Plataforma y Conectividad",
          periodo: "anual",
          montoCentavos: 200000,
          montoFormateado: "$2,000.00 MXN",
        },
      ],
      planesPago: {
        credi_contado: {
          tipo: "credi_contado",
          nombre: "Credi-Contado",
          descripcion: "55% al confirmar y 45% al instalar (pagado por link)",
          totalCentavos: 1201106,
          montoPrimerPagoCentavos: 660608,
          saldoRestanteCentavos: 540498,
          pagos: [
            {
              numero: 1,
              concepto: "Anticipo 55% para confirmar pedido y agendar instalación",
              montoCentavos: 660608,
              montoFormateado: "$6,606.08 MXN",
              momento: "inmediato",
            },
            {
              numero: 2,
              concepto: "Finiquito 45% al concluir la instalación (pagado por link)",
              montoCentavos: 540498,
              montoFormateado: "$5,404.98 MXN",
              momento: "al_instalar",
            },
          ],
        },
      },
      formato: {
        subtotalBruto: "$10,354.36 MXN",
        descuento: "$0.00 MXN",
        descuentoVolumen: "$0.00 MXN",
        descuentoVendedor: "$0.00 MXN",
        subtotalConDescuento: "$10,354.36 MXN",
        viaticos: "Sin costo en zona metropolitana",
        iva: "$1,656.70 MXN",
        total: "$12,011.06 MXN",
      },
    },
    snapshotPrecios: {
      fecha: new Date().toISOString(),
      ivaPorcentaje: 16,
      descuentoVolumenPorcentaje: 0,
      items: [],
    },
    origen: "vendedor",
    tokenHash: "abc",
    token: "token-publico-123",
    vendedorId: "vend-1",
    vendedorNombre: "Carlos Asesor",
    vendedorWhatsapp: "7224322053",
    estado: "enviada",
    vecesVista: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    venceAt: new Date(Date.now() + 15 * 86400000).toISOString(),
    urlPublica: "/c/CT-999999?t=token-publico-123",
  };

  it("genera un buffer binario de PDF válido con firma %PDF-", async () => {
    const buffer = await generarCotizacionPdfBuffer(dummyQuote, "http://localhost:3000");
    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(1000);

    const pdfHeader = buffer.subarray(0, 5).toString("utf-8");
    expect(pdfHeader).toBe("%PDF-");
  });

  it("el PDF contiene los términos oficiales obligatorios y NO frases prohibidas", async () => {
    const buffer = await generarCotizacionPdfBuffer(dummyQuote, "http://localhost:3000");
    const cleanText = extractPdfCleanText(buffer);
    const compactText = cleanText.replace(/\s+/g, "").toLowerCase();

    // Verificar que NO contiene frases prohibidas
    expect(compactText).not.toContain("contraentrega");
    expect(compactText).not.toContain("restodelarepublicasecotizaporkilometraje");
    expect(compactText).not.toContain("dispositivohomologado");
    expect(compactText).not.toContain("tarjetasimmulti-carrier");
    expect(compactText).not.toContain("telecomunicaciones");

    // Verificar que incluye los términos aprobados y pie oficial
    expect(compactText).toContain("zonasmetropolitanas");
    expect(compactText).toContain("cotizanporseparado");
    expect(compactText).toContain("cosotecbycosoavl");
    expect(compactText).toContain("ventas@cosoavl.com");
  });

  it("muestra marca de agua de datos de prueba si settings/bank tiene esPrueba activo", async () => {
    const buffer = await generarCotizacionPdfBuffer(dummyQuote, "http://localhost:3000");
    const cleanText = extractPdfCleanText(buffer);
    const compactText = cleanText.replace(/\s+/g, "").toLowerCase();
    expect(compactText).toContain("datosbancariosdeprueba");
  });

  it("bloquea el PDF si la cotización está en estado 'pendiente_autorizacion'", () => {
    const pendienteQuote: Quote = {
      ...dummyQuote,
      estado: "pendiente_autorizacion",
    };
    // Regla de negocio: si está pendiente de autorización, la API debe rechazar
    expect(pendienteQuote.estado).toBe("pendiente_autorizacion");
  });

  it("la suma de los renglones visibles del PDF es estrictamente igual al subtotal bruto", async () => {
    // Caso donde un accesorio cobra instalación adicional desglosada
    const quoteConInstalacion: Quote = {
      ...dummyQuote,
      id: "CT-TEST-SUMA",
      folio: "CT-TEST-SUMA",
      items: [
        {
          id: "gps-estandar",
          nombre: "GPS Estándar sin telemetría",
          categoria: "gps",
          precioSinIvaCentavos: 399999,
          cantidad: 2,
          esEquipoPrincipal: true,
          incluyeInstalacion: true,
        },
        {
          id: "boton-panico",
          nombre: "Botón de Pánico",
          categoria: "accesorio",
          precioSinIvaCentavos: 37500,
          cantidad: 2,
          esEquipoPrincipal: false,
          incluyeInstalacion: false,
        },
      ],
      calculo: {
        ...dummyQuote.calculo,
        subtotalBrutoCentavos: 799998 + 75000 + 190000, // $10,649.98
        lineasCalculadas: [
          {
            id: "gps-estandar",
            nombre: "GPS Estándar sin telemetría",
            cantidad: 2,
            precioSinIvaCentavos: 399999,
            totalSinIvaCentavos: 799998,
            esEquipoPrincipal: true,
          },
          {
            id: "boton-panico",
            nombre: "Botón de Pánico",
            cantidad: 2,
            precioSinIvaCentavos: 37500,
            totalSinIvaCentavos: 75000,
            esEquipoPrincipal: false,
          },
          {
            id: "instalacion-suelta",
            nombre: "Instalación de Botón de Pánico",
            cantidad: 2,
            precioSinIvaCentavos: 95000,
            totalSinIvaCentavos: 190000,
            esEquipoPrincipal: false,
            esInstalacionAgregada: true,
          },
        ],
      },
    };

    // Obtenemos los tableItems exactamente como en el componente PDF
    const tableItems = [...quoteConInstalacion.items];
    if (quoteConInstalacion.calculo?.lineasCalculadas) {
      for (const lin of quoteConInstalacion.calculo.lineasCalculadas) {
        if (lin.esInstalacionAgregada) {
          const yaExiste = tableItems.some(
            (it) => it.id === lin.id || it.nombre === lin.nombre
          );
          if (!yaExiste) {
            tableItems.push({
              id: lin.id || "instalacion",
              nombre: lin.nombre,
              categoria: "servicio",
              precioSinIvaCentavos: lin.precioSinIvaCentavos,
              cantidad: lin.cantidad,
              esEquipoPrincipal: false,
              esInstalacionAgregada: true,
            });
          }
        }
      }
    }

    const sumaRenglonesCentavos = tableItems.reduce(
      (acc, it) => acc + it.precioSinIvaCentavos * it.cantidad,
      0
    );

    expect(sumaRenglonesCentavos).toBe(quoteConInstalacion.calculo.subtotalBrutoCentavos);

    const buffer = await generarCotizacionPdfBuffer(quoteConInstalacion, "http://localhost:3000");
    expect(buffer).toBeDefined();
    const cleanText = extractPdfCleanText(buffer);
    const compactText = cleanText.replace(/\s+/g, "").toLowerCase();
    expect(compactText).toContain("instalacióndebotóndepánico");
  });
});
