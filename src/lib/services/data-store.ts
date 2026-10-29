import * as fs from "fs";
import * as path from "path";
import { Product, Package } from "@/types/catalog";
import { PricingSettings, TravelFee, BankSettings, ContactSettings } from "@/types/pricing";
import {
  initialPricingSettings,
  initialContactSettings,
  initialBankSettings,
  initialTravelFees,
  initialProducts,
  initialPackages,
} from "../../../scripts/seed-data";

interface LocalStoreData {
  products: Product[];
  packages: Package[];
  pricing: PricingSettings;
  travelFees: TravelFee[];
  contact: ContactSettings;
  bank: BankSettings;
  users: any[];
}

const localDataPath = path.join(process.cwd(), ".data", "local-seed.json");

export function getLocalFallbackData(): LocalStoreData {
  try {
    if (fs.existsSync(localDataPath)) {
      const content = fs.readFileSync(localDataPath, "utf-8");
      const parsed = JSON.parse(content);
      return {
        products: parsed.products || initialProducts,
        packages: parsed.packages || initialPackages,
        pricing: parsed.pricing || initialPricingSettings,
        travelFees: parsed.travelFees || initialTravelFees,
        contact: parsed.contact || initialContactSettings,
        bank: parsed.bank || initialBankSettings,
        users: parsed.users || [
          {
            uid: "admin-demo-id",
            email: "admin@cosoavl.com",
            nombre: "Admin Principal",
            role: "admin",
            activo: true,
            createdAt: new Date().toISOString(),
          },
          {
            uid: "vendedor-demo-id",
            email: "vendedor@cosoavl.com",
            nombre: "Carlos Vendedor",
            role: "vendedor",
            activo: true,
            topeDescuento: 5,
            createdAt: new Date().toISOString(),
          },
        ],
      };
    }
  } catch (e) {
    console.warn("No se pudo leer local-seed.json, usando valores iniciales en memoria.", e);
  }

  return {
    products: initialProducts,
    packages: initialPackages,
    pricing: initialPricingSettings,
    travelFees: initialTravelFees,
    contact: initialContactSettings,
    bank: initialBankSettings,
    users: [
      {
        uid: "admin-demo-id",
        email: "admin@cosoavl.com",
        nombre: "Admin Principal",
        role: "admin",
        activo: true,
        createdAt: new Date().toISOString(),
      },
      {
        uid: "vendedor-demo-id",
        email: "vendedor@cosoavl.com",
        nombre: "Carlos Vendedor",
        role: "vendedor",
        activo: true,
        topeDescuento: 5,
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

export function saveLocalFallbackData(data: Partial<LocalStoreData>) {
  try {
    const current = getLocalFallbackData();
    const updated = { ...current, ...data };
    const dir = path.dirname(localDataPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(localDataPath, JSON.stringify(updated, null, 2), "utf-8");
  } catch (e) {
    console.warn("No se pudo guardar local-seed.json:", e);
  }
}
