import { NextRequest, NextResponse } from "next/server";
import { crearCodigoRecuperacion, obtenerUsuarioPorTelefono } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { telefono } = await req.json();

    if (typeof telefono !== "string" || telefono.replace(/\D/g, "").length < 10) {
      return NextResponse.json({ error: "Ingresa un número de WhatsApp válido." }, { status: 400 });
    }

    const usuario = await obtenerUsuarioPorTelefono(telefono);
    if (usuario) {
      await crearCodigoRecuperacion(usuario.id);
    }

    // Respondemos igual exista o no la cuenta, para no revelar qué números están registrados.
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error al solicitar recuperación:", error);
    return NextResponse.json({ error: "No se pudo procesar tu solicitud." }, { status: 500 });
  }
}
