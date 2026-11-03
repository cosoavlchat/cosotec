import { adminDb } from "../src/lib/firebase/admin";

async function inspect(folio: string) {
  const doc = await adminDb.collection("quotes").doc(folio).get();
  if (!doc.exists) {
    console.log(`Quote ${folio} not found`);
    return;
  }
  const d = doc.data()!;
  console.log(`\n=== QUOTE ${folio} ===`);
  console.log("Folio:", d.folio);
  console.log("Token:", d.tokenPublico || d.token);
  console.log("esPrueba:", d.esPrueba);
  console.log("Cliente:", d.cliente);
  console.log("Instalacion:", d.instalacion);
  console.log("EstadoInstalacion:", d.estadoInstalacion);
  console.log("Condiciones:", d.condiciones);
  console.log("Items:");
  for (const it of d.items || []) {
    console.log(" -", it.nombre, "| id:", it.id, "| modelo:", it.modelo, "| modeloConfirmado:", it.modeloConfirmado, "| incluyeInst:", it.incluyeInstalacion);
  }
  console.log("Lineas calculadas:");
  for (const l of d.calculo?.lineasCalculadas || []) {
    console.log(" -", l.nombre, "| cant:", l.cantidad, "| total:", l.totalSinIvaCentavos, "| esInstAgregada:", l.esInstalacionAgregada);
  }
  console.log("Planes de pago:");
  for (const [k, p] of Object.entries(d.calculo?.planesPago || {})) {
    console.log(" -", k, ":", (p as any).nombre, "| primerPago:", (p as any).montoPrimerPagoCentavos, "| pagos:", (p as any).pagos?.length);
  }
}

async function run() {
  await inspect("CT-1124459");
  await inspect("CT-1124462");
}

run().catch(console.error);

