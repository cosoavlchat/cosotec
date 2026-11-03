import { describe, it, expect, vi, beforeEach } from "vitest";

// In-memory Firestore mock store
const mockFirestoreStore = new Map<string, any>();

vi.mock("@/lib/firebase/admin", () => {
  const getDocRef = (collectionName: string, docId: string) => ({
    id: docId,
    ref: {
      update: vi.fn().mockImplementation(async (data: any) => {
        const key = `${collectionName}/${docId}`;
        const current = mockFirestoreStore.get(key) || {};
        mockFirestoreStore.set(key, { ...current, ...data });
        return Promise.resolve();
      }),
    },
    get: vi.fn().mockImplementation(async () => {
      const key = `${collectionName}/${docId}`;
      const data = mockFirestoreStore.get(key);
      return {
        exists: Boolean(data),
        data: () => data,
      };
    }),
    set: vi.fn().mockImplementation(async (data: any, options?: { merge?: boolean }) => {
      const key = `${collectionName}/${docId}`;
      if (options?.merge && mockFirestoreStore.has(key)) {
        mockFirestoreStore.set(key, { ...mockFirestoreStore.get(key), ...data });
      } else {
        mockFirestoreStore.set(key, data);
      }
      return Promise.resolve();
    }),
    delete: vi.fn().mockImplementation(async () => {
      const key = `${collectionName}/${docId}`;
      mockFirestoreStore.delete(key);
      return Promise.resolve();
    }),
  });

  return {
    FieldValue: {
      delete: vi.fn().mockReturnValue("__DELETE_FIELD__"),
      serverTimestamp: vi.fn().mockReturnValue(new Date().toISOString()),
    },
    adminDb: {
      collection: (col: string) => {
        const createQuery = (filters: Array<{ field: string; op: string; val: any }>) => ({
          where: (f: string, op: string, v: any) => createQuery([...filters, { field: f, op, val: v }]),
          get: vi.fn().mockImplementation(async () => {
            const matchedDocs: any[] = [];
            for (const [key, value] of mockFirestoreStore.entries()) {
              if (key.startsWith(`${col}/`)) {
                let matches = true;
                for (const flt of filters) {
                  if (flt.op === "==" && value[flt.field] !== flt.val) matches = false;
                  if (flt.op === "<=" && value[flt.field] > flt.val) matches = false;
                }
                if (matches) {
                  const docId = key.replace(`${col}/`, "");
                  matchedDocs.push({
                    id: docId,
                    data: () => value,
                    ref: {
                      update: async (patch: any) => {
                        mockFirestoreStore.set(key, { ...value, ...patch });
                      },
                    },
                  });
                }
              }
            }
            return { docs: matchedDocs };
          }),
        });

        return {
          doc: (id: string) => getDocRef(col, id),
          where: (f: string, op: string, v: any) => createQuery([{ field: f, op, val: v }]),
        };
      },
    },
  };
});

import { saveCartToFirestore, getCartFromFirestore, generarCartId } from "@/lib/cart";
import { signCartSession, verifyCartSession } from "@/lib/cart/session";
import { verificarCarritosAbandonados } from "@/lib/services/abandoned-cart-service";
import { normalizePhoneE164, formatPhoneLocal, isValidMexicanPhone } from "@/lib/utils/phone";
import { CartItem } from "@/types/cart";

describe("Paso 3.3: Carrito y Checkout Seguro, Estados Unificados y Worker de Abandono", () => {
  beforeEach(() => {
    mockFirestoreStore.clear();
  });

  const sampleItems: CartItem[] = [
    {
      id: "gps-estandar-sin-telemetria",
      tipo: "producto",
      nombre: "GPS Estándar sin telemetría",
      categoria: "gps",
      precioSinIvaCentavos: 399999, // $3,999.99
      cantidad: 1,
      esEquipoPrincipal: true,
      incluyeInstalacion: true,
      incluyePlanPrimerAnio: true,
    },
  ];

  it("Paso 1 (Contacto): Guarda datos del cliente con teléfono normalizado E.164 y número ficticio", async () => {
    const cartId = generarCartId();
    const telFicticio = "5550000000";

    expect(isValidMexicanPhone(telFicticio)).toBe(true);
    const telE164 = normalizePhoneE164(telFicticio);
    expect(telE164).toBe("+525550000000");
    expect(formatPhoneLocal(telE164)).toBe("(55) 5000-0000");

    const savedCart1 = await saveCartToFirestore({
      id: cartId,
      pasoActual: 1,
      estado: "activo",
      items: sampleItems,
      contacto: {
        nombre: "Ing. Roberto Alarcón",
        telefono: telE164,
        correo: "roberto@translog.mx",
        empresa: "TransLog del Centro",
      },
    });

    expect(savedCart1.id).toBe(cartId);
    expect(savedCart1.estado).toBe("activo");
    expect(savedCart1.contacto?.nombre).toBe("Ing. Roberto Alarcón");
    expect(savedCart1.contacto?.telefono).toBe("+525550000000");
    expect(savedCart1.calculo).toBeDefined();

    const readBack = await getCartFromFirestore(cartId);
    expect(readBack?.contacto?.empresa).toBe("TransLog del Centro");
    expect(readBack?.estado).toBe("activo");
  });

  it("Paso 2 (Instalación): Actualiza lugar, estado y viáticos en Firestore", async () => {
    const cartId = generarCartId();

    await saveCartToFirestore({
      id: cartId,
      pasoActual: 1,
      estado: "activo",
      items: sampleItems,
      contacto: {
        nombre: "Laura Gómez",
        telefono: "+525512345678",
      },
    });

    const savedCart2 = await saveCartToFirestore({
      id: cartId,
      pasoActual: 2,
      instalacion: {
        estadoClave: "MEX",
        estadoNombre: "Estado de México",
        municipio: "Toluca",
        direccion: "Paseo Tollocan #1200",
        tipoLugar: "domicilio",
        fechaTentativa: "2026-11-05",
        horarioTentativo: "manana",
      },
    });

    expect(savedCart2.pasoActual).toBe(2);
    expect(savedCart2.contacto?.nombre).toBe("Laura Gómez");
    expect(savedCart2.instalacion?.municipio).toBe("Toluca");
    expect(savedCart2.instalacion?.viaticosPorConfirmar).toBe(false);
    expect(savedCart2.instalacion?.viaticosCentavos).toBe(0);
  });

  it("Worker de Carritos Abandonados: Carrito con 31 min de inactividad pasa a 'abandonado' y crea lead", async () => {
    const cartId = generarCartId();
    // Simular que el carrito se actualizó hace 35 minutos
    const hace35Minutos = new Date(Date.now() - 35 * 60 * 1000).toISOString();

    await saveCartToFirestore({
      id: cartId,
      pasoActual: 2,
      estado: "activo",
      items: sampleItems,
      contacto: {
        nombre: "Daniel Hernández",
        telefono: "+525550000000",
        correo: "daniel@flotillas.com",
        empresa: "Logística Express",
      },
      instalacion: {
        estadoClave: "NLE",
        estadoNombre: "Nuevo León",
        municipio: "Monterrey",
        direccion: "Av. Constitución #450, Col. Centro",
      },
    });

    // Sobreescribir manualmente updatedAt simulando inactividad
    const key = `carts/${cartId}`;
    const cartEnStore = mockFirestoreStore.get(key);
    mockFirestoreStore.set(key, {
      ...cartEnStore,
      updatedAt: hace35Minutos,
    });

    // Ejecutar el worker de abandono (umbral 31 min)
    const resAbandono = await verificarCarritosAbandonados(31);

    expect(resAbandono.procesados).toBe(1);
    expect(resAbandono.leadsCreados).toBe(1);

    // Verificar que el estado del carrito cambió a "abandonado"
    const cartActualizado = await getCartFromFirestore(cartId);
    expect(cartActualizado?.estado).toBe("abandonado");
    expect(cartActualizado?.abandonedAt).toBeDefined();

    // Verificar que el documento en 'leads' fue creado con origen 'carrito_abandonado'
    const leadKey = `leads/lead_cart_${cartId}`;
    const leadCreado = mockFirestoreStore.get(leadKey);
    expect(leadCreado).toBeDefined();
    expect(leadCreado.origen).toBe("carrito_abandonado");
    expect(leadCreado.cartId).toBe(cartId);
    expect(leadCreado.nombre).toBe("Daniel Hernández");
    expect(leadCreado.telefono).toBe("+525550000000");
    expect(leadCreado.estadoLead).toBe("nuevo");
  });

  it("Seguridad de Sesión: Cookie firmada con HMAC protege contra spoofing y sesiones ajenas", () => {
    const cartId = generarCartId();
    // Generar cookie firmada
    const cookieFirmada = signCartSession(cartId);

    // Verificar cookie válida
    const verificado = verifyCartSession(cookieFirmada);
    expect(verificado).toBe(cartId);

    // Manipular o falsificar la cookie
    const cookieManipulada = `${cartId}.firma_falsa_invalida`;
    const verificadoInvalido = verifyCartSession(cookieManipulada);
    expect(verificadoInvalido).toBeNull();

    // Sesión vacía o malformada
    expect(verifyCartSession(null)).toBeNull();
    expect(verifyCartSession("")).toBeNull();
    expect(verifyCartSession("solo_un_string")).toBeNull();
  });

  it("Carrito: Permite eliminar un item y recalcula el total y montos en Firestore", async () => {
    const cartId = generarCartId();
    const item1: CartItem = {
      id: "gps-estandar",
      tipo: "producto",
      nombre: "GPS Estándar",
      categoria: "gps",
      precioSinIvaCentavos: 399999,
      cantidad: 1,
      esEquipoPrincipal: true,
      incluyeInstalacion: true,
    };
    const item2: CartItem = {
      id: "boton-panico",
      tipo: "producto",
      nombre: "Botón de Pánico",
      categoria: "accesorios",
      precioSinIvaCentavos: 45000,
      cantidad: 1,
      esEquipoPrincipal: false,
      incluyeInstalacion: false,
    };

    // Guardar con 2 items
    const saved = await saveCartToFirestore({
      id: cartId,
      items: [item1, item2],
    });
    expect(saved.items.length).toBe(2);
    expect(saved.calculo).toBeDefined();
    const totalInicial = saved.calculo!.totalCentavos;

    // Eliminar item2 (Botón de pánico)
    const updated = await saveCartToFirestore({
      id: cartId,
      items: [item1],
    });
    expect(updated.items.length).toBe(1);
    expect(updated.items[0].id).toBe("gps-estandar");
    expect(updated.calculo!.totalCentavos).toBeLessThan(totalInicial);
  });

  it("Carrito: Modificar cantidad de items (+ y −) recalcula montos canónicos", async () => {
    const cartId = generarCartId();
    const item: CartItem = {
      id: "gps-estandar",
      tipo: "producto",
      nombre: "GPS Estándar",
      categoria: "gps",
      precioSinIvaCentavos: 300000,
      cantidad: 1,
      esEquipoPrincipal: true,
      incluyeInstalacion: true,
    };

    const cart1 = await saveCartToFirestore({ id: cartId, items: [item] });
    expect(cart1.items[0].cantidad).toBe(1);
    const subtotal1 = cart1.calculo!.subtotalBrutoCentavos;

    // Aumentar a 3 unidades
    const cart3 = await saveCartToFirestore({
      id: cartId,
      items: [{ ...item, cantidad: 3 }],
    });
    expect(cart3.items[0].cantidad).toBe(3);
    expect(cart3.calculo!.subtotalBrutoCentavos).toBe(subtotal1 * 3);
  });

  it("Carrito: Vaciar carrito completo remueve items y cálculo en Firestore", async () => {
    const cartId = generarCartId();
    await saveCartToFirestore({
      id: cartId,
      items: sampleItems,
    });

    const cleared = await saveCartToFirestore({
      id: cartId,
      items: [],
    });
    expect(cleared.items.length).toBe(0);
    expect(cleared.calculo).toBeUndefined();

    const inDb = await getCartFromFirestore(cartId);
    expect(inDb?.items.length).toBe(0);
  });

  it("Recálculo de Descuento por Volumen: Al pasar de 6 a 5 equipos principales el descuento cae del 10% al 0%", async () => {
    const cartId = generarCartId();
    const gpsItem: CartItem = {
      id: "gps-flotilla",
      tipo: "producto",
      nombre: "GPS Flotilla 4G",
      categoria: "gps",
      precioSinIvaCentavos: 400000, // $4,000.00
      cantidad: 6,
      esEquipoPrincipal: true,
      incluyeInstalacion: true,
    };

    // Caso A: 6 equipos principales (> 5 unidades)
    const cart6 = await saveCartToFirestore({
      id: cartId,
      items: [gpsItem],
    });
    expect(cart6.calculo!.aplicaDescuentoVolumen).toBe(true);
    expect(cart6.calculo!.porcentajeDescuentoVolumen).toBe(10);
    expect(cart6.calculo!.descuentoVolumenCentavos).toBeGreaterThan(0);

    // Caso B: Reducir cantidad de 6 a 5 equipos (umbral no alcanzado, <= 5)
    const cart5 = await saveCartToFirestore({
      id: cartId,
      items: [{ ...gpsItem, cantidad: 5 }],
    });
    expect(cart5.calculo!.aplicaDescuentoVolumen).toBe(false);
    expect(cart5.calculo!.porcentajeDescuentoVolumen).toBe(0);
    expect(cart5.calculo!.descuentoVolumenCentavos).toBe(0);
  });

  it("Inmutabilidad de Cotización (Snapshot): Carrito con isQuoteSnapshot rechaza modificación de items", async () => {
    const cartId = generarCartId();
    await saveCartToFirestore({
      id: cartId,
      quoteFolio: "CT-1124459",
      isQuoteSnapshot: true,
      items: sampleItems,
    });

    // Intentar alterar productos de una cotización oficial de asesor
    await expect(
      saveCartToFirestore({
        id: cartId,
        items: [
          ...sampleItems,
          {
            id: "hack-item",
            tipo: "producto",
            nombre: "Producto No Autorizado",
            categoria: "gps",
            precioSinIvaCentavos: 100,
            cantidad: 1,
            esEquipoPrincipal: false,
          },
        ],
      })
    ).rejects.toThrow(/Esta compra corresponde a la cotización CT-1124459; para cambios contacta a tu asesor/);
  });
});
