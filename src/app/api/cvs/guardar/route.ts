import { NextRequest, NextResponse } from "next/server";
import { guardarCvGenerado } from "@/lib/db";
import { usuarioIdDeSesion } from "@/lib/userAuth";

export async function POST(req: NextRequest) {
  const usuarioId = usuarioIdDeSesion(req);
  if (!usuarioId) {
    return NextResponse.json({ ok: false, motivo: "no_autenticado" });
  }

  try {
    const { perfil, resultado } = await req.json();
    await guardarCvGenerado(usuarioId, perfil, resultado);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error al guardar CV:", error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
