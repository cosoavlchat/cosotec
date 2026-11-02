/**
 * CosoTec - Script de Seed Idempotente
 * Carga el catálogo inicial, paquetes, precios, viáticos, settings y contenido oficial.
 * Uso:
 *   npm run seed:local   # Ejecuta contra Firebase Emulator Suite (localhost:8080)
 *   npm run seed:prod    # Ejecuta contra cosotec7 en producción (requiere credenciales)
 */

import fs from "fs";
import path from "path";
import {
  initialPricingSettings,
  initialContactSettings,
  initialBankSettings,
  initialFeaturesSettings,
  initialAnalyticsSettings,
  initialContentData,
  initialTravelFees,
  initialProducts,
  initialPackages,
} from "./seed-data";

const isProd = process.argv.includes("--prod");

async function runSeed() {
  console.log(`\n🌱 [CosoTec Seed] Iniciando carga de datos... (Modo: ${isProd ? "PRODUCCIÓN (cosotec7)" : "LOCAL (Firebase Emulator)"})`);

  if (isProd) {
    const localKey = path.resolve(process.cwd(), "serviceAccountKey-cosotec7.json");
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.FIREBASE_SERVICE_ACCOUNT_KEY && fs.existsSync(localKey)) {
      process.env.GOOGLE_APPLICATION_CREDENTIALS = localKey;
    }

    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.error(
        "❌ ERROR: Para ejecutar el seed en producción debes definir FIREBASE_SERVICE_ACCOUNT_KEY o GOOGLE_APPLICATION_CREDENTIALS."
      );
      process.exit(1);
    }
  } else {
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR = "true";
    process.env.USE_FIREBASE_EMULATOR = "true";
    process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
    process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
  }

  try {
    const { adminDb } = await import("@/lib/firebase/admin");

    console.log(`📦 Guardando ${initialProducts.length} productos en 'products'...`);
    const batch = adminDb.batch();

    for (const prod of initialProducts) {
      const ref = adminDb.collection("products").doc(prod.slug);
      batch.set(ref, {
        ...prod,
        incluyeInstalacion: prod.incluyeInstalacion ?? false,
        incluyePlanPrimerAnio: prod.incluyePlanPrimerAnio ?? false,
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

    console.log(`🚀 Guardando features y analytics en 'settings/features' y 'settings/analytics'...`);
    batch.set(adminDb.collection("settings").doc("features"), initialFeaturesSettings, { merge: true });
    batch.set(adminDb.collection("settings").doc("analytics"), initialAnalyticsSettings, { merge: true });

    console.log(`📝 Guardando documentos de contenido editable en colección 'content'...`);
    batch.set(adminDb.collection("content").doc("stats"), initialContentData.stats, { merge: true });
    batch.set(adminDb.collection("content").doc("hero"), initialContentData.hero, { merge: true });
    batch.set(adminDb.collection("content").doc("faq"), { items: initialContentData.faq }, { merge: true });
    batch.set(adminDb.collection("content").doc("accesos"), initialContentData.accesos, { merge: true });
    batch.set(adminDb.collection("content").doc("legales"), initialContentData.legales, { merge: true });

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
    console.log(`   - Contenido oficial (cifras veraces, hero, FAQ, accesos y legales) cargado en 'content'`);
    console.log(`   - Drones desactivados temporalmente (activo: false)`);
    console.log(`   - Marcados con revisarPrecio: true (GPS Esencial y GPS Portable 15-D)`);
    console.log(`   - MSI vacío por defecto (no mostrar hasta configurar)`);
  } catch (error: any) {
    console.error("❌ Error conectando a Firestore:", error.message || error);
    if (!isProd) {
      console.error("\n💡 Recuerda arrancar los emuladores primero con:");
      console.error("   npx firebase emulators:start --only firestore,auth,storage\n");
    }
    process.exit(1);
  }
}

runSeed();
