import { adminDb } from "../src/lib/firebase/admin";

async function run() {
  const snap = await adminDb.collection("quotes").get();
  console.log(`Total quotes in Firestore: ${snap.size}`);
  snap.forEach((doc) => {
    const d = doc.data();
    console.log(
      `${doc.id} -> cliente: ${d.cliente?.nombre} | vendedor: ${d.vendedorNombre} | esPrueba: ${d.esPrueba} | estado: ${d.estado} | plan: ${d.condiciones?.planSeleccionado}`
    );
  });
}

run().catch(console.error);

