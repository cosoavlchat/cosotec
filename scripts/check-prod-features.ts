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

async function checkFeatures() {
  const doc = await db.collection("settings").doc("features").get();
  console.log("settings/features in cosotec7:", doc.exists ? doc.data() : "DOC DOES NOT EXIST");
}

checkFeatures().catch(console.error);
