import { NextRequest, NextResponse } from "next/server";
import { registrarDonante } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { nombre, correo } = await req.json();

    if (typeof nombre !== "string" || nombre.trim().length < 2) {
      return NextResponse.json({ error: "Ingresa tu nombre." }, { status: 400 });
    }
    if (typeof correo !== "string" || !correo.includes("@")) {
      return NextResponse.json({ error: "Ingresa un correo válido." }, { status: 400 });
    }

    await registrarDonante(nombre.trim(), correo.trim());
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error al registrar donante:", error);
    return NextResponse.json({ error: "No se pudo registrar tu donativo." }, { status: 500 });
  }
}
