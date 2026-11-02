import path from "path";
import fs from "fs";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { defaultSolutions } from "../src/lib/services/solutions-service";
import { initialZonasSinCosto } from "../src/lib/pricing/zonas-sin-costo";

const keyPath = path.resolve(process.cwd(), "serviceAccountKey-cosotec7.json");
if (!fs.existsSync(keyPath)) {
  console.error("❌ No se encontró el archivo de credenciales:", keyPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf-8"));

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    projectId: "cosotec7",
  });
}

const db = getFirestore();

export async function runMigration() {
  console.log("🚀 Iniciando migración de contenido y configuración en producción (cosotec7)...");

  // 1. settings/features: Activar venta en línea (modoCotizadorWhatsapp = false)
  const featuresRef = db.collection("settings").doc("features");
  await featuresRef.set(
    {
      modoCotizadorWhatsapp: false,
      permitirPagosEnLinea: true,
      mostrarPreciosPublicos: true,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
  console.log("✅ settings/features: modoCotizadorWhatsapp = false");

  // 2. content/faq: Limpiar frases no confirmadas
  const faqRef = db.collection("content").doc("faq");
  const faqSnap = await faqRef.get();
  if (faqSnap.exists) {
    const faqData = faqSnap.data() || {};
    const items = (faqData.items || []).map((item: any) => {
      let respuesta = item.respuesta || "";
      let pregunta = item.pregunta || "";
      respuesta = respuesta
        .replace(/dispositivo homologado/gi, "dispositivo telemático profesional")
        .replace(/homologad[oa]s?/gi, "profesional")
        .replace(/tarjeta SIM multi-carrier/gi, "tarjeta SIM con conectividad multi-operador")
        .replace(/multi-carrier/gi, "multi-red celular");
      return { ...item, pregunta, respuesta };
    });
    await faqRef.set({ items, updatedAt: new Date().toISOString() }, { merge: true });
    console.log("✅ content/faq actualizado y saneado.");
  }

  // 3. content/hero y content/stats: Limpiar "DashCams con IA", "15+" y afirmaciones no confirmadas
  const heroRef = db.collection("content").doc("hero");
  const heroSnap = await heroRef.get();
  if (heroSnap.exists) {
    const heroData = heroSnap.data() || {};
    let subtitulo = heroData.subtitulo || "";
    subtitulo = subtitulo.replace(/DashCams con IA/gi, "DashCams vehiculares con video en vivo");
    await heroRef.set({ subtitulo, updatedAt: new Date().toISOString() }, { merge: true });
    console.log("✅ content/hero actualizado.");
  }

  const statsRef = db.collection("content").doc("stats");
  await statsRef.set(
    {
      cifraDispositivos: "48,000+",
      dispositivosTexto: "48,000 dispositivos vendidos en Norteamérica y Sudamérica",
      gobiernosTexto:
        "Tecnología telemática de alta precisión con soporte técnico especializado y asistencia para recuperación con la ANERPV",
      aniosExperiencia: "Trayectoria",
      experienciaTexto: "Liderazgo en rastreo, telemetría y seguridad de flotas en México",
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
  console.log("✅ content/stats saneado (sin '15+' ni 'homologación').");

  // 4. packages/anti-jammer: Actualizar características y queIncluye
  const antiJammerRef = db.collection("packages").doc("anti-jammer");
  const antiJammerSnap = await antiJammerRef.get();
  if (antiJammerSnap.exists) {
    const pData = antiJammerSnap.data() || {};
    const cleanStr = (s: string) =>
      s
        .replace(/Reconocimiento de operador por RFID/gi, "Comunicación de proximidad RFID independiente de antenas")
        .replace(/Instalación técnica certificada/gi, "Instalación técnica profesional");

    const caracs = (pData.caracteristicas || []).map(cleanStr);
    const queIncluye = (pData.queIncluye || []).map(cleanStr);
    const descripcion = cleanStr(pData.descripcion || "");
    const descripcionCorta = cleanStr(pData.descripcionCorta || "");

    await antiJammerRef.set(
      {
        caracteristicas: caracs,
        queIncluye,
        descripcion,
        descripcionCorta,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    console.log("✅ packages/anti-jammer actualizado.");
  }

  // 5. products: Limpiar textos de productos afectados
  const productsToSanitize = [
    {
      id: "equipo-sustituto",
      patch: {
        descripcion:
          "Equipo temporal de respaldo mientras se realiza el mantenimiento preventivo o correctivo del titular.",
        descripcionCorta:
          "Equipo temporal de respaldo durante servicio de mantenimiento.",
        queIncluye: [
          "Equipo temporal de respaldo",
          "Programación de parámetros",
          "Soporte técnico durante el periodo de préstamo",
        ],
      },
    },
    {
      id: "gps-estandar-sin-telemetria",
      patch: {
        descripcion:
          "Rastreo satelital GPS esencial 4G con paro de motor preventivo y conectividad celular nacional para autos y camionetas.",
        descripcionCorta:
          "Rastreo satelital GPS esencial 4G con paro de motor preventivo para autos y camionetas.",
        modelo: "",
      },
    },
    {
      id: "microfono",
      patch: {
        nombre: "Micrófono de Cabina",
        descripcionCorta:
          "Audio vehicular de cabina para atención inmediata de emergencias.",
        descripcion:
          "Audio unidireccional de cabina para atención inmediata de incidentes y emergencias en ruta.",
        queIncluye: [
          "Micrófono vehicular de alta sensibilidad",
          "Arnés de conexión directa al puerto auxiliar del GPS",
          "Instalación oculta profesional",
          "Nota: El uso de audio en cabina debe ajustarse al consentimiento y avisos laborales correspondientes.",
        ],
      },
    },
    {
      id: "renovacion-anual-gps",
      patch: {
        descripcion:
          "Renovación de 12 meses de plataforma de monitoreo en tiempo real y plan de datos celulares para telemetría.",
        descripcionCorta:
          "Renovación anual de plataforma web/app y plan de datos celulares por unidad.",
      },
    },
  ];

  for (const p of productsToSanitize) {
    const pRef = db.collection("products").doc(p.id);
    const snap = await pRef.get();
    if (snap.exists) {
      await pRef.set({ ...p.patch, updatedAt: new Date().toISOString() }, { merge: true });
      console.log(`✅ products/${p.id} actualizado.`);
    }
  }

  // 6. travelFees/QRO: Corregir notas de San Juan del Río
  const qroRef = db.collection("travelFees").doc("QRO");
  const qroSnap = await qroRef.get();
  if (qroSnap.exists) {
    await qroRef.set(
      {
        notas: "Sin costo en zona metropolitana de Querétaro; resto del estado se cotiza.",
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    console.log("✅ travelFees/QRO actualizado.");
  }

  // 7. zonasSinCosto: Sembrar o sincronizar las 5 zonas metropolitanas
  console.log("📍 Sincronizando zonas metropolitanas sin costo (zonasSinCosto)...");
  for (const zona of initialZonasSinCosto) {
    await db.collection("zonasSinCosto").doc(zona.id).set(
      {
        ...zona,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }
  console.log("✅ 5 zonas metropolitanas registradas en Firestore.");

  // 8. solutions: Upsert de las 7 soluciones acumulativas
  console.log("🛠️ Sincronizando colección solutions con niveles acumulativos y fotos 3:4...");
  for (const sol of defaultSolutions) {
    await db.collection("solutions").doc(sol.slug).set(
      {
        ...sol,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    console.log(`✅ solutions/${sol.slug} sincronizada.`);
  }

  console.log("🎉 ¡Migración completada con éxito!");
}

runMigration().catch((err) => {
  console.error("❌ Error ejecutando migración:", err);
  process.exit(1);
});
