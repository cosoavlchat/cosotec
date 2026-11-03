import { adminDb } from "../src/lib/firebase/admin";

async function run() {
  console.log("Actualizando CT-1124462 en Firestore con esPrueba: true...");
  const quoteRef = adminDb.collection("quotes").doc("CT-1124462");
  const doc = await quoteRef.get();
  if (!doc.exists) {
    console.error("No se encontró CT-1124462 en Firestore");
    return;
  }

  await quoteRef.update({
    esPrueba: true,
    updatedAt: new Date().toISOString(),
  });

  console.log("✅ CT-1124462 marcada con esPrueba: true con éxito.");
}

run().catch(console.error);
