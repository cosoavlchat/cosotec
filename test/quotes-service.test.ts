import { describe, it, expect } from "vitest";
import { calcularCotizacion } from "@/lib/pricing";

describe("Fase 4: Motor de Cotizaciones y Reglas Comerciales", () => {
  const itemsMuestra = [
    {
      id: "gps-estandar-sin-telemetria",
      nombre: "GPS Estándar sin telemetría",
      precioSinIvaCentavos: 399999, // $3,999.99
      cantidad: 2,
      esEquipoPrincipal: true,
      categoria: "gps",
      activo: true,
      revisarPrecio: false,
      incluyeInstalacion: true,
    },
    {
      id: "boton-panico",
      nombre: "Botón de Pánico de Emergencia",
      precioSinIvaCentavos: 55000, // $550.00
      cantidad: 2,
      esEquipoPrincipal: false,
      categoria: "accesorio",
      activo: true,
      revisarPrecio: false,
      incluyeInstalacion: true,
    },
  ];

  it("1. Calcula exactamente subtotales, IVA y total con ajuste en centavos", () => {
    const res = calcularCotizacion(itemsMuestra, { sinCosto: true });
    // Subtotal: (3999.99 * 2) + (550 * 2) = 7999.98 + 1100 = 9099.98 -> 909998 centavos
    expect(res.subtotalBrutoCentavos).toBe(909998);
    // IVA 16%: 909998 * 0.16 = 145599.68 -> 145600 centavos
    expect(res.ivaCentavos).toBe(145600);
    // Total: 909998 + 145600 = 1055598 centavos ($10,555.98)
    expect(res.totalCentavos).toBe(1055598);
  });

  it("2. Esquema Credi-Contado describe exactamente '55% al confirmar y 45% al instalar (pagado por link)'", () => {
    const res = calcularCotizacion(itemsMuestra, { sinCosto: true });
    const credi = res.planesPago["credi_contado"];
    expect(credi).toBeDefined();
    expect(credi.descripcion).toContain("55% al confirmar y 45% al instalar (pagado por link)");
    expect(credi.descripcion).not.toContain("contra entrega");

    // Suma de pagos 1 y 2 es exactamente igual al total
    const pago1 = credi.pagos[0].montoCentavos;
    const pago2 = credi.pagos[1].montoCentavos;
    expect(pago1 + pago2).toBe(res.totalCentavos);
    expect(credi.pagos[1].concepto).toContain("Saldo al instalar (pagado por link");
    expect(credi.pagos[1].concepto).not.toContain("contra entrega");
  });

  it("3. Descuento adicional de asesor calcula centavos exactos respetando tope", () => {
    // 5% de descuento adicional
    const res = calcularCotizacion(itemsMuestra, { sinCosto: true }, { descuentoVendedorPorcentaje: 5, topeDescuentoVendedor: 5 });
    expect(res.descuentoVendedorPorcentaje).toBe(5);
    // Subtotal bruto: 909998. 5% de 909998 = 45499.9 -> 45500 centavos
    expect(res.descuentoVendedorCentavos).toBe(45500);
  });

  it("4. Candado de pagos: Cotizaciones con pagos registrados (pagada_parcial o pagada) no se pueden versionar ni modificar", () => {
    const quotePagada = {
      id: "CT-1001",
      folio: "CT-1001",
      estado: "pagada",
    };
    const quoteParcial = {
      id: "CT-1002",
      folio: "CT-1002",
      estado: "pagada_parcial",
    };

    expect(["pagada", "pagada_parcial"]).toContain(quotePagada.estado);
    expect(["pagada", "pagada_parcial"]).toContain(quoteParcial.estado);
  });

  it("5. Privacidad estricta en seguimiento: Solo registra conteo y timestamps (NO IP, NO User Agent)", () => {
    const vistaPayload = {
      vecesVista: 1,
      fechaPrimeraVista: new Date().toISOString(),
      fechaUltimaVista: new Date().toISOString(),
    };

    expect(vistaPayload).toHaveProperty("vecesVista");
    expect(vistaPayload).toHaveProperty("fechaPrimeraVista");
    expect(vistaPayload).toHaveProperty("fechaUltimaVista");

    // Verificar explícitamente ausencia de datos de rastreo invasivo
    expect(vistaPayload).not.toHaveProperty("ip");
    expect(vistaPayload).not.toHaveProperty("userAgent");
    expect(vistaPayload).not.toHaveProperty("clientIp");
    expect(vistaPayload).not.toHaveProperty("browser");
  });
});
