import { adminDb } from "../src/lib/firebase/admin";

async function run() {
  const contentRef = adminDb.collection("content").doc("cotizaciones");
  const doc = await contentRef.get();
  const defaultMsg =
    "Hola [nombre], te comparto tu cotización [folio] de CosoTec. Puedes revisarla, descargar el PDF y pagar en línea aquí: [link]. Cualquier duda, estoy a tus órdenes. — [vendedor]";

  if (!doc.exists) {
    await contentRef.set({
      mensajeWhatsApp: defaultMsg,
      updatedAt: new Date().toISOString(),
    });
    console.log("✅ content/cotizaciones creado con mensajeWhatsApp predeterminado.");
  } else {
    const data = doc.data();
    if (!data?.mensajeWhatsApp) {
      await contentRef.update({
        mensajeWhatsApp: defaultMsg,
        updatedAt: new Date().toISOString(),
      });
      console.log("✅ content/cotizaciones actualizado con mensajeWhatsApp.");
    } else {
      console.log("ℹ️ content/cotizaciones ya contiene mensajeWhatsApp:", data.mensajeWhatsApp);
    }
  }
}

run().catch(console.error);

