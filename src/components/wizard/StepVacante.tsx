"use client";

import { ArrowLeft, Loader2, Sparkles } from "lucide-react";

interface Props {
  vacante: string;
  onChange: (value: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
}

export default function StepVacante({ vacante, onChange, onBack, onSubmit, loading, error }: Props) {
  const isValid = vacante.trim().length >= 20;

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-2xl font-bold text-navy">¿Qué vacante quieres conseguir?</h2>
      <p className="mt-1 text-sm text-muted">
        Pega el texto completo de la oferta laboral (requisitos, responsabilidades, habilidades deseadas).
      </p>

      <textarea
        className="mt-6 w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-navy placeholder:text-slate-400 focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20"
        rows={12}
        value={vacante}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Pega aquí la descripción completa de la vacante..."
      />
      <p className="mt-1 text-right text-xs text-muted">{vacante.length} caracteres</p>

      {error && (
        <p className="mt-2 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={onBack}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-border px-5 py-3 text-sm font-semibold text-navy-light transition hover:bg-slate-50 disabled:opacity-40"
        >
          <ArrowLeft size={16} /> Atrás
        </button>
        <button
          disabled={!isValid || loading}
          onClick={onSubmit}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan to-mint px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Analizando...
            </>
          ) : (
            <>
              <Sparkles size={16} /> Analizar mi match
            </>
          )}
        </button>
      </div>
    </div>
  );
}
