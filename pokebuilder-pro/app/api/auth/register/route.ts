import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = createServerClient();

  let body: { email: string; password: string; username?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { email, password, username } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email y contraseña son requeridos", code: "VALIDATION" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 6 caracteres", code: "VALIDATION" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: { username: username?.trim() ?? "" },
    },
  });

  if (error) {
    return NextResponse.json(
      { error: error.message, code: "AUTH_ERROR" },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { user: { id: data.user?.id, email: data.user?.email } },
    { status: 201 }
  );
}
