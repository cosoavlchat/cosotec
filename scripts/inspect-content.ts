import path from "path";
import fs from "fs";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const keyPath = path.resolve(process.cwd(), "serviceAccountKey-cosotec7.json");
const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf-8"));

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    projectId: "cosotec7",
  });
}

const db = getFirestore();

async function inspectContent() {
  const snap = await db.collection("content").get();
  for (const doc of snap.docs) {
    console.log(`=== content/${doc.id} ===`);
    console.log(JSON.stringify(doc.data(), null, 2));
  }
}

inspectContent().catch(console.error);

