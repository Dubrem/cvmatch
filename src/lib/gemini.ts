import { GoogleGenerativeAI } from "@google/generative-ai";
import type { MatchResult, PerfilEgresado } from "./types";

const SYSTEM_PROMPT = `Rol: Reclutador Senior y Experto en Sistemas ATS.
Tarea: Recibes el perfil de un egresado/estudiante y el texto de una vacante laboral. Debes analizar la compatibilidad entre ambos como lo haría un sistema ATS real, y devolver EXCLUSIVAMENTE un objeto JSON válido (sin markdown, sin backticks, sin texto adicional) con esta forma exacta:

{
  "match_percentage": number (0-100),
  "key_matches": string[] (puntos donde el perfil encaja perfectamente con la vacante),
  "gaps_and_recommendations": [{ "brecha": string, "recomendacion": string }],
  "optimized_cv_content": {
    "resumen_ejecutivo": string (2-3 líneas, en primera persona implícita, con verbos de acción),
    "experiencia": [{ "titulo": string, "bullets": string[] (redactados con verbos de acción y palabras clave de la vacante) }],
    "habilidades_destacadas": string[],
    "educacion": string[]
  },
  "vacantes_sugeridas": [{ "titulo": string, "empresa": string, "ubicacion": string }] (3 vacantes similares plausibles para la zona/industria del candidato)
}

Sé honesto con el porcentaje: no todo debe ser alto. Usa palabras clave literales de la vacante cuando el candidato las cumpla.`;

function buildUserPrompt(perfil: PerfilEgresado, vacante: string) {
  return `PERFIL DEL CANDIDATO (JSON):\n${JSON.stringify(perfil, null, 2)}\n\nTEXTO DE LA VACANTE OBJETIVO:\n"""${vacante}"""\n\nDevuelve únicamente el JSON solicitado.`;
}

function extractJson(text: string): unknown {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No se encontró JSON en la respuesta del modelo");
  return JSON.parse(cleaned.slice(start, end + 1));
}

function fallbackResult(perfil: PerfilEgresado, vacante: string): MatchResult {
  const vacanteLower = vacante.toLowerCase();
  const matchedSkills = perfil.habilidades.filter((h) => vacanteLower.includes(h.toLowerCase()));
  const percentage = Math.min(
    95,
    Math.max(35, Math.round((matchedSkills.length / Math.max(perfil.habilidades.length, 1)) * 100))
  );

  return {
    match_percentage: percentage,
    key_matches:
      matchedSkills.length > 0
        ? matchedSkills.map((s) => `Tu experiencia con ${s} coincide con lo solicitado en la vacante.`)
        : ["Tu perfil académico y disposición para aprender son un buen punto de partida para esta vacante."],
    gaps_and_recommendations: [
      {
        brecha: "El modo demostración no tiene acceso al análisis completo de IA.",
        recomendacion: "Configura GEMINI_API_KEY en el servidor para obtener un análisis real y detallado.",
      },
    ],
    optimized_cv_content: {
      resumen_ejecutivo:
        perfil.resumen || "Egresado con formación sólida y disposición para aportar valor desde el primer día.",
      experiencia: perfil.experiencia.map((e) => ({
        titulo: `${e.puesto} — ${e.empresa}`,
        bullets: e.descripcion
          .split(/\n|\. /)
          .filter(Boolean)
          .map((b) => b.trim()),
      })),
      habilidades_destacadas: perfil.habilidades,
      educacion: perfil.educacion.map((e) => `${e.titulo} — ${e.institucion} (${e.periodo})`),
    },
    vacantes_sugeridas: [
      { titulo: "Analista Junior", empresa: "Empresa Local S.A.", ubicacion: perfil.ciudad || "Tu ciudad" },
      { titulo: "Trainee de Operaciones", empresa: "Grupo Regional", ubicacion: perfil.ciudad || "Tu ciudad" },
      { titulo: "Asistente de Proyectos", empresa: "Consultora Asociada", ubicacion: perfil.ciudad || "Tu ciudad" },
    ],
  };
}

export async function analizarMatch(perfil: PerfilEgresado, vacante: string): Promise<MatchResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return fallbackResult(perfil, vacante);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await model.generateContent(buildUserPrompt(perfil, vacante));
    const text = result.response.text();
    const parsed = extractJson(text) as MatchResult;
    return parsed;
  } catch (error) {
    console.error("Error al llamar a Gemini, usando resultado de respaldo:", error);
    return fallbackResult(perfil, vacante);
  }
}
