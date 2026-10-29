import { MetadataRoute } from "next";
import { getProducts, getPackages } from "@/lib/services/catalog-service";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://cosotec.com";

  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const products = await getProducts(false);
    productEntries = products.map((product) => ({
      url: `${baseUrl}/p/${product.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch {}

  let packageEntries: MetadataRoute.Sitemap = [];
  try {
    const packages = await getPackages(false);
    packageEntries = packages.map((pkg) => ({
      url: `${baseUrl}/paquetes/${pkg.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch {}

  const categories = ["gps", "dashcam", "seguridad", "accesorio", "dron", "servicio"];
  const categoryEntries: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${baseUrl}/tienda/${cat}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const soluciones = [
    "auto-camioneta",
    "taxi-apps",
    "tractocamion",
    "camion-autobus",
    "caja-refrigerada",
    "maquinaria",
    "motos",
  ];
  const solucionEntries: MetadataRoute.Sitemap = soluciones.map((sol) => ({
    url: `${baseUrl}/soluciones/${sol}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/tienda`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/paquetes`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/instalacion`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/plataforma`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/plataforma/gps`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/nosotros`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/contacto`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/acceso`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/privacidad`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terminos`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/garantia`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  return [...staticPages, ...categoryEntries, ...solucionEntries, ...productEntries, ...packageEntries];
}
