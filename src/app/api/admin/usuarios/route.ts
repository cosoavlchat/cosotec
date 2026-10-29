import { NextRequest, NextResponse } from "next/server";
import { getUsers, createUser, updateUserRole } from "@/lib/services/user-service";

export async function GET() {
  try {
    const users = await getUsers();
    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, actor = { uid: "admin-session", email: "admin@cosoavl.com" } } = body;

    const user = await createUser(data, actor);
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al crear usuario", details: error.errors },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, actor = { uid: "admin-session", email: "admin@cosoavl.com" } } = body;

    const updated = await updateUserRole(data, actor);
    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al actualizar rol", details: error.errors },
      { status: 400 }
    );
  }
}
