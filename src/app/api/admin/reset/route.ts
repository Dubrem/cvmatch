import { NextRequest, NextResponse } from "next/server";
import { sesionValida } from "@/lib/adminAuth";
import { resetearDatos } from "@/lib/db";

export async function POST(req: NextRequest) {
  if (!sesionValida(req)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    await resetearDatos();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error al resetear datos:", error);
    return NextResponse.json({ error: "No se pudo borrar la información." }, { status: 500 });
  }
}
