import { NextRequest, NextResponse } from "next/server";
import { descontarCredito } from "@/lib/db";
import { usuarioIdDeSesion } from "@/lib/userAuth";

export async function POST(req: NextRequest) {
  const usuarioId = usuarioIdDeSesion(req);
  if (!usuarioId) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const exito = await descontarCredito(usuarioId);
  if (!exito) {
    return NextResponse.json({ error: "No tienes descargas disponibles." }, { status: 402 });
  }

  return NextResponse.json({ ok: true });
}
