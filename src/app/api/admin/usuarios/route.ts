import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/server-auth";
import { getUsers, createUser, updateUserRole } from "@/lib/services/user-service";

export async function GET(req: NextRequest) {
  const auth = await authenticateServerRequest(req, ["admin"]);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const users = await getUsers();
    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await authenticateServerRequest(req, ["admin"]);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const { data } = body;

    const user = await createUser(data, auth.user);
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al crear usuario", details: error.errors },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await authenticateServerRequest(req, ["admin"]);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const { data } = body;

    const updated = await updateUserRole(data, auth.user);
    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al actualizar rol", details: error.errors },
      { status: 400 }
    );
  }
}
