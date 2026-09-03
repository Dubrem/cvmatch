import { NextRequest, NextResponse } from "next/server";
import { obtenerUsuarioPorTelefono } from "@/lib/db";
import { generarTokenUsuario, USER_COOKIE_NAME, verifyPassword } from "@/lib/userAuth";

export async function POST(req: NextRequest) {
  try {
    const { telefono, password } = await req.json();

    if (typeof telefono !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Número de WhatsApp y contraseña son requeridos." },
        { status: 400 }
      );
    }

    const usuario = await obtenerUsuarioPorTelefono(telefono);
    if (!usuario || !verifyPassword(password, usuario.passwordHash)) {
      return NextResponse.json({ error: "Número o contraseña incorrectos." }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(USER_COOKIE_NAME, generarTokenUsuario(usuario.id), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (error) {
    console.error("Error en login:", error);
    return NextResponse.json({ error: "No se pudo iniciar sesión." }, { status: 500 });
  }
}
