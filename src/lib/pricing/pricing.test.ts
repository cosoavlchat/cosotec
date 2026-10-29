import { describe, it, expect } from "vitest";
import {
  calcularIvaCentavos,
  precioConIva,
  desglosePrecio,
  formatMxn,
  parseToCentavos,
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
