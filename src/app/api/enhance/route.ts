import { NextRequest, NextResponse } from "next/server";
import { mejorarExperiencia, mejorarResumen } from "@/lib/gemini";
import type { EducationItem, ExperienceItem } from "@/lib/types";

interface ExperienciaBody {
  tipo: "experiencia";
  puesto: string;
  empresa: string;
  texto: string;
}

interface ResumenBody {
  tipo: "resumen";
  borrador: string;
  habilidades: string[];
  educacion: EducationItem[];
  experiencia: ExperienceItem[];
}

type EnhanceBody = ExperienciaBody | ResumenBody;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as EnhanceBody;

    if (body.tipo === "experiencia") {
      if (!body.texto || body.texto.trim().length < 3) {
        return NextResponse.json(
          { error: "Escribe al menos una palabra clave sobre tus responsabilidades." },
          { status: 400 }
        );
      }
      const resultado = await mejorarExperiencia(body.puesto, body.empresa, body.texto);
      return NextResponse.json({ resultado });
    }

    if (body.tipo === "resumen") {
      const resultado = await mejorarResumen(
        body.borrador,
        body.habilidades,
        body.educacion,
        body.experiencia
      );
      return NextResponse.json({ resultado });
    }

    return NextResponse.json({ error: "Tipo de mejora no reconocido." }, { status: 400 });
  } catch (error) {
    console.error("Error en /api/enhance:", error);
    return NextResponse.json({ error: "No se pudo generar la mejora." }, { status: 500 });
  }
}
