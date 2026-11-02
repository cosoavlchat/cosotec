import puppeteer from "puppeteer-core";
import path from "path";
import fs from "fs";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outputDir = "C:\\Users\\czssf\\.gemini\\antigravity\\brain\\326055ce-c090-41ec-b4d7-6719f577d049";

async function run() {
  console.log("Launching Chrome...");
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 390,
    height: 844,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });

  const baseUrl = "https://cosotec--cosotec7.us-east4.hosted.app";

  try {
    // 1. Pantalla de Login Admin
    console.log("Navigating to login...");
    await page.goto(`${baseUrl}/admin/login`, { waitUntil: "networkidle2" });
    await page.screenshot({ path: path.join(outputDir, "admin-mobile-1-login.png") });
    console.log("Captured login screenshot.");

    // 2. Iniciar sesión con vendedor real
    console.log("Logging in as vendedor@cosoavl.com...");
    await page.type('input[type="email"]', "vendedor@cosoavl.com");
    await page.type('input[type="password"]', "Vendedor2026!");
    await page.click('button[type="submit"]');

    // Esperar a entrar a /admin o /admin/cotizaciones
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 2000));

    // 3. Navegar a /admin/cotizaciones
    console.log("Navigating to /admin/cotizaciones...");
    await page.goto(`${baseUrl}/admin/cotizaciones`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(outputDir, "admin-mobile-2-cotizaciones.png") });
    console.log("Captured cotizaciones screenshot.");

    // 4. Navegar a /admin/cotizaciones/nueva
    console.log("Navigating to /admin/cotizaciones/nueva...");
    await page.goto(`${baseUrl}/admin/cotizaciones/nueva`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2000));

    // Capturar Bloque Superior (Cliente y Config)
    await page.screenshot({ path: path.join(outputDir, "admin-mobile-3-nueva-cliente.png") });

    // Scroll al Bloque Productos
    await page.evaluate(() => window.scrollBy(0, 450));
    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({ path: path.join(outputDir, "admin-mobile-4-nueva-productos.png") });

    // Scroll al Bloque Viáticos y Condiciones
    await page.evaluate(() => window.scrollBy(0, 500));
    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({ path: path.join(outputDir, "admin-mobile-5-nueva-condiciones.png") });

    // Scroll al Resumen y Botón Guardar
    await page.evaluate(() => window.scrollBy(0, 600));
    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({ path: path.join(outputDir, "admin-mobile-6-nueva-resumen.png") });

    console.log("All mobile screenshots captured successfully!");
  } catch (err) {
    console.error("Error during puppeteer run:", err);
  } finally {
    await browser.close();
  }
}

run();
