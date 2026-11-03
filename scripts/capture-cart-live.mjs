import puppeteer from "puppeteer-core";
import path from "path";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outputDir = "C:\\Users\\czssf\\.gemini\\antigravity\\brain\\326055ce-c090-41ec-b4d7-6719f577d049";
const baseUrl = "https://cosotec--cosotec7.us-east4.hosted.app";

async function run() {
  console.log("Iniciando captura detallada del carrito...");
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  try {
    // 1. MÓVIL (390x844)
    console.log("=== MÓVIL ===");
    const mobilePage = await browser.newPage();
    await mobilePage.setViewport({
      width: 390,
      height: 844,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    });

    // 1.1 Ir a soluciones y agregar nivel Básico
    console.log("1.1 Agregando nivel de solución a carrito...");
    await mobilePage.goto(`${baseUrl}/soluciones/auto-camioneta`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2000));

    // Clic en el botón de agregar al carrito del nivel
    const tierAddBtn = await mobilePage.waitForSelector('button[aria-label*="Agregar nivel" i]', { timeout: 8000 });
    if (tierAddBtn) {
      await tierAddBtn.click();
      console.log("Nivel agregado al carrito.");
      await new Promise((r) => setTimeout(r, 2000));
    }

    // 1.2 Abrir Drawer desde el Navbar
    console.log("1.2 Abriendo CartDrawer...");
    const cartNavBtn = await mobilePage.waitForSelector('button[aria-label*="carrito" i]', { timeout: 5000 });
    if (cartNavBtn) {
      await cartNavBtn.click();
      await new Promise((r) => setTimeout(r, 1500));
      await mobilePage.screenshot({ path: path.join(outputDir, "carrito-mobile-2-drawer-agrupado.png") });
      console.log("Capturado: carrito-mobile-2-drawer-agrupado.png");
    }

    // 1.3 Eliminar un item del grupo para ver el banner de Deshacer
    console.log("1.3 Eliminando un item para capturar banner Deshacer...");
    const trashBtn = await mobilePage.waitForSelector('button[aria-label*="Eliminar" i]', { timeout: 5000 });
    if (trashBtn) {
      await trashBtn.click();
      await new Promise((r) => setTimeout(r, 1000));
      await mobilePage.screenshot({ path: path.join(outputDir, "carrito-mobile-3-deshacer-banner.png") });
      console.log("Capturado: carrito-mobile-3-deshacer-banner.png");
    }

    await mobilePage.close();

    // 2. ESCRITORIO (1280x850)
    console.log("\n=== ESCRITORIO ===");
    const deskPage = await browser.newPage();
    await deskPage.setViewport({
      width: 1280,
      height: 850,
      deviceScaleFactor: 2,
    });

    // 2.1 Agregar una solución en escritorio
    console.log("2.1 Agregando solución en /soluciones/tractocamion...");
    await deskPage.goto(`${baseUrl}/soluciones/tractocamion`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2000));

    const deskTierAddBtn = await deskPage.waitForSelector('button[aria-label*="Agregar nivel" i]', { timeout: 8000 });
    if (deskTierAddBtn) {
      await deskTierAddBtn.click();
      await new Promise((r) => setTimeout(r, 2000));
    }

    // 2.2 Ver página completa /carrito
    console.log("2.2 Navegando a /carrito...");
    await deskPage.goto(`${baseUrl}/carrito`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2000));
    await deskPage.screenshot({ path: path.join(outputDir, "carrito-desktop-1-pagina.png") });
    console.log("Capturado: carrito-desktop-1-pagina.png");

    // 2.3 Subir a 6 unidades para activar descuento por volumen
    console.log("2.3 Modificando a 6 unidades...");
    const qtyInputs = await deskPage.$$('input[type="number"][aria-label*="Cantidad" i]');
    if (qtyInputs.length > 0) {
      const primaryInput = qtyInputs[0];
      await primaryInput.click({ clickCount: 3 });
      await primaryInput.type("6");
      await primaryInput.press("Enter");
      await new Promise((r) => setTimeout(r, 2500));
      await deskPage.screenshot({ path: path.join(outputDir, "carrito-desktop-2-descuento-volumen.png") });
      console.log("Capturado: carrito-desktop-2-descuento-volumen.png");
    }

    // 2.4 Checkout interactivo
    console.log("2.4 Navegando a /checkout con resumen interactivo...");
    await deskPage.goto(`${baseUrl}/checkout`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2500));
    await deskPage.screenshot({ path: path.join(outputDir, "checkout-desktop-resumen.png") });
    console.log("Capturado: checkout-desktop-resumen.png");

    // 2.5 Cotización bloqueada (Snapshot)
    console.log("2.5 Verificando cotización oficial snapshot en /c/CT-1124459...");
    await deskPage.goto(`${baseUrl}/c/CT-1124459`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2000));

    // Buscar enlace a checkout
    const checkoutLink = await deskPage.waitForSelector('a[href*="/checkout?cotizacion="]', { timeout: 6000 }).catch(() => null);
    if (checkoutLink) {
      const href = await (await checkoutLink.getProperty("href")).jsonValue();
      console.log("Navegando a checkout de cotización:", href);
      await deskPage.goto(href, { waitUntil: "networkidle2" });
      await new Promise((r) => setTimeout(r, 3000));
      await deskPage.screenshot({ path: path.join(outputDir, "checkout-desktop-cotizacion-bloqueada.png") });
      console.log("Capturado: checkout-desktop-cotizacion-bloqueada.png");
    }

    await deskPage.close();
    console.log("\nCapturas completadas con éxito.");
  } catch (err) {
    console.error("Error en capture script:", err);
  } finally {
    await browser.close();
  }
}

run();

