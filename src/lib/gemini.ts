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
    "habilidades_destacadas": string[] (IMPORTANTE: cada elemento del arreglo debe ser UNA sola habilidad, nunca una lista de varias habilidades separadas por comas dentro del mismo string),
    "educacion": string[],
    "idiomas": string[] (cada elemento como "Inglés — Avanzado"; arreglo vacío si el candidato no reportó idiomas)
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

function normalizarLista(items: string[] | undefined | null): string[] {
  if (!Array.isArray(items)) return [];
  return items
    .flatMap((item) => (typeof item === "string" ? item.split(",") : []))
    .map((item) => item.trim())
    .filter(Boolean);
}

function esErrorTransitorio(error: unknown): boolean {
  const status = (error as { status?: number })?.status;
  return status === 503 || status === 429;
}

async function conReintentos<T>(fn: () => Promise<T>, intentos = 3): Promise<T> {
  let ultimoError: unknown;
  for (let i = 0; i < intentos; i++) {
    try {
      return await fn();
    } catch (error) {
      ultimoError = error;
      if (!esErrorTransitorio(error) || i === intentos - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** i));
    }
  }
  throw ultimoError;
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
      idiomas: perfil.idiomas.map((i) => `${i.idioma} — ${i.nivel}`),
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
      model: "gemini-3.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await conReintentos(() => model.generateContent(buildUserPrompt(perfil, vacante)));
    const text = result.response.text();
    const parsed = extractJson(text) as MatchResult;

    parsed.optimized_cv_content.habilidades_destacadas = normalizarLista(
      parsed.optimized_cv_content.habilidades_destacadas
    );
    parsed.optimized_cv_content.educacion = normalizarLista(parsed.optimized_cv_content.educacion);
    parsed.optimized_cv_content.idiomas = normalizarLista(parsed.optimized_cv_content.idiomas);

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

const RESPALDO_MARCADOR = "aportando organización";

function fallbackBullet(line: string): string {
  const trimmed = line.trim().replace(/^[•\-*]\s*/, "");
  if (!trimmed) return "";
  const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);

  if (capitalized.toLowerCase().includes(RESPALDO_MARCADOR)) {
    return capitalized.endsWith(".") ? capitalized : `${capitalized}.`;
  }

  const sinPunto = capitalized.replace(/\.+$/, "");
  return `${sinPunto}, ${RESPALDO_MARCADOR}, atención al detalle y trabajo en equipo a los resultados del área.`;
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
      model: "gemini-3.5-flash",
      systemInstruction: EXPERIENCIA_SYSTEM_PROMPT,
    });

    const prompt = `Puesto: ${puesto || "(sin especificar)"}\nEmpresa: ${empresa || "(sin especificar)"}\nLíneas del candidato:\n${texto}`;
    const result = await conReintentos(() => model.generateContent(prompt));
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

const RESPALDO_ACTITUD = "actitud proactiva y capacidad de aprendizaje rápido";

function fallbackMejorarResumen(
  borrador: string,
  habilidades: string[],
  educacion: EducationItem[]
): string {
  let base = borrador.trim() || "Recién egresado con disposición para aportar valor desde el primer día";
  base = base.charAt(0).toUpperCase() + base.slice(1).replace(/\.+$/, "");
  base = `${base}.`;

  const baseLower = base.toLowerCase();
  const extras: string[] = [];

  const educacionTitulo = educacion[0]?.titulo?.trim();
  if (educacionTitulo && !baseLower.includes(educacionTitulo.toLowerCase())) {
    extras.push(`formación en ${educacionTitulo}`);
  }

  const habilidadesFaltantes = habilidades
    .slice(0, 4)
    .filter((h) => h.trim() && !baseLower.includes(h.toLowerCase()));
  if (habilidadesFaltantes.length > 0) {
    extras.push(`habilidades en ${habilidadesFaltantes.join(", ")}`);
  }

  if (!baseLower.includes("actitud proactiva")) {
    extras.push(RESPALDO_ACTITUD);
  }

  if (extras.length === 0) return base;
  return `${base} Cuenta con ${extras.join(" y ")}.`;
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
      model: "gemini-3.5-flash",
      systemInstruction: RESUMEN_SYSTEM_PROMPT,
    });

    const prompt = `Resumen borrador del candidato: "${borrador || "(vacío, sin pistas)"}"\nHabilidades: ${habilidades.join(", ") || "(ninguna)"}\nEducación: ${JSON.stringify(educacion)}\nExperiencia: ${JSON.stringify(experiencia)}`;
    const result = await conReintentos(() => model.generateContent(prompt));
    const parsed = extractJson(result.response.text()) as { resumen: string };
    return parsed.resumen;
  } catch (error) {
    console.error("Error al mejorar resumen con Gemini, usando respaldo:", error);
    return fallbackMejorarResumen(borrador, habilidades, educacion);
  }
}
