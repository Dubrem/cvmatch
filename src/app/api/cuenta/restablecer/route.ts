import { NextRequest, NextResponse } from "next/server";
import { actualizarPassword, validarCodigoRecuperacion } from "@/lib/db";
import { generarTokenUsuario, hashPassword, USER_COOKIE_NAME } from "@/lib/userAuth";

export async function POST(req: NextRequest) {
  try {
    const { telefono, codigo, password } = await req.json();

    if (typeof telefono !== "string" || typeof codigo !== "string") {
      return NextResponse.json({ error: "Faltan datos." }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "La nueva contraseña debe tener al menos 6 caracteres." },
        { status: 400 }
      );
    }

    const usuario = await validarCodigoRecuperacion(telefono, codigo);
    if (!usuario) {
      return NextResponse.json(
        { error: "Código incorrecto, ya usado o expirado (dura 30 minutos)." },
        { status: 400 }
      );
    }

    await actualizarPassword(usuario.id, hashPassword(password));

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
    console.error("Error al restablecer contraseña:", error);
    return NextResponse.json({ error: "No se pudo restablecer tu contraseña." }, { status: 500 });
  }
}
