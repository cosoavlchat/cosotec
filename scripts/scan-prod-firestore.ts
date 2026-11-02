import path from "path";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const keyPath = path.resolve(process.cwd(), "serviceAccountKey-cosotec7.json");
const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf-8"));

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    projectId: "cosotec7",
  });
}

const db = getFirestore();

const FORBIDDEN_PATTERNS = [
  /más de 15 años/i,
  /15 años/i,
  /certificación anerpv/i,
  /\bc4\b/i,
  /\bc5\b/i,
  /homologad/i,
  /ingeniería satelital/i,
  /99\.9% uptime/i,
  /servidores dedicados/i,
  /tiempo récord garantizado/i,
  /sin perder garantía de agencia/i,
  /garantía de agencia/i,
  /encintado automotriz/i,
  /cientos de tractocamiones/i,
  /multi-carrier/i,
  /reconocimiento de operador por rfid/i,
  /san juan del río/i,
  /infraestructura protegida/i,
  /acceso personal cosoavl/i,
  /escucha espía/i,
  /dashcams? con ia/i,
];

async function scanFirestore() {
  console.log("🔍 Escaneando Firestore de producción (cosotec7)...");
  const collections = ["content", "packages", "products", "solutions", "travelFees", "settings"];
  const findings: any[] = [];

  for (const colName of collections) {
    const snap = await db.collection(colName).get();
    for (const doc of snap.docs) {
      const data = doc.data();
      const jsonStr = JSON.stringify(data);
      for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.test(jsonStr)) {
          findings.push({
            collection: colName,
            docId: doc.id,
            matchedPattern: pattern.toString(),
            sample: jsonStr.match(new RegExp(`.{0,40}${pattern.source}.{0,40}`, "i"))?.[0],
          });
        }
      }
    }
  }

  console.log(`\n📊 Total de hallazgos en producción: ${findings.length}`);
  findings.forEach((f) => {
    console.log(`- [${f.collection}/${f.docId}] Patrón: ${f.matchedPattern}`);
    console.log(`  Muestra: "${f.sample}"`);
  });
}

scanFirestore().catch((err) => {
  console.error("Error escaneando:", err);
  process.exit(1);
});
