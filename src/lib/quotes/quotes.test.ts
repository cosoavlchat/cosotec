import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => {
  process.env.QUOTES_TOKEN_SECRET = "test_secret_key_for_vitest_quotes_token_secret_12345";
});

import {
  generarTokenAleatorio,
  hashToken,
  validarTokenCotizacion,
} from "./index";

describe("Paso 3.2: Generación, Hash y Validación de Token Aleatorio Revocable", () => {
  it("genera tokens aleatorios criptográficamente seguros de 32 caracteres base64url", () => {
    const token1 = generarTokenAleatorio();
    const token2 = generarTokenAleatorio();

    expect(token1).not.toBe(token2);
    expect(token1.length).toBe(32); // 24 bytes en base64url = 32 caracteres
    expect(/^[A-Za-z0-9_-]+$/.test(token1)).toBe(true);
  });

  it("hashToken() genera hash determinista de 64 caracteres hex", () => {
    const token = "dGVzdC10b2tlbi1leGFtcGxlLTEyMzQ1Ng";
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it("validarTokenCotizacion() aprueba el token legítimo contra el hash guardado", () => {
    const token = generarTokenAleatorio();
    const tokenHashEnBd = hashToken(token);

    const esValido = validarTokenCotizacion(tokenHashEnBd, token);
    expect(esValido).toBe(true);
  });

  it("validarTokenCotizacion() rechaza tokens ausentes, incorrectos o manipulados", () => {
    const tokenLegitimo = generarTokenAleatorio();
    const tokenHashEnBd = hashToken(tokenLegitimo);

    // Token vacío
    expect(validarTokenCotizacion(tokenHashEnBd, "")).toBe(false);

    // Token falso
    expect(validarTokenCotizacion(tokenHashEnBd, "token_falso_invalido_1234567890")).toBe(false);

    // Token manipulado por 1 carácter
    const tokenAlterado = tokenLegitimo.slice(0, 31) + (tokenLegitimo[31] === "a" ? "b" : "a");
    expect(validarTokenCotizacion(tokenHashEnBd, tokenAlterado)).toBe(false);
  });

  it("simulación de revocación: al regenerar el link, el token anterior queda inmediatamente invalidado", () => {
    const tokenOriginal = generarTokenAleatorio();
    let hashEnBd = hashToken(tokenOriginal);

    // Token original es válido inicialmente
    expect(validarTokenCotizacion(hashEnBd, tokenOriginal)).toBe(true);

    // Acción: Se regenera el link (se genera nuevo token y se actualiza el hash en BD)
    const nuevoToken = generarTokenAleatorio();
    hashEnBd = hashToken(nuevoToken);

    // El token anterior ahora debe ser RECHAZADO
    expect(validarTokenCotizacion(hashEnBd, tokenOriginal)).toBe(false);

    // Solo el nuevo token es aceptado
    expect(validarTokenCotizacion(hashEnBd, nuevoToken)).toBe(true);
  });
});
