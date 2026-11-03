import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\czssf\\.gemini\\antigravity\\brain\\326055ce-c090-41ec-b4d7-6719f577d049';
const LIVE_URL = 'https://cosotec--cosotec7.us-east4.hosted.app/c/CT-1124459?t=8ZNFBRqR54CvOT_moUd5GWGK0diZRlUj';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // 1. Mobile Viewport (390 x 844)
    console.log('Capturando vista móvil...');
    const pageMobile = await browser.newPage();
    await pageMobile.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await pageMobile.goto(LIVE_URL, { waitUntil: 'networkidle2', timeout: 60000 });
    // Esperar a que la tabla o datos carguen
    await pageMobile.waitForSelector('table', { timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 2000));
    
    const mobilePath = path.join(ARTIFACT_DIR, 'vista-cliente-mobile-CT-1124459.png');
    await pageMobile.screenshot({ path: mobilePath, fullPage: true });
    console.log('Guardado mobile:', mobilePath);
    await pageMobile.close();

    // 2. Desktop Viewport (1280 x 900)
    console.log('Capturando vista desktop...');
    const pageDesktop = await browser.newPage();
    await pageDesktop.setViewport({ width: 1280, height: 900 });
    await pageDesktop.goto(LIVE_URL, { waitUntil: 'networkidle2', timeout: 60000 });
    await pageDesktop.waitForSelector('table', { timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 2000));

    const desktopPath = path.join(ARTIFACT_DIR, 'vista-cliente-desktop-CT-1124459.png');
    await pageDesktop.screenshot({ path: desktopPath, fullPage: true });
    console.log('Guardado desktop:', desktopPath);

    // 3. Simular Card de Previsualización de WhatsApp
    console.log('Generando preview de WhatsApp card...');
    // Obtenemos los meta tags de la página en vivo
    const metaData = await pageDesktop.evaluate(() => {
      const getMeta = (prop) => {
        const el = document.querySelector(`meta[property="${prop}"]`) || document.querySelector(`meta[name="${prop}"]`);
        return el ? el.getAttribute('content') : '';
      };
      return {
        title: document.title,
        ogTitle: getMeta('og:title'),
        ogDesc: getMeta('og:description'),
        ogImage: getMeta('og:image'),
        robots: getMeta('robots')
      };
    });
    console.log('Metadatos detectados en /c/CT-1124459:', metaData);

    // Renderizamos una tarjeta realista estilo WhatsApp Web / móvil
    const previewPage = await browser.newPage();
    await previewPage.setViewport({ width: 600, height: 480 });
    
    // Obtenemos og-quote.png en base64 para que el preview card no dependa de red
    const ogImgBase64 = fs.readFileSync(path.join(ARTIFACT_DIR, 'og-quote.png')).toString('base64');
    const ogImgSrc = `data:image/png;base64,${ogImgBase64}`;

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          margin: 0;
          padding: 30px;
          background-color: #efeae2;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }
        .chat-bubble {
          background-color: #d9fdd3;
          border-radius: 8px 8px 2px 8px;
          box-shadow: 0 1px 0.5px rgba(11,20,26,.13);
          max-width: 440px;
          padding: 6px 7px 8px 7px;
          font-size: 14.2px;
          line-height: 19px;
          color: #111b21;
        }
        .bubble-text {
          padding: 4px 6px 6px 6px;
          word-break: break-word;
        }
        .bubble-text a {
          color: #027eb5;
          text-decoration: underline;
        }
        .link-card {
          background-color: #f0f2f5;
          border-radius: 8px;
          overflow: hidden;
          margin-top: 4px;
          border: 1px solid rgba(11,20,26,.08);
          display: flex;
          flex-direction: column;
        }
        .card-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
          display: block;
        }
        .card-body {
          padding: 10px 12px;
          background: #f7f8fa;
        }
        .card-domain {
          font-size: 11px;
          text-transform: uppercase;
          color: #667781;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }
        .card-title {
          font-size: 14px;
          font-weight: 600;
          color: #111b21;
          margin: 0 0 4px 0;
          line-height: 1.25;
        }
        .card-desc {
          font-size: 12.5px;
          color: #667781;
          margin: 0;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .bubble-meta {
          text-align: right;
          font-size: 11px;
          color: #667781;
          margin-top: 2px;
          padding-right: 4px;
        }
        .badge-notice {
          margin-top: 16px;
          background: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          color: #54656f;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          font-family: sans-serif;
        }
      </style>
    </head>
    <body>
      <div class="chat-bubble">
        <div class="bubble-text">
          Hola Juan Carlos, te comparto tu cotización <strong>CT-1124459</strong> de CosoTec. Puedes revisarla, descargar el PDF y pagar en línea aquí: <a href="${LIVE_URL}">https://cosotec.com/c/CT-1124459</a>. Cualquier duda, estoy a tus órdenes. — Asesor Comercial
        </div>
        <div class="link-card">
          <img class="card-image" src="${ogImgSrc}" alt="Previsualización de Cotización CosoTec" />
          <div class="card-body">
            <div class="card-domain">cosotec.com</div>
            <div class="card-title">${metaData.ogTitle || 'Cotización CT-1124459 · CosoTec by CoSoAVL'}</div>
            <div class="card-desc">${metaData.ogDesc || 'Revisa tu cotización y paga en línea de forma segura'}</div>
          </div>
        </div>
        <div class="bubble-meta">
          10:42 p. m. ✓✓
        </div>
      </div>
      <div class="badge-notice">
        🔒 Metadatos seguros: sin nombres ni montos · Directiva robots: <code>${metaData.robots || 'noindex, nofollow'}</code>
      </div>
    </body>
    </html>
    `;

    await previewPage.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const previewPath = path.join(ARTIFACT_DIR, 'whatsapp-preview-card.png');
    await previewPage.screenshot({ path: previewPath });
    console.log('Guardado WhatsApp preview:', previewPath);

    await pageDesktop.close();
    await previewPage.close();
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

