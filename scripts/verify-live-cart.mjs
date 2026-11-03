import puppeteer from "puppeteer-core";
import path from "path";
import fs from "fs";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outputDir = "C:\\Users\\czssf\\.gemini\\antigravity\\brain\\326055ce-c090-41ec-b4d7-6719f577d049";
const baseUrl = "https://cosotec--cosotec7.us-east4.hosted.app";

async function run() {
  console.log("Launching Chrome...");
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  try {
    // ==========================================
    // 1. CAPTURAS MÓVILES (iPhone 14 / 390x844)
    // ==========================================
    console.log("\n--- INICIANDO VERIFICACIÓN MÓVIL ---");
    const mobilePage = await browser.newPage();
    await mobilePage.setViewport({
      width: 390,
      height: 844,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    });

    // 1.1 Carrito vacío en móvil (/carrito)
    console.log("1.1 Navegando a /carrito (vacío en móvil)...");
    await mobilePage.goto(`${baseUrl}/carrito`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2000));
    await mobilePage.screenshot({ path: path.join(outputDir, "carrito-mobile-1-vacio.png") });
    console.log("Capturado: carrito-mobile-1-vacio.png");

    // 1.2 Checkout bloqueado cuando el carrito está vacío
    console.log("1.2 Navegando a /checkout (vacío en móvil)...");
    await mobilePage.goto(`${baseUrl}/checkout`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2000));
    await mobilePage.screenshot({ path: path.join(outputDir, "checkout-mobile-1-bloqueado-vacio.png") });
    console.log("Capturado: checkout-mobile-1-bloqueado-vacio.png");

    // 1.3 Agregar solución desde /soluciones/auto-camioneta
    console.log("1.3 Navegando a /soluciones/auto-camioneta y agregando al carrito...");
    await mobilePage.goto(`${baseUrl}/soluciones/auto-camioneta`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2000));

    // Buscar botón de agregar al carrito en la primera tarjeta de solución
    const addToCartBtn = await mobilePage.waitForSelector('button:has-text("Agregar al Carrito")', { timeout: 10000 }).catch(async () => {
      // Fallback selector por icono o texto
      const buttons = await mobilePage.$$("button");
      for (const btn of buttons) {
        const text = await (await btn.getProperty("innerText")).jsonValue();
        if (text && text.includes("Agregar al Carrito")) return btn;
      }
      return null;
    });

    if (addToCartBtn) {
      await addToCartBtn.click();
      console.log("Clic en Agregar al Carrito realizado.");
      await new Promise((r) => setTimeout(r, 3000));
    }

    // 1.4 Abrir Drawer de Carrito desde el botón del navbar
    console.log("1.4 Abriendo CartDrawer en móvil...");
    const cartNavBtn = await mobilePage.waitForSelector('button[aria-label*="carrito" i]', { timeout: 8000 }).catch(() => null);
    if (cartNavBtn) {
      await cartNavBtn.click();
      await new Promise((r) => setTimeout(r, 2000));
      await mobilePage.screenshot({ path: path.join(outputDir, "carrito-mobile-2-drawer-agrupado.png") });
      console.log("Capturado: carrito-mobile-2-drawer-agrupado.png");
    }

    // 1.5 Probar botón Eliminar con banner Deshacer en móvil
    console.log("1.5 Probando botón Eliminar con opción de Deshacer...");
    const trashBtn = await mobilePage.waitForSelector('button[aria-label*="Eliminar" i]', { timeout: 5000 }).catch(() => null);
    if (trashBtn) {
      await trashBtn.click();
      await new Promise((r) => setTimeout(r, 1500));
      await mobilePage.screenshot({ path: path.join(outputDir, "carrito-mobile-3-deshacer-banner.png") });
      console.log("Capturado: carrito-mobile-3-deshacer-banner.png");
    }

    await mobilePage.close();

    // ==========================================
    // 2. CAPTURAS ESCRITORIO (1280x850)
    // ==========================================
    console.log("\n--- INICIANDO VERIFICACIÓN ESCRITORIO ---");
    const deskPage = await browser.newPage();
    await deskPage.setViewport({
      width: 1280,
      height: 850,
      deviceScaleFactor: 2,
    });

    // 2.1 Visitar página de producto individual y agregar al carrito
    console.log("2.1 Agregando producto desde /tienda...");
    await deskPage.goto(`${baseUrl}/tienda`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2000));

    const addProductBtn = await deskPage.waitForSelector('button:has-text("Agregar al Carrito")', { timeout: 8000 }).catch(async () => {
      const buttons = await deskPage.$$("button");
      for (const btn of buttons) {
        const text = await (await btn.getProperty("innerText")).jsonValue();
        if (text && text.includes("Agregar al Carrito")) return btn;
      }
      return null;
    });

    if (addProductBtn) {
      await addProductBtn.click();
      await new Promise((r) => setTimeout(r, 2500));
    }

    // 2.2 Abrir página dedicada /carrito
    console.log("2.2 Navegando a /carrito en escritorio...");
    await deskPage.goto(`${baseUrl}/carrito`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2500));
    await deskPage.screenshot({ path: path.join(outputDir, "carrito-desktop-1-pagina.png") });
    console.log("Capturado: carrito-desktop-1-pagina.png");

    // 2.3 Incrementar unidades a 6 para verificar recálculo de Descuento por Volumen (10%)
    console.log("2.3 Modificando cantidad a 6 para activar descuento por volumen...");
    const qtyInput = await deskPage.waitForSelector('input[type="number"][aria-label*="Cantidad" i]', { timeout: 5000 }).catch(() => null);
    if (qtyInput) {
      await qtyInput.click({ clickCount: 3 });
      await qtyInput.type("6");
      await qtyInput.press("Enter");
      await new Promise((r) => setTimeout(r, 3000));
      await deskPage.screenshot({ path: path.join(outputDir, "carrito-desktop-2-descuento-volumen.png") });
      console.log("Capturado: carrito-desktop-2-descuento-volumen.png");
    }

    // 2.4 Checkout con productos
    console.log("2.4 Navegando a /checkout con resumen de pedido interactivo...");
    await deskPage.goto(`${baseUrl}/checkout`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2500));
    await deskPage.screenshot({ path: path.join(outputDir, "checkout-desktop-resumen.png") });
    console.log("Capturado: checkout-desktop-resumen.png");

    // 2.5 Verificar bloqueo de carrito con cotización de vendedor (Snapshot)
    console.log("2.5 Verificando candado de cotización oficial en /c/CT-1124459...");
    await deskPage.goto(`${baseUrl}/c/CT-1124459`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2000));

    // Buscar enlace o botón de pago en la cotización
    const payBtn = await deskPage.waitForSelector('a[href*="/checkout?cotizacion="], button:has-text("Pagar en Línea"), a:has-text("Pagar")', { timeout: 6000 }).catch(() => null);
    if (payBtn) {
      await payBtn.click();
      await new Promise((r) => setTimeout(r, 3000));
      await deskPage.screenshot({ path: path.join(outputDir, "checkout-desktop-cotizacion-bloqueada.png") });
      console.log("Capturado: checkout-desktop-cotizacion-bloqueada.png");
    }

    await deskPage.close();
    console.log("\nVerificación en vivo completada exitosamente.");
  } catch (err) {
    console.error("Error durante verificación en vivo:", err);
  } finally {
    await browser.close();
  }
}

run();

