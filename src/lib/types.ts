export interface ExperienceItem {
  id: string;
  puesto: string;
  empresa: string;
  periodo: string;
  descripcion: string;
}

export interface EducationItem {
  id: string;
  titulo: string;
  institucion: string;
  periodo: string;
}

export interface PerfilEgresado {
  nombre: string;
  email: string;
  telefono: string;
  ciudad: string;
  resumen: string;
  habilidades: string[];
  educacion: EducationItem[];
  experiencia: ExperienceItem[];
  proyectos: string;
}

export interface MatchResult {
  match_percentage: number;
  key_matches: string[];
  gaps_and_recommendations: { brecha: string; recomendacion: string }[];
  optimized_cv_content: {
    resumen_ejecutivo: string;
    experiencia: { titulo: string; bullets: string[] }[];
    habilidades_destacadas: string[];
    educacion: string[];
  };
  vacantes_sugeridas: { titulo: string; empresa: string; ubicacion: string }[];
}

export interface MatchRequestBody {
  perfil: PerfilEgresado;
  vacante: string;
}
