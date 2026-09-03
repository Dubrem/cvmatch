import { NextRequest, NextResponse } from "next/server";
import { sesionValida } from "@/lib/adminAuth";
import { aprobarSolicitudTransferencia } from "@/lib/db";

export async function POST(req: NextRequest) {
  if (!sesionValida(req)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    const idNumerico = Number(id);
    if (!Number.isFinite(idNumerico)) {
      return NextResponse.json({ error: "id inválido." }, { status: 400 });
    }

    const resultado = await aprobarSolicitudTransferencia(idNumerico);
    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Error al aprobar transferencia:", error);
    return NextResponse.json({ error: "No se pudo aprobar la solicitud." }, { status: 500 });
  }
}
