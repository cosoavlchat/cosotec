import fs from "fs";
import path from "path";

async function cleanup() {
  const localKey = path.resolve(process.cwd(), "serviceAccountKey-cosotec7.json");
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.FIREBASE_SERVICE_ACCOUNT_KEY && fs.existsSync(localKey)) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = localKey;
  }

  const { adminDb } = await import("@/lib/firebase/admin");

  console.log("🔍 Buscando datos demo en cosotec7...");

  // 1. Carritos demo
  const cartIdsToCheck = ["crt_demo_abandono_paso2", "test_health_cart", "test_without_inst"];
  for (const id of cartIdsToCheck) {
    const docRef = adminDb.collection("carts").doc(id);
    const snap = await docRef.get();
    if (snap.exists) {
      console.log(`🗑️ Eliminando carrito demo: ${id}`);
      await docRef.delete();
    } else {
      console.log(`✅ Carrito ${id} no existe.`);
    }
  }

  // Buscar todos los carritos con 'demo' o 'test' en su ID
  const allCarts = await adminDb.collection("carts").get();
  for (const doc of allCarts.docs) {
    if (doc.id.includes("demo") || doc.id.includes("test")) {
      console.log(`🗑️ Eliminando carrito adicional demo/test: ${doc.id}`);
      await doc.ref.delete();
    }
  }

  // 2. Clientes demo
  const allCustomers = await adminDb.collection("customers").get();
  for (const doc of allCustomers.docs) {
    const data = doc.data();
    if (
      doc.id.includes("demo") ||
      doc.id.includes("test") ||
      data.nombre?.includes("Demo") ||
      data.nombre?.includes("Prueba") ||
      data.telefono === "7224322053"
    ) {
      console.log(`🗑️ Eliminando cliente demo: ${doc.id}`);
      await doc.ref.delete();
    }
  }

  // 3. Productos demo como "GPS Tracker 4G Alta Precisión"
  const allProducts = await adminDb.collection("products").get();
  for (const doc of allProducts.docs) {
    const data = doc.data();
    if (
      data.nombreComercial === "GPS Tracker 4G Alta Precisión" ||
      doc.id === "gps-tracker-4g" ||
      doc.id.includes("demo")
    ) {
      console.log(`🗑️ Eliminando producto demo: ${doc.id}`);
      await doc.ref.delete();
    }
  }

  console.log("✨ Verificación y limpieza de datos demo finalizada en cosotec7.");
}

cleanup().catch(console.error);

