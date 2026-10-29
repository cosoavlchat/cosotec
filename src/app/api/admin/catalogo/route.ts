import { NextRequest, NextResponse } from "next/server";
import {
  getProducts,
  saveProduct,
  toggleProductStatus,
  getPackages,
  savePackage,
  togglePackageStatus,
} from "@/lib/services/catalog-service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // "products" | "packages" | "all"

    if (type === "packages") {
      const packages = await getPackages(true);
      return NextResponse.json({ packages });
    }

    if (type === "products") {
      const products = await getProducts(true);
      return NextResponse.json({ products });
    }

    const [products, packages] = await Promise.all([getProducts(true), getPackages(true)]);
    return NextResponse.json({ products, packages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { entity, data, user = { uid: "admin-session", email: "admin@cosoavl.com" } } = body;

    if (entity === "package") {
      const saved = await savePackage(data, user);
      return NextResponse.json({ success: true, package: saved });
    }

    // Por defecto es producto
    const saved = await saveProduct(data, user);
    return NextResponse.json({ success: true, product: saved });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al guardar en el catálogo", details: error.errors },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { entity, slug, activo, user = { uid: "admin-session", email: "admin@cosoavl.com" } } = body;

    if (!slug || typeof activo !== "boolean") {
      return NextResponse.json({ error: "slug y activo son obligatorios" }, { status: 400 });
    }

    if (entity === "package") {
      await togglePackageStatus(slug, activo, user);
      return NextResponse.json({ success: true, slug, activo });
    }

    await toggleProductStatus(slug, activo, user);
    return NextResponse.json({ success: true, slug, activo });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
