import { ProductCategory } from "@/types/catalog";

/**
 * Obtiene la imagen a mostrar para un producto del catálogo.
 * Si el producto tiene imágenes asignadas (desde admin o Firestore), se utiliza la primera.
 * De lo contrario, asigna automáticamente la imagen representativa de muestra de /products/*.
 */
export function getProductImage(product: {
  slug?: string;
  categoria?: ProductCategory | string;
  imagenes?: string[];
}): string {
  if (product.imagenes && product.imagenes.length > 0 && product.imagenes[0].trim()) {
    return product.imagenes[0];
  }

  const slug = (product.slug || "").toLowerCase();
  const cat = (product.categoria || "").toLowerCase();

  if (cat === "dashcam" || slug.includes("dashcam") || slug.includes("camara")) {
    return "/products/dashcam.webp";
  }

  if (slug.includes("moto")) {
    return "/products/gps-moto.webp";
  }

  if (slug.includes("portable") || slug.includes("iman") || slug.includes("caja-")) {
    return "/products/gps-portable.webp";
  }

  if (slug.includes("jammer")) {
    return "/products/antijammer.webp";
  }

  if (slug.includes("combustible") || slug.includes("temperatura")) {
    return "/products/sensor-combustible.webp";
  }

  if (slug.includes("chapa") || slug.includes("perno") || slug.includes("seguro") || slug.includes("rfid")) {
    return "/products/chapa-seguridad.webp";
  }

  if (cat === "dron" || slug.includes("dron")) {
    return "/products/dron-empresarial.webp";
  }

  if (slug.includes("panico") || slug.includes("sos") || slug.includes("boton")) {
    return "/products/boton-panico.webp";
  }

  if (cat === "servicio" || slug.includes("servicio") || slug.includes("instalacion")) {
    return "/products/servicio-instalacion.webp";
  }

  return "/products/gps-standard.webp";
}
