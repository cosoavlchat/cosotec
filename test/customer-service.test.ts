import { describe, it, expect, vi, beforeEach } from "vitest";
import { normalizarWhatsapp, formatearWhatsapp } from "@/lib/utils/whatsapp";

describe("Fase 4: Módulo de Clientes y Normalización Telefónica", () => {
  it("1. normalizarWhatsapp(): extrae exactamente 10 dígitos locales sin código de país ni símbolos", () => {
    expect(normalizarWhatsapp("722 432 2053")).toBe("7224322053");
    expect(normalizarWhatsapp("+52 1 (722) 432-2053")).toBe("7224322053");
    expect(normalizarWhatsapp("5217224322053")).toBe("7224322053");
    expect(normalizarWhatsapp("527224322053")).toBe("7224322053");
    expect(normalizarWhatsapp("17224322053")).toBe("7224322053");
  });

  it("2. formatearWhatsapp(): presenta el teléfono en bloques legibles de 3-3-4", () => {
    expect(formatearWhatsapp("7224322053")).toBe("722 432 2053");
    expect(formatearWhatsapp("+5217224322053")).toBe("722 432 2053");
  });
});
