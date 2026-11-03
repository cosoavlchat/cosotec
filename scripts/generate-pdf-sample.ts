import fs from "fs";
import path from "path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { Quote } from "@/types/quote";
import { generarCotizacionPdfBuffer } from "@/lib/pdf/quote-pdf";

const sa = JSON.parse(fs.readFileSync("./serviceAccountKey-cosotec7.json", "utf-8"));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

const artifactDir = "C:\\Users\\czssf\\.gemini\\antigravity\\brain\\326055ce-c090-41ec-b4d7-6719f577d049";

async function main() {
  const doc = await db.collection("quotes").doc("CT-1124459").get();
  if (!doc.exists) {
    throw new Error("Quote CT-1124459 not found in Firestore!");
  }
  const quote = doc.data() as Quote;
  console.log("Generating PDF for", quote.folio, "...");

  const buffer = await generarCotizacionPdfBuffer(quote, "https://cosotec--cosotec7.us-east4.hosted.app");
  const pdfOut = path.join(artifactDir, "cotizacion-CT-1124459.pdf");
  fs.writeFileSync(pdfOut, buffer);
  console.log("PDF saved to:", pdfOut, "Size:", buffer.length);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });

