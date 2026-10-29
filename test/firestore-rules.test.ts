import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as net from "net";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";

function isPortOpen(host: string, port: number, timeoutMs = 1000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("error", () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

const emulatorPort = 8080;
const projectId = "demo-cosoteco-rules-test";

describe("Reglas de Seguridad Firestore (firestore.rules)", () => {
  let testEnv: RulesTestEnvironment | null = null;
  let emulatorRunning = false;

  beforeAll(async () => {
    emulatorRunning = await isPortOpen("127.0.0.1", emulatorPort);

    if (emulatorRunning) {
      const rules = fs.readFileSync(path.resolve(__dirname, "../firestore.rules"), "utf8");
      testEnv = await initializeTestEnvironment({
        projectId,
        firestore: {
          rules,
          host: "127.0.0.1",
          port: emulatorPort,
        },
      });

      // Precargar documentos con el contexto administrativo
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        // Producto activo
        await setDoc(doc(db, "products/gps-activo"), {
          nombreComercial: "GPS Activo",
          activo: true,
          precioSinIvaCentavos: 500000,
        });
        // Producto inactivo
        await setDoc(doc(db, "products/dron-inactivo"), {
          nombreComercial: "Dron Oculto",
          activo: false,
          precioSinIvaCentavos: 0,
        });
        // Settings públicos
        await setDoc(doc(db, "settings/pricing"), { ivaPorcentaje: 16 });
        await setDoc(doc(db, "settings/contact"), { whatsapp: "722 432 2053" });
        await setDoc(doc(db, "travelFees/MEX"), { estadoNombre: "Edomex", sinCosto: true });
        // Settings y colecciones protegidas
        await setDoc(doc(db, "settings/bank"), { clabe: "012180001234567890", banco: "BBVA" });
        await setDoc(doc(db, "auditLog/log-1"), { action: "update", entity: "pricing" });
      });
    }
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  describe("Acceso Público (Sin autenticación)", () => {
    it("el público puede leer productos activos", async () => {
      if (!emulatorRunning || !testEnv) return;
      const unauthedDb = testEnv.unauthenticatedContext().firestore();
      await assertSucceeds(getDoc(doc(unauthedDb, "products/gps-activo")));
    });

    it("el público NO puede leer productos inactivos (activo: false)", async () => {
      if (!emulatorRunning || !testEnv) return;
      const unauthedDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(getDoc(doc(unauthedDb, "products/dron-inactivo")));
    });

    it("el público puede leer settings/pricing, settings/contact y travelFees", async () => {
      if (!emulatorRunning || !testEnv) return;
      const unauthedDb = testEnv.unauthenticatedContext().firestore();
      await assertSucceeds(getDoc(doc(unauthedDb, "settings/pricing")));
      await assertSucceeds(getDoc(doc(unauthedDb, "settings/contact")));
      await assertSucceeds(getDoc(doc(unauthedDb, "travelFees/MEX")));
    });

    it("el público NO puede leer datos bancarios (settings/bank)", async () => {
      if (!emulatorRunning || !testEnv) return;
      const unauthedDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(getDoc(doc(unauthedDb, "settings/bank")));
    });

    it("el público NO puede leer auditLog", async () => {
      if (!emulatorRunning || !testEnv) return;
      const unauthedDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(getDoc(doc(unauthedDb, "auditLog/log-1")));
    });

    it("el público NO puede escribir en catálogo ni precios", async () => {
      if (!emulatorRunning || !testEnv) return;
      const unauthedDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(setDoc(doc(unauthedDb, "products/hack"), { activo: true }));
      await assertFails(setDoc(doc(unauthedDb, "settings/pricing"), { ivaPorcentaje: 0 }));
    });
  });

  describe("Rol Vendedor", () => {
    it("un vendedor NO puede leer datos bancarios (settings/bank)", async () => {
      if (!emulatorRunning || !testEnv) return;
      const vendedorDb = testEnv.authenticatedContext("vendedor-1", { role: "vendedor" }).firestore();
      await assertFails(getDoc(doc(vendedorDb, "settings/bank")));
    });

    it("un vendedor NO puede leer la bitácora auditLog", async () => {
      if (!emulatorRunning || !testEnv) return;
      const vendedorDb = testEnv.authenticatedContext("vendedor-1", { role: "vendedor" }).firestore();
      await assertFails(getDoc(doc(vendedorDb, "auditLog/log-1")));
    });

    it("un vendedor NO puede modificar precios ni crear productos en catálogo", async () => {
      if (!emulatorRunning || !testEnv) return;
      const vendedorDb = testEnv.authenticatedContext("vendedor-1", { role: "vendedor" }).firestore();
      await assertFails(setDoc(doc(vendedorDb, "products/nuevo-gps"), { nombre: "Hack" }));
      await assertFails(setDoc(doc(vendedorDb, "settings/pricing"), { ivaPorcentaje: 0 }));
    });
  });

  describe("Rol Administrador", () => {
    it("un administrador puede leer y escribir settings/bank y auditLog", async () => {
      if (!emulatorRunning || !testEnv) return;
      const adminDb = testEnv.authenticatedContext("admin-1", { role: "admin" }).firestore();
      await assertSucceeds(getDoc(doc(adminDb, "settings/bank")));
      await assertSucceeds(getDoc(doc(adminDb, "auditLog/log-1")));
      await assertSucceeds(setDoc(doc(adminDb, "settings/bank"), { clabe: "012180009999999999" }));
    });

    it("un administrador puede escribir en productos y precios", async () => {
      if (!emulatorRunning || !testEnv) return;
      const adminDb = testEnv.authenticatedContext("admin-1", { role: "admin" }).firestore();
      await assertSucceeds(setDoc(doc(adminDb, "products/gps-admin"), { nombre: "Admin GPS", activo: true }));
      await assertSucceeds(setDoc(doc(adminDb, "settings/pricing"), { ivaPorcentaje: 16 }));
    });
  });
});

