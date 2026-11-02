import { initialProducts } from "./seed-data";

// Precios de especificación (sin IVA, en pesos y centavos):
const expectedPrices: Record<string, number> = {
  // 1. Equipos GPS (10)
  "gps-estandar-sin-telemetria": 399999, // $3,999.99
  "gps-basico-semi": 517718,             // $5,177.18
  "gps-estandar": 737700,                // $7,377.00
  "gps-motocicleta-y04g": 737700,        // $7,377.00
  "gps-portable-3d": 757700,             // $7,577.00
  "gps-intermedio": 797700,              // $7,977.00
  "gps-maquinaria-pesada": 817700,       // $8,177.00
  "gps-caja": 837700,                    // $8,377.00
  "gps-flotilla": 887700,                // $8,877.00
  "gps-portable-15d": 987700,            // $9,877.00

  // 2. DashCams y video (3)
  "dashcam-jc181": 611000,               // $6,110.00
  "dashcam-jc450": 1198000,              // $11,980.00
  "camara-externa-ip67": 95000,          // $950.00

  // 3. Seguridad y control (10)
  "sistema-anti-jammer": 357000,         // $3,570.00
  "sensor-combustible-varilla-instalado": 860000, // $8,600.00
  "equipo-senuelo-gtx3": 50000,          // $500.00
  "seguros-puertas-automatizados": 115000, // $1,150.00
  "sensor-temperatura": 219969,          // $2,199.69
  "teclado-rfid-ferceo": 282672,         // $2,826.72
  "chapa-electromecanica-1-perno-ferceo": 652500, // $6,525.00
  "chapa-perno-mecanica-1300lb": 677850, // $6,778.50
  "sensor-combustible-equipo": 797846,   // $7,978.46
  "chapa-magnetica-exterior-1600lb": 1581660, // $15,816.60

  // 4. Accesorios (8)
  "boton-panico": 37500,                 // $375.00
  "caja-iman-gl200-gl300": 52500,        // $525.00
  "antena-gps-externa": 80000,           // $800.00
  "bocina": 129969,                      // $1,299.69
  "microfono": 139969,                   // $1,399.69
  "microfono-bocina-bidireccional": 269938, // $2,699.38
  "caja-pelican-gl200": 371000,          // $3,710.00
  "microsd-256gb": 178000,               // $1,780.00

  // 5. Drones (2)
  "dji-matrice-4e": 0,                   // $0.00 (cotización manual)
  "dji-matrice-4t": 0,                   // $0.00 (cotización manual)

  // 6. Servicios (7) - según COSOTEC_SPEC y corrección obligatoria
  "desarrollo-web-service": 799900,       // $7,999.00
  "desinstalacion": 55000,               // $550.00
  "desinstalacion-e-instalacion": 140000, // $1,400.00
  "equipo-sustituto": 195000,            // $1,950.00
  "instalacion-suelta": 95000,           // $950.00
  "renovacion-anual-gps": 258375,        // $2,583.75
  "datos-extra-dashcam-5gb": 35000,      // $350.00
};

interface Diferencia {
  slug: string;
  nombre: string;
  precioEnSeed: string;
  precioEsperado: string;
  diferencia: string;
}

const diferencias: Diferencia[] = [];

for (const prod of initialProducts) {
  const esperado = expectedPrices[prod.slug];
  if (esperado === undefined) {
    diferencias.push({
      slug: prod.slug,
      nombre: prod.nombreComercial,
      precioEnSeed: `$${(prod.precioSinIvaCentavos / 100).toFixed(2)}`,
      precioEsperado: "NO ENCONTRADO EN ESPECIFICACIÓN",
      diferencia: "Producto no reconocido",
    });
  } else if (prod.precioSinIvaCentavos !== esperado) {
    diferencias.push({
      slug: prod.slug,
      nombre: prod.nombreComercial,
      precioEnSeed: `$${(prod.precioSinIvaCentavos / 100).toFixed(2)}`,
      precioEsperado: `$${(esperado / 100).toFixed(2)}`,
      diferencia: `$${((prod.precioSinIvaCentavos - esperado) / 100).toFixed(2)}`,
    });
  }
}

// Verificar si hay algún producto esperado que no esté en initialProducts
for (const slug of Object.keys(expectedPrices)) {
  if (!initialProducts.some((p) => p.slug === slug)) {
    diferencias.push({
      slug,
      nombre: "FALTANTE",
      precioEnSeed: "NO EXISTE EN SEED",
      precioEsperado: `$${(expectedPrices[slug] / 100).toFixed(2)}`,
      diferencia: "Falta en catálogo",
    });
  }
}

console.log("\n=======================================================");
console.log("📊 TABLA DE DIFERENCIAS CONTRA LA ESPECIFICACIÓN (40 PRODUCTOS)");
console.log("=======================================================");

if (diferencias.length === 0) {
  console.log("✅ 0 DIFERENCIAS ENCONTRADAS (Tabla vacía)");
  console.log(`Total productos analizados: ${initialProducts.length} de 40 esperados.`);
} else {
  console.table(diferencias);
}

