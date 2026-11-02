import { initialProducts, initialPackages } from "./seed-data";

console.log(`Total productos: ${initialProducts.length}`);
console.log(`Total paquetes: ${initialPackages.length}`);

const items = initialProducts.map((p, idx) => ({
  "#": idx + 1,
  slug: p.slug,
  nombre: p.nombreComercial.substring(0, 30),
  categoria: p.categoria,
  precioSinIva: `$${(p.precioSinIvaCentavos / 100).toFixed(2)}`,
  incInst: p.incluyeInstalacion,
  incPlan: p.incluyePlanPrimerAnio,
  revisarPrecio: p.revisarPrecio,
}));

console.table(items);

