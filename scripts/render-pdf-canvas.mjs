import puppeteer from "puppeteer-core";
import path from "path";
import fs from "fs";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const artifactDir = "C:\\Users\\czssf\\.gemini\\antigravity\\brain\\326055ce-c090-41ec-b4d7-6719f577d049";
const pdfPath = path.join(artifactDir, "cotizacion-CT-1124459.pdf");

async function run() {
  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfBase64 = pdfBytes.toString("base64");

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <style>
    body { margin: 0; background: #525659; display: flex; justify-content: center; padding: 20px; }
    canvas { box-shadow: 0 4px 16px rgba(0,0,0,0.4); background: white; }
  </style>
</head>
<body>
  <canvas id="pdfCanvas"></canvas>
  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const pdfData = atob("${pdfBase64}");
    const loadingTask = pdfjsLib.getDocument({ data: pdfData });
    loadingTask.promise.then(async function(pdf) {
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.getElementById('pdfCanvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');
      await page.render({ canvasContext: context, viewport: viewport }).promise;
      window.pdfRenderDone = true;
    });
  </script>
</body>
</html>
  `;

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1300, height: 1650 });
  await page.setContent(htmlContent);

  await page.waitForFunction(() => window.pdfRenderDone === true, { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 500));

  const canvasEl = await page.$("#pdfCanvas");
  if (canvasEl) {
    const outPng = path.join(artifactDir, "muestra-pdf-CT-1124459-render.png");
    await canvasEl.screenshot({ path: outPng });
    console.log("PDF render saved to:", outPng);
  }

  await browser.close();
}

run();
