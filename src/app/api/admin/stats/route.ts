import { NextRequest, NextResponse } from "next/server";
import { sesionValida } from "@/lib/adminAuth";
import { obtenerEstadisticas } from "@/lib/db";

export async function GET(req: NextRequest) {
  if (!sesionValida(req)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const stats = await obtenerEstadisticas();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    return NextResponse.json({ error: "No se pudieron cargar las estadísticas." }, { status: 500 });
  }
}
