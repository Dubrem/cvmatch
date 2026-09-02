import { GoogleGenerativeAI } from "@google/generative-ai";
import type { EducationItem, ExperienceItem, MatchResult, PerfilEgresado } from "./types";

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

const EXPERIENCIA_SYSTEM_PROMPT = `Rol: Redactor experto en CVs optimizados para sistemas ATS.
Recibes el puesto, la empresa y líneas breves o palabras clave escritas por el candidato sobre sus responsabilidades o logros en ese trabajo.
Debes reescribir CADA línea de entrada como una viñeta profesional completa: inicia con verbo de acción en pasado, sé específico, usa palabras clave relevantes al puesto, y transmite impacto real. No inventes cifras exactas ni logros falsos si no se dieron datos; puedes usar términos cualitativos de impacto (ej. "optimizando tiempos de entrega") en vez de números inventados.
Devuelve EXCLUSIVAMENTE un JSON válido (sin markdown, sin backticks) con esta forma:
{ "bullets": string[] }
Debes devolver exactamente una viñeta por cada línea no vacía que te dieron, en el mismo orden.`;

function fallbackBullet(line: string): string {
  const trimmed = line.trim().replace(/^[•\-*]\s*/, "");
  if (!trimmed) return "";
  const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return `${capitalized}, aportando organización, atención al detalle y trabajo en equipo a los resultados del área.`;
}

function fallbackMejorarExperiencia(texto: string): string {
  return texto
    .split("\n")
    .map((line) => fallbackBullet(line))
    .filter(Boolean)
    .join("\n");
}

export async function mejorarExperiencia(
  puesto: string,
  empresa: string,
  texto: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !texto.trim()) {
    return fallbackMejorarExperiencia(texto);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: EXPERIENCIA_SYSTEM_PROMPT,
    });

    const prompt = `Puesto: ${puesto || "(sin especificar)"}\nEmpresa: ${empresa || "(sin especificar)"}\nLíneas del candidato:\n${texto}`;
    const result = await model.generateContent(prompt);
    const parsed = extractJson(result.response.text()) as { bullets: string[] };
    return parsed.bullets.join("\n");
  } catch (error) {
    console.error("Error al mejorar experiencia con Gemini, usando respaldo:", error);
    return fallbackMejorarExperiencia(texto);
  }
}

const RESUMEN_SYSTEM_PROMPT = `Rol: Redactor experto en CVs optimizados para sistemas ATS.
Recibes datos de un candidato (habilidades, educación, experiencia y un resumen borrador que puede ser solo palabras clave o una frase corta).
Debes redactar un resumen profesional robusto de 2 a 3 líneas, en tono profesional, con verbos de acción, destacando fortalezas reales del candidato según los datos dados. NO inventes títulos, empresas, años ni logros que no se mencionen en los datos.
Devuelve EXCLUSIVAMENTE un JSON válido (sin markdown, sin backticks) con esta forma:
{ "resumen": string }`;

function fallbackMejorarResumen(
  borrador: string,
  habilidades: string[],
  educacion: EducationItem[]
): string {
  const habilidadesTexto = habilidades.slice(0, 4).join(", ");
  const educacionTexto = educacion[0]?.titulo || "su formación académica";
  const base = borrador.trim() || "Recién egresado con disposición para aportar valor desde el primer día";
  return `${base}. Cuenta con formación en ${educacionTexto}${
    habilidadesTexto ? ` y habilidades en ${habilidadesTexto}` : ""
  }, con actitud proactiva y capacidad de aprendizaje rápido.`;
}

export async function mejorarResumen(
  borrador: string,
  habilidades: string[],
  educacion: EducationItem[],
  experiencia: ExperienceItem[]
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return fallbackMejorarResumen(borrador, habilidades, educacion);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: RESUMEN_SYSTEM_PROMPT,
    });

    const prompt = `Resumen borrador del candidato: "${borrador || "(vacío, sin pistas)"}"\nHabilidades: ${habilidades.join(", ") || "(ninguna)"}\nEducación: ${JSON.stringify(educacion)}\nExperiencia: ${JSON.stringify(experiencia)}`;
    const result = await model.generateContent(prompt);
    const parsed = extractJson(result.response.text()) as { resumen: string };
    return parsed.resumen;
  } catch (error) {
    console.error("Error al mejorar resumen con Gemini, usando respaldo:", error);
    return fallbackMejorarResumen(borrador, habilidades, educacion);
  }
}
