import { NextRequest, NextResponse } from "next/server";
import { registrarSolicitudTransferencia } from "@/lib/db";

const MONTO_PAQUETE = 9900;

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Ingresa un correo válido." }, { status: 400 });
    }

    await registrarSolicitudTransferencia(email, MONTO_PAQUETE);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error al registrar solicitud de transferencia:", error);
    return NextResponse.json({ error: "No se pudo registrar tu solicitud." }, { status: 500 });
  }
}
