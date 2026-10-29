import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/server-auth";
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
  // REGLA 1: Solo rol 'admin' puede crear o editar productos en el catálogo
  const auth = await authenticateServerRequest(req, ["admin"]);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const { entity, data } = body;

    if (entity === "package") {
      const saved = await savePackage(data, auth.user);
      return NextResponse.json({ success: true, package: saved });
    }

    const saved = await saveProduct(data, auth.user);
    return NextResponse.json({ success: true, product: saved });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al guardar en el catálogo", details: error.errors },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  // REGLA 1: Solo rol 'admin' puede cambiar estados o activar/ocultar productos
  const auth = await authenticateServerRequest(req, ["admin"]);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const { entity, slug, activo } = body;

    if (!slug || typeof activo !== "boolean") {
      return NextResponse.json({ error: "slug y activo son obligatorios" }, { status: 400 });
    }

    if (entity === "package") {
      await togglePackageStatus(slug, activo, auth.user);
      return NextResponse.json({ success: true, slug, activo });
    }

    await toggleProductStatus(slug, activo, auth.user);
    return NextResponse.json({ success: true, slug, activo });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}
