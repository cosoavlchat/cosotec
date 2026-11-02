import { describe, it, expect } from "vitest";
import {
  calcularIvaCentavos,
  precioConIva,
  desglosePrecio,
  calcularDescuentoVolumen,
  formatMxn,
  parseToCentavos,
  calcularCotizacion,
  getQueIncluyeComputed,
  ItemCotizacion,
  CotizacionItemInput,
  ViaticosInput,
} from "./index";

describe("Motor de Precios CosoTec - Manejo en Centavos", () => {
  it("calcula IVA 16% con redondeo a centavos exacto", () => {
    // $5,500.00 MXN -> 550,000 centavos
    // IVA 16% = 88,000 centavos ($880.00)
    expect(calcularIvaCentavos(550000, 16)).toBe(88000);

    // $8,280.00 MXN -> 828,000 centavos
    // IVA 16% = 132,480 centavos ($1,324.80)
    expect(calcularIvaCentavos(828000, 16)).toBe(132480);

    // Caso con redondeo de fracción de centavo:
    // 399999 centavos ($3,999.99) * 0.16 = 63999.84 -> redondea a 64000 ($640.00)
    expect(calcularIvaCentavos(399999, 16)).toBe(64000);
  });

  it("precioConIva() retorna subtotal + IVA sin discrepancia de centavos", () => {
    // GPS Flotilla Pro: $8,280.00 sin IVA -> $9,604.80 con IVA
    // 828000 + 132480 = 960480 centavos
    expect(precioConIva(828000, 16)).toBe(960480);

    // Botón de pánico: $375.00 -> $435.00 con IVA
    expect(precioConIva(37500, 16)).toBe(43500);

    // DashCam Esencial JC181: $6,110.00 -> $7,087.60 con IVA
    expect(precioConIva(611000, 16)).toBe(708760);

    // DashCam Industrial JC450: $11,980.00 -> $13,896.80 con IVA
    expect(precioConIva(1198000, 16)).toBe(1389680);
  });

  it("desglosePrecio() garantiza que subtotal + IVA sea idéntico al total", () => {
    const desglose = desglosePrecio(1688000, 16); // Flotilla Pro + Combustible ($16,880.00)
    expect(desglose.precioSinIvaCentavos).toBe(1688000);
    expect(desglose.ivaCentavos).toBe(270080); // $2,700.80
    expect(desglose.totalConIvaCentavos).toBe(1958080); // $19,580.80
    expect(desglose.precioSinIvaCentavos + desglose.ivaCentavos).toBe(desglose.totalConIvaCentavos);
  });

  it("rechaza números con decimales (floats) para proteger integridad de la BD", () => {
    expect(() => calcularIvaCentavos(5500.5, 16)).toThrow(TypeError);
  });

  it("formatMxn() formatea montos en centavos al estándar $1,234.56 MXN", () => {
    expect(formatMxn(550000)).toBe("$5,500.00");
    expect(formatMxn(960480)).toBe("$9,604.80");
    expect(formatMxn(0)).toBe("$0.00");
    expect(formatMxn(50)).toBe("$0.50");
    expect(formatMxn(123456789)).toBe("$1,234,567.89");
    expect(formatMxn(-5000)).toBe("-$50.00");
  });

  it("parseToCentavos() convierte strings y floats a enteros exactos", () => {
    expect(parseToCentavos("5,500.00")).toBe(550000);
    expect(parseToCentavos("$8,280.00")).toBe(828000);
    expect(parseToCentavos(3999.99)).toBe(399999);
    expect(parseToCentavos("0")).toBe(0);
  });
});

describe("REGLA 6: Descuento por Volumen y Regla de Equipos Principales", () => {
  it("5 unidades principales NO reciben descuento por volumen (umbral > 5)", () => {
    const items: ItemCotizacion[] = [
      {
        cantidad: 5,
        esEquipoPrincipal: true,
        precioSinIvaCentavos: 550000, // $5,500.00 c/u -> Subtotal $27,500.00 (2,750,000 centavos)
      },
    ];

    const resultado = calcularDescuentoVolumen(items, 5, 10);
    expect(resultado.unidadesPrincipales).toBe(5);
    expect(resultado.aplicaDescuento).toBe(false);
    expect(resultado.porcentajeAplicado).toBe(0);
    expect(resultado.descuentoCentavos).toBe(0);
    expect(resultado.subtotalSinIvaCentavos).toBe(2750000);
    expect(resultado.subtotalConDescuentoCentavos).toBe(2750000);
  });

  it("6 unidades principales reciben 10% de descuento por volumen", () => {
    const items: ItemCotizacion[] = [
      {
        cantidad: 6,
        esEquipoPrincipal: true,
        precioSinIvaCentavos: 550000, // $5,500.00 c/u -> Subtotal $33,000.00 (3,300,000 centavos)
      },
    ];

    const resultado = calcularDescuentoVolumen(items, 5, 10);
    expect(resultado.unidadesPrincipales).toBe(6);
    expect(resultado.aplicaDescuento).toBe(true);
    expect(resultado.porcentajeAplicado).toBe(10);
    // 10% de 3,300,000 centavos = 330,000 centavos ($3,300.00)
    expect(resultado.descuentoCentavos).toBe(330000);
    // Subtotal final con descuento = 2,970,000 centavos ($29,700.00)
    expect(resultado.subtotalConDescuentoCentavos).toBe(2970000);
  });

  it("los accesorios NO cuentan para el umbral de volumen", () => {
    const items: ItemCotizacion[] = [
      {
        cantidad: 4, // Solo 4 equipos principales
        esEquipoPrincipal: true,
        precioSinIvaCentavos: 828000, // GPS Flotilla Pro
      },
      {
        cantidad: 10, // 10 accesorios (botones de pánico)
        esEquipoPrincipal: false,
        precioSinIvaCentavos: 37500, // $375.00
      },
    ];

    const resultado = calcularDescuentoVolumen(items, 5, 10);
    // Unidades principales son solo 4, por tanto NO califica para descuento
    expect(resultado.unidadesPrincipales).toBe(4);
    expect(resultado.aplicaDescuento).toBe(false);
    expect(resultado.descuentoCentavos).toBe(0);
  });

  it("cuando hay 6 equipos principales, el descuento del 10% aplica sobre el subtotal completo incluyendo accesorios", () => {
    const items: ItemCotizacion[] = [
      {
        cantidad: 6, // 6 equipos principales
        esEquipoPrincipal: true,
        precioSinIvaCentavos: 100000, // $1,000.00 -> $6,000.00 (600,000 centavos)
      },
      {
        cantidad: 4, // 4 accesorios
        esEquipoPrincipal: false,
        precioSinIvaCentavos: 25000, // $250.00 -> $1,000.00 (100,000 centavos)
      },
    ];

    const resultado = calcularDescuentoVolumen(items, 5, 10);
    // Total subtotal = 700,000 centavos ($7,000.00)
    expect(resultado.unidadesPrincipales).toBe(6);
    expect(resultado.aplicaDescuento).toBe(true);
    expect(resultado.subtotalSinIvaCentavos).toBe(700000);
    expect(resultado.descuentoCentavos).toBe(70000); // $700.00
    expect(resultado.subtotalConDescuentoCentavos).toBe(630000); // $6,300.00
  });
});

describe("Paso 3.1: calcularCotizacion() - Motor Unificado del Servidor", () => {
  const gpsEstandar: CotizacionItemInput = {
    id: "gps-estandar",
    nombre: "GPS Estándar",
    precioSinIvaCentavos: 550000, // $5,500.00 c/u
    cantidad: 1,
    esEquipoPrincipal: true,
  };

  const botonPanico: CotizacionItemInput = {
    id: "boton-panico",
    nombre: "Botón de Pánico",
    precioSinIvaCentavos: 37500, // $375.00 c/u
    cantidad: 2,
    esEquipoPrincipal: false,
  };

  it("CASO 1: 5 equipos principales = 0% descuento por volumen", () => {
    const items: CotizacionItemInput[] = [
      { ...gpsEstandar, cantidad: 5 }, // 5 * 550,000 = 2,750,000 centavos ($27,500.00)
      botonPanico,                     // 2 * 37,500  = 75,000 centavos ($750.00)
    ];
    // Subtotal bruto = 2,825,000 centavos ($28,250.00)
    const viaticos: ViaticosInput = { sinCosto: true, estadoNombre: "Estado de México" };

    const res = calcularCotizacion(items, viaticos);

    expect(res.unidadesPrincipales).toBe(5);
    expect(res.aplicaDescuentoVolumen).toBe(false);
    expect(res.porcentajeDescuentoVolumen).toBe(0);
    expect(res.descuentoVolumenCentavos).toBe(0);
    expect(res.subtotalBrutoCentavos).toBe(2825000);
    expect(res.subtotalConDescuentoCentavos).toBe(2825000);
    expect(res.viaticosCentavos).toBe(0);
    expect(res.viaticosPorConfirmar).toBe(false);
    // IVA 16% de 2,825,000 = 452,000 centavos ($4,520.00)
    expect(res.ivaCentavos).toBe(452000);
    // Total = 2,825,000 + 452,000 = 3,277,000 centavos ($32,770.00)
    expect(res.totalCentavos).toBe(3277000);
  });

  it("CASO 2: 6 equipos principales = 10% descuento sobre todos los productos (equipos + accesorios)", () => {
    const items: CotizacionItemInput[] = [
      { ...gpsEstandar, cantidad: 6 }, // 6 * 550,000 = 3,300,000 centavos ($33,000.00)
      botonPanico,                     // 2 * 37,500  = 75,000 centavos ($750.00)
    ];
    // Subtotal bruto = 3,375,000 centavos ($33,750.00)
    const viaticos: ViaticosInput = { sinCosto: true, estadoNombre: "Ciudad de México" };

    const res = calcularCotizacion(items, viaticos);

    expect(res.unidadesPrincipales).toBe(6);
    expect(res.aplicaDescuentoVolumen).toBe(true);
    expect(res.porcentajeDescuentoVolumen).toBe(10);
    // 10% de 3,375,000 = 337,500 centavos ($3,375.00)
    expect(res.descuentoVolumenCentavos).toBe(337500);
    // Subtotal con descuento = 3,375,000 - 337,500 = 3,037,500 centavos ($30,375.00)
    expect(res.subtotalConDescuentoCentavos).toBe(3037500);
    expect(res.viaticosCentavos).toBe(0);
    // IVA 16% de 3,037,500 = 486,000 centavos ($4,860.00)
    expect(res.ivaCentavos).toBe(486000);
    // Total = 3,037,500 + 486,000 = 3,523,500 centavos ($35,235.00)
    expect(res.totalCentavos).toBe(3523500);
  });

  it("CASO 3: Viáticos 'Se cotiza' cuando monto es 0 y sinCosto es false", () => {
    const items: CotizacionItemInput[] = [{ ...gpsEstandar, cantidad: 2 }];
    const viaticos: ViaticosInput = {
      estadoId: "GRO",
      estadoNombre: "Guerrero",
      sinCosto: false,
      montoPorVisitaCentavos: 0,
      montoPorUnidadCentavos: 0,
    };

    const res = calcularCotizacion(items, viaticos);

    expect(res.viaticosCentavos).toBe(0);
    expect(res.viaticosPorConfirmar).toBe(true);
    expect(res.viaticosDescripcion).toContain("Se cotiza");
    // No cobra viáticos en el total provisional
    expect(res.baseGravableCentavos).toBe(res.subtotalConDescuentoCentavos);
  });

  it("CASO 4: Viáticos con fórmula exacta (visita + unidad * cantidad) y NO reciben descuento por volumen", () => {
    const items: CotizacionItemInput[] = [
      { ...gpsEstandar, cantidad: 6 }, // 6 equipos principales -> recibe 10% descuento
    ];
    // Subtotal = 3,300,000 centavos. Descuento 10% = 330,000. Subtotal con descuento = 2,970,000 centavos.
    const viaticos: ViaticosInput = {
      estadoId: "VER",
      estadoNombre: "Veracruz",
      sinCosto: false,
      montoPorVisitaCentavos: 150000, // $1,500.00
      montoPorUnidadCentavos: 25000,  // $250.00 c/u
    };
    // Viáticos: 150,000 + (25,000 * 6) = 300,000 centavos ($3,000.00)
    const res = calcularCotizacion(items, viaticos);

    expect(res.viaticosCentavos).toBe(300000);
    expect(res.viaticosPorConfirmar).toBe(false);
    // Base gravable = subtotal con descuento (2,970,000) + viaticos (300,000) = 3,270,000 centavos
    expect(res.baseGravableCentavos).toBe(3270000);
    // IVA 16% de 3,270,000 = 523,200 centavos
    expect(res.ivaCentavos).toBe(523200);
    // Total = 3,270,000 + 523,200 = 3,793,200 centavos ($37,932.00)
    expect(res.totalCentavos).toBe(3793200);
  });

  it("CASO 5: Planes de pago suman SIEMPRE el total exacto con ajuste de centavos en la última cuota", () => {
    // Monto impar que genera decimales al dividir: 123457 centavos ($1,234.57)
    const items: CotizacionItemInput[] = [
      {
        id: "item-impar",
        nombre: "Item Test Impar",
        precioSinIvaCentavos: 106428, // Con IVA 16% (17,028) da 123,456 centavos
        cantidad: 1,
        esEquipoPrincipal: true,
      },
    ];

    const res = calcularCotizacion(items, { sinCosto: true }, {
      planesConfig: {
        msiPlazos: [3, 6],
      },
    });

    const total = res.totalCentavos;

    // 1. Contado (100%)
    const contado = res.planesPago.contado;
    expect(contado.totalCentavos).toBe(total);
    expect(contado.pagos.reduce((acc, p) => acc + p.montoCentavos, 0)).toBe(total);
    expect(contado.saldoRestanteCentavos).toBe(0);

    // 2. Credi-Contado (55% / 45%)
    const crediContado = res.planesPago.credi_contado;
    expect(crediContado.totalCentavos).toBe(total);
    const sumaCc = crediContado.pagos.reduce((acc, p) => acc + p.montoCentavos, 0);
    expect(sumaCc).toBe(total); // ¡Suma idéntica al centavo!
    expect(crediContado.montoPrimerPagoCentavos + crediContado.saldoRestanteCentavos).toBe(total);

    // 3. Enganche 55% + 2 mensualidades
    const enganche = res.planesPago.enganche_mensualidades;
    expect(enganche.totalCentavos).toBe(total);
    const sumaEnganche = enganche.pagos.reduce((acc, p) => acc + p.montoCentavos, 0);
    expect(sumaEnganche).toBe(total); // ¡Suma idéntica al centavo!
    expect(enganche.montoPrimerPagoCentavos + enganche.saldoRestanteCentavos).toBe(total);

    // 4. MSI (3 y 6 meses)
    const msi3 = res.planesPago.msi_3;
    const sumaMsi3 = msi3.pagos.reduce((acc, p) => acc + p.montoCentavos, 0);
    expect(sumaMsi3).toBe(total);

    const msi6 = res.planesPago.msi_6;
    const sumaMsi6 = msi6.pagos.reduce((acc, p) => acc + p.montoCentavos, 0);
    expect(sumaMsi6).toBe(total);
  });

  describe("Nuevas Reglas y Validaciones de Seguridad Fase 3", () => {
    it("5 equipos principales + 3 accesorios = sin descuento (accesorios no cuentan para el umbral)", () => {
      const items: CotizacionItemInput[] = [
        { ...gpsEstandar, cantidad: 5 }, // 5 equipos principales
        { ...botonPanico, cantidad: 3 }, // 3 accesorios
      ];
      // Total de ítems = 8, pero equipos principales = 5 (no > 5)
      const res = calcularCotizacion(items, { sinCosto: true });
      expect(res.totalUnidades).toBe(8);
      expect(res.unidadesPrincipales).toBe(5);
      expect(res.aplicaDescuentoVolumen).toBe(false);
      expect(res.descuentoVolumenCentavos).toBe(0);
    });

    it("Descuento de vendedor dentro del tope (ej. 5%) = OK", () => {
      const items: CotizacionItemInput[] = [{ ...gpsEstandar, cantidad: 2 }];
      // Subtotal = 1,100,000 centavos ($11,000.00). Tope vendedor = 5%, se solicita 4%
      const res = calcularCotizacion(items, { sinCosto: true }, {
        descuentoVendedorPorcentaje: 4,
        topeDescuentoVendedor: 5,
      });

      expect(res.descuentoVendedorPorcentaje).toBe(4);
      // 4% de 1,100,000 = 44,000 centavos ($440.00)
      expect(res.descuentoVendedorCentavos).toBe(44000);
      expect(res.subtotalConDescuentoCentavos).toBe(1056000);
    });

    it("Descuento de vendedor por encima del tope = error/rechazo", () => {
      const items: CotizacionItemInput[] = [{ ...gpsEstandar, cantidad: 2 }];
      // Tope vendedor = 5%, se solicita 7% -> debe arrojar Error
      expect(() =>
        calcularCotizacion(items, { sinCosto: true }, {
          descuentoVendedorPorcentaje: 7,
          topeDescuentoVendedor: 5,
        })
      ).toThrow(/supera el tope máximo autorizado/i);

      // Descuento negativo también arroja Error
      expect(() =>
        calcularCotizacion(items, { sinCosto: true }, {
          descuentoVendedorPorcentaje: -2,
          topeDescuentoVendedor: 5,
        })
      ).toThrow(/no puede ser negativo/i);
    });

    it("Producto inactivo (activo === false) = error claro", () => {
      const items: CotizacionItemInput[] = [
        {
          id: "dji-matrice-4e",
          nombre: "Dron Empresarial de Mapeo",
          precioSinIvaCentavos: 0,
          cantidad: 1,
          esEquipoPrincipal: true,
          activo: false,
        },
      ];

      expect(() => calcularCotizacion(items)).toThrow(
        /no está activo y no se puede cotizar/i
      );
    });

    it("Producto con revisarPrecio: true = error claro para cotizar en línea", () => {
      const items: CotizacionItemInput[] = [
        {
          id: "gps-portable-15d",
          nombre: "GPS Portable 15-D",
          precioSinIvaCentavos: 987700,
          cantidad: 1,
          esEquipoPrincipal: true,
          activo: true,
          revisarPrecio: true,
        },
      ];

      expect(() => calcularCotizacion(items)).toThrow(
        /tiene precio en revisión y no se puede cotizar para pago en línea/i
      );
    });

    it("Cantidad 0, negativa o no entera = error", () => {
      // Cantidad 0
      expect(() =>
        calcularCotizacion([{ ...gpsEstandar, cantidad: 0 }])
      ).toThrow(/Cantidad inválida: 0/);

      // Cantidad negativa
      expect(() =>
        calcularCotizacion([{ ...gpsEstandar, cantidad: -3 }])
      ).toThrow(/Cantidad inválida: -3/);

      // Cantidad decimal (float)
      expect(() =>
        calcularCotizacion([{ ...gpsEstandar, cantidad: 2.5 }])
      ).toThrow(/Cantidad inválida: 2.5/);
    });

    it("MSI sin plazos configurados = la opción MSI no existe", () => {
      const items: CotizacionItemInput[] = [{ ...gpsEstandar, cantidad: 1 }];
      // Por defecto msiPlazos es vacío []
      const res = calcularCotizacion(items, { sinCosto: true });

      const clavesPlanes = Object.keys(res.planesPago);
      expect(clavesPlanes).toContain("contado");
      expect(clavesPlanes).toContain("credi_contado");
      expect(clavesPlanes).toContain("enganche_mensualidades");
      // No debe contener ningún plan MSI
      expect(clavesPlanes.some((c) => c.startsWith("msi"))).toBe(false);
    });

    it("Costos recurrentes (renovación, datos extra) aparecen en la cotización pero no suman al total", () => {
      const items: CotizacionItemInput[] = [
        {
          id: "gps-flotilla",
          nombre: "GPS Flotilla",
          precioSinIvaCentavos: 887700, // $8,877.00
          cantidad: 2,
          esEquipoPrincipal: true,
          recurrentes: [
            {
              concepto: "Renovación Anual Licencia GPS",
              montoCentavos: 258375, // $2,583.75 anual
              periodo: "anual",
            },
          ],
        },
        {
          id: "dashcam-jc181",
          nombre: "DashCam JC181",
          precioSinIvaCentavos: 611000, // $6,110.00
          cantidad: 1,
          esEquipoPrincipal: true,
          recurrentes: [
            {
              concepto: "Datos extra DashCam 5 GB",
              montoCentavos: 35000, // $350.00 mensual
              periodo: "mensual",
            },
          ],
        },
      ];

      const res = calcularCotizacion(items, { sinCosto: true });

      // Subtotal de compra inicial: 2 * 887,700 + 1 * 611,000 = 1,775,400 + 611,000 = 2,386,400 centavos
      expect(res.subtotalBrutoCentavos).toBe(2386400);
      // IVA 16% = 381,824 centavos
      expect(res.ivaCentavos).toBe(381824);
      // Total = 2,386,400 + 381,824 = 2,768,224 centavos ($27,682.24)
      expect(res.totalCentavos).toBe(2768224);

      // Los recurrentes están presentes en la respuesta para transparencia
      expect(res.costosRecurrentes.length).toBe(2);
      expect(res.costosRecurrentes[0].concepto).toBe("Renovación Anual Licencia GPS");
      expect(res.costosRecurrentes[0].montoCentavos).toBe(258375 * 2); // 2 unidades
      expect(res.costosRecurrentes[0].periodo).toBe("anual");

      expect(res.costosRecurrentes[1].concepto).toBe("Datos extra DashCam 5 GB");
      expect(res.costosRecurrentes[1].montoCentavos).toBe(35000);
      expect(res.costosRecurrentes[1].periodo).toBe("mensual");

      // Verificación estricta: la suma de recurrentes NO está incluida en el total
      const sumaRecurrentes = res.costosRecurrentes.reduce((acc, c) => acc + c.montoCentavos, 0);
      expect(res.totalCentavos).not.toContain(sumaRecurrentes);
      expect(res.baseGravableCentavos).toBe(res.subtotalConDescuentoCentavos);
    });

    it("REGLA: producto con incluyeInstalacion: false agrega automáticamente instalación por unidad", () => {
      // 2 GPS que NO incluyen instalación ($5,500.00 c/u)
      const items: CotizacionItemInput[] = [
        {
          ...gpsEstandar,
          cantidad: 2,
          incluyeInstalacion: false,
          servicioInstalacionPrecioSinIvaCentavos: 95000, // $950.00 c/u
        },
      ];

      const res = calcularCotizacion(items, { sinCosto: true });

      // Subtotal: (2 * 550,000) + (2 * 95,000) = 1,100,000 + 190,000 = 1,290,000 centavos ($12,900.00)
      expect(res.subtotalBrutoCentavos).toBe(1290000);
      expect(res.instalacionesAgregadasCount).toBe(2);

      // Debe aparecer como línea separada y visible en lineasCalculadas
      const lineaInst = res.lineasCalculadas.find((l) => l.esInstalacionAgregada);
      expect(lineaInst).toBeDefined();
      expect(lineaInst?.cantidad).toBe(2);
      expect(lineaInst?.precioSinIvaCentavos).toBe(95000);
      expect(lineaInst?.totalSinIvaCentavos).toBe(190000);
      expect(lineaInst?.esEquipoPrincipal).toBe(false); // No cuenta como equipo principal
    });

    it("REGLA: producto o paquete con incluyeInstalacion: true NO agrega cargos extra de instalación", () => {
      const items: CotizacionItemInput[] = [
        {
          id: "dashcam-jc181",
          nombre: "DashCam JC181",
          precioSinIvaCentavos: 611000, // $6,110.00
          cantidad: 1,
          esEquipoPrincipal: true,
          incluyeInstalacion: true,
        },
      ];

      const res = calcularCotizacion(items, { sinCosto: true });

      expect(res.subtotalBrutoCentavos).toBe(611000);
      expect(res.instalacionesAgregadasCount).toBe(0);
      expect(res.lineasCalculadas.some((l) => l.esInstalacionAgregada)).toBe(false);
    });

    it("REGLA: producto con incluyePlanPrimerAnio: true muestra renovación anual a partir del 2° año", () => {
      const items: CotizacionItemInput[] = [
        {
          id: "gps-estandar",
          nombre: "GPS Estándar",
          precioSinIvaCentavos: 737700,
          cantidad: 3,
          esEquipoPrincipal: true,
          incluyeInstalacion: true,
          incluyePlanPrimerAnio: true,
        },
      ];

      const res = calcularCotizacion(items, { sinCosto: true });

      const recurrente = res.costosRecurrentes.find((c) =>
        c.concepto.includes("a partir del segundo año")
      );
      expect(recurrente).toBeDefined();
      expect(recurrente?.periodo).toBe("anual");
      // 3 unidades * $2,583.75 (258,375 centavos) = 775,125 centavos
      expect(recurrente?.montoCentavos).toBe(258375 * 3);
    });

    it("REGLA: getQueIncluyeComputed genera automáticamente 'Instalación profesional' y 'Primer año de plataforma y datos'", () => {
      const product = {
        queIncluye: ["Dispositivo GPS 4G", "Botón de pánico", "Arnés con fusible"],
        incluyeInstalacion: true,
        incluyePlanPrimerAnio: true,
      };

      const result = getQueIncluyeComputed(product);

      expect(result).toContain("Instalación profesional");
      expect(result).toContain("Primer año de plataforma y datos");
      expect(result).toContain("Dispositivo GPS 4G");
      expect(result).toContain("Botón de pánico");
    });

    it("REGLA DE SNAPSHOT: cambio de casilla en admin se refleja en la siguiente cotización, pero NO en cotizaciones ya emitidas", () => {
      // 1. Producto original con incluyeInstalacion: true
      const productoAdminOriginal: CotizacionItemInput = {
        id: "gps-flotilla",
        nombre: "GPS Flotilla",
        precioSinIvaCentavos: 887700,
        cantidad: 2,
        esEquipoPrincipal: true,
        incluyeInstalacion: true,
      };

      // 2. Se emite cotización CT-1001 y se guarda su snapshot
      const cotizacionEmitida = calcularCotizacion([productoAdminOriginal], { sinCosto: true });
      const snapshotCotizacionEmitida = {
        folio: "CT-1001",
        items: [{ ...productoAdminOriginal }],
        calculo: cotizacionEmitida,
      };

      // En la cotización emitida NO hay cargos de instalación extra
      expect(snapshotCotizacionEmitida.calculo.instalacionesAgregadasCount).toBe(0);
      expect(snapshotCotizacionEmitida.calculo.subtotalBrutoCentavos).toBe(887700 * 2);

      // 3. Admin desmarca la casilla en el panel: incluyeInstalacion -> false
      const productoAdminModificado: CotizacionItemInput = {
        ...productoAdminOriginal,
        incluyeInstalacion: false,
        servicioInstalacionPrecioSinIvaCentavos: 95000,
      };

      // 4. Se genera una NUEVA cotización posterior CT-1002
      const nuevaCotizacion = calcularCotizacion([productoAdminModificado], { sinCosto: true });

      // La nueva cotización sí incluye las instalaciones agregadas ($950 * 2 = $1,900)
      expect(nuevaCotizacion.instalacionesAgregadasCount).toBe(2);
      expect(nuevaCotizacion.subtotalBrutoCentavos).toBe((887700 * 2) + (95000 * 2));

      // 5. INMUTABILIDAD: El snapshot de la cotización emitida previa permanece 100% inalterado
      expect(snapshotCotizacionEmitida.calculo.instalacionesAgregadasCount).toBe(0);
      expect(snapshotCotizacionEmitida.calculo.subtotalBrutoCentavos).toBe(887700 * 2);
    });
  });
});
