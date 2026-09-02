import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, generarTokenSesion, validarPassword } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (typeof password !== "string" || !validarPassword(password)) {
    return NextResponse.json({ error: "Contraseña incorrecta." }, { status: 401 });
  }

  const token = generarTokenSesion();
  if (!token) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD no está configurada en el servidor." },
      { status: 500 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
