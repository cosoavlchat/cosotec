/**
 * CosoTec - Script de Seed Idempotente
 * Carga el catálogo inicial, paquetes, precios, viáticos y settings.
 * Uso:
 *   npx tsx scripts/seed.ts --local   # Ejecuta contra Firebase Emulator Suite o mock local
 *   npx tsx scripts/seed.ts --prod    # Requiere confirmación y credenciales para cosoteco
 */

import * as fs from "fs";
import * as path from "path";
import * as net from "net";
import {
  initialPricingSettings,
  initialContactSettings,
  initialBankSettings,
  initialTravelFees,
  initialProducts,
  initialPackages,
} from "./seed-data";

const isProd = process.argv.includes("--prod");
const isLocal = process.argv.includes("--local") || !isProd;

function checkSocket(host: string, port: number, timeoutMs = 1200): Promise<boolean> {
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

async function runSeed() {
  console.log(`\n🌱 [CosoTec Seed] Iniciando carga de datos... (Modo: ${isProd ? "PRODUCCIÓN (cosoteco)" : "LOCAL / EMULATOR"})`);

  // Guardar siempre copia en .data/local-seed.json para persistencia local
  try {
    const dataDir = path.join(process.cwd(), ".data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const backupPath = path.join(dataDir, "local-seed.json");
    let existingUsers: any[] = [];
    if (fs.existsSync(backupPath)) {
      try {
        const existingData = JSON.parse(fs.readFileSync(backupPath, "utf-8"));
        existingUsers = existingData.users || [];
      } catch {}
    }

    fs.writeFileSync(
      backupPath,
      JSON.stringify(
        {
          products: initialProducts,
          packages: initialPackages,
          pricing: initialPricingSettings,
          travelFees: initialTravelFees,
          contact: initialContactSettings,
          bank: initialBankSettings,
          users: existingUsers.length > 0 ? existingUsers : [
            {
              uid: "admin-demo-id",
              email: "admin@cosoavl.com",
              nombre: "Admin Principal",
              role: "admin",
              activo: true,
              createdAt: new Date().toISOString(),
            },
          ],
        },
        null,
        2
      ),
      "utf-8"
    );
    console.log(`📁 Copia local de seed guardada en: ${backupPath}`);
  } catch (err) {
    console.warn("No se pudo escribir archivo local .data:", err);
  }

  if (isProd) {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.error(
        "❌ ERROR: Para ejecutar el seed en producción debes definir FIREBASE_SERVICE_ACCOUNT_KEY o GOOGLE_APPLICATION_CREDENTIALS."
      );
      process.exit(1);
    }
  } else {
    // Configurar variables para emulador
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR = "true";
    process.env.USE_FIREBASE_EMULATOR = "true";
    process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
    process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";

    const emulatorRunning = await checkSocket("127.0.0.1", 8080);
    if (!emulatorRunning) {
      console.log("\n⚠️ [Aviso de Conexión]: El emulador de Firestore no está escuchando en 127.0.0.1:8080.");
      console.log("   Los datos se han guardado con éxito en '.data/local-seed.json'.");
      console.log("   El panel web `/admin` y la tienda leerán estos datos automáticamente sin requerir el emulador.");
      console.log("   Para iniciar el emulador oficial cuando lo desees:");
      console.log("   npx firebase emulators:start --only firestore,auth,storage\n");
      return;
    }
  }

  try {
    const { adminDb } = await import("@/lib/firebase/admin");

    console.log(`📦 Guardando ${initialProducts.length} productos en 'products'...`);
    const batch = adminDb.batch();

    for (const prod of initialProducts) {
      const ref = adminDb.collection("products").doc(prod.slug);
      batch.set(ref, {
        ...prod,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }

    console.log(`📦 Guardando ${initialPackages.length} paquetes en 'packages'...`);
    for (const pkg of initialPackages) {
      const ref = adminDb.collection("packages").doc(pkg.slug);
      batch.set(ref, {
        ...pkg,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }

    console.log(`⚙️ Guardando configuración de precios en 'settings/pricing'...`);
    batch.set(adminDb.collection("settings").doc("pricing"), initialPricingSettings, { merge: true });

    console.log(`📞 Guardando datos de contacto en 'settings/contact'...`);
    batch.set(adminDb.collection("settings").doc("contact"), initialContactSettings, { merge: true });

    console.log(`🔒 Guardando datos bancarios en 'settings/bank' (NO PÚBLICO)...`);
    batch.set(adminDb.collection("settings").doc("bank"), initialBankSettings, { merge: true });

    console.log(`🗺️ Guardando ${initialTravelFees.length} estados en 'travelFees'...`);
    for (const fee of initialTravelFees) {
      const ref = adminDb.collection("travelFees").doc(fee.id);
      batch.set(ref, {
        ...fee,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }

    // Inicializar contador de folios si no existe
    const folioRef = adminDb.collection("counters").doc("folios");
    const folioSnap = await folioRef.get();
    if (!folioSnap.exists) {
      batch.set(folioRef, { current: 1124450, updatedAt: new Date().toISOString() });
      console.log(`🔢 Contador inicial de folios creado: CT-1124451 en 'counters/folios'`);
    }

    await batch.commit();
    console.log(`\n✅ ¡Seed completado con éxito en Firestore!`);
    console.log(`   - Productos: ${initialProducts.length}`);
    console.log(`   - Paquetes: ${initialPackages.length}`);
    console.log(`   - Estados de viáticos: ${initialTravelFees.length}`);
    console.log(`   - Configuración de precios: IVA ${initialPricingSettings.ivaPorcentaje}% y reglas listas.`);
    console.log(`   - Drones desactivados temporalmente (activo: false)`);
    console.log(`   - Marcados con revisarPrecio: true (GPS Esencial y GPS Portable 15-D)`);
  } catch (error: any) {
    console.error("❌ Error durante el batch write:", error);
  }
}

runSeed();
