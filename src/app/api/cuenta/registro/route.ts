import { NextRequest, NextResponse } from "next/server";
import { crearUsuario, obtenerUsuarioPorCorreo } from "@/lib/db";
import { generarTokenUsuario, hashPassword, USER_COOKIE_NAME } from "@/lib/userAuth";

export async function POST(req: NextRequest) {
  try {
    const { nombre, correo, password } = await req.json();

    if (typeof nombre !== "string" || nombre.trim().length < 2) {
      return NextResponse.json({ error: "Ingresa tu nombre completo." }, { status: 400 });
    }
    if (typeof correo !== "string" || !correo.includes("@")) {
      return NextResponse.json({ error: "Ingresa un correo válido." }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres." },
        { status: 400 }
      );
    }

    const existente = await obtenerUsuarioPorCorreo(correo);
    if (existente) {
      return NextResponse.json({ error: "Ya existe una cuenta con ese correo." }, { status: 409 });
    }

    const usuario = await crearUsuario(nombre.trim(), correo, hashPassword(password));

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
    console.error("Error en registro:", error);
    return NextResponse.json({ error: "No se pudo crear tu cuenta." }, { status: 500 });
  }
}
