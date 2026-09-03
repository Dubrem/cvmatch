"use client";

import { X } from "lucide-react";
import type { MatchResult, PerfilEgresado } from "@/lib/types";

interface Props {
  perfil: PerfilEgresado;
  resultado: MatchResult;
  onClose: () => void;
}

function Watermark() {
  const filas = Array.from({ length: 10 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.08]">
      <div className="flex -translate-x-10 -rotate-[28deg] flex-col gap-10">
        {filas.map((_, i) => (
          <div key={i} className="flex gap-10 whitespace-nowrap">
            {Array.from({ length: 6 }).map((_, j) => (
              <span key={j} className="text-3xl font-extrabold uppercase tracking-widest text-navy">
                MatchCV · Vista previa
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CvPreviewModal({ perfil, resultado, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 px-4 py-8 backdrop-blur-sm">
      <div className="relative flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h3 className="font-bold text-navy">Vista previa</h3>
            <p className="text-xs text-muted">
              Con marca de agua — descarga tu CV para obtener el PDF limpio.
            </p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-navy" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div className="relative overflow-y-auto p-8">
          <Watermark />

          <div className="relative space-y-6 text-navy">
            <div>
              <h4 className="text-xl font-bold">{perfil.nombre || "Nombre del candidato"}</h4>
              <p className="text-xs text-muted">
                {[perfil.email, perfil.telefono, perfil.ciudad].filter(Boolean).join("  |  ")}
              </p>
            </div>

            <div>
              <h5 className="border-b border-border pb-1 text-xs font-bold uppercase tracking-wide text-cyan">
                Resumen ejecutivo
              </h5>
              <p className="mt-2 text-sm leading-relaxed text-navy-light">
                {resultado.optimized_cv_content.resumen_ejecutivo}
              </p>
            </div>

            <div>
              <h5 className="border-b border-border pb-1 text-xs font-bold uppercase tracking-wide text-cyan">
                Experiencia
              </h5>
              <div className="mt-2 space-y-4">
                {resultado.optimized_cv_content.experiencia.map((exp, i) => (
                  <div key={i}>
                    <p className="text-sm font-semibold">{exp.titulo}</p>
                    <ul className="mt-1 space-y-1">
                      {exp.bullets.map((b, j) => (
                        <li key={j} className="text-sm text-navy-light">
                          • {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h5 className="border-b border-border pb-1 text-xs font-bold uppercase tracking-wide text-cyan">
                Habilidades destacadas
              </h5>
              <ul className="mt-2 space-y-1">
                {resultado.optimized_cv_content.habilidades_destacadas.map((h, i) => (
                  <li key={i} className="text-sm text-navy-light">
                    • {h}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="border-b border-border pb-1 text-xs font-bold uppercase tracking-wide text-cyan">
                Educación
              </h5>
              <ul className="mt-2 space-y-1">
                {resultado.optimized_cv_content.educacion.map((e, i) => (
                  <li key={i} className="text-sm text-navy-light">
                    {e}
                  </li>
                ))}
              </ul>
            </div>

            {resultado.optimized_cv_content.idiomas.length > 0 && (
              <div>
                <h5 className="border-b border-border pb-1 text-xs font-bold uppercase tracking-wide text-cyan">
                  Idiomas
                </h5>
                <ul className="mt-2 space-y-1">
                  {resultado.optimized_cv_content.idiomas.map((idi, i) => (
                    <li key={i} className="text-sm text-navy-light">
                      • {idi}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
