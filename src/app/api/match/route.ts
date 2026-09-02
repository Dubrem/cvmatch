import { NextRequest, NextResponse } from "next/server";
import { analizarMatch } from "@/lib/gemini";
import type { MatchRequestBody } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as MatchRequestBody;

    if (!body?.perfil || !body?.vacante || body.vacante.trim().length < 20) {
      return NextResponse.json(
        { error: "Perfil incompleto o descripción de vacante demasiado corta." },
        { status: 400 }
      );
    }

    const resultado = await analizarMatch(body.perfil, body.vacante);
    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Error en /api/match:", error);
    return NextResponse.json({ error: "No se pudo procesar el análisis." }, { status: 500 });
  }
}
