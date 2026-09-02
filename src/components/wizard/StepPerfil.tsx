"use client";

import { useState } from "react";
import { Plus, Trash2, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import type { PerfilEgresado } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-navy placeholder:text-slate-400 focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20";
const labelClass = "mb-1.5 block text-sm font-medium text-navy-light";
const aiButtonClass =
  "flex items-center gap-1 text-xs font-semibold text-mint hover:text-mint-light disabled:cursor-not-allowed disabled:opacity-50";

interface Props {
  perfil: PerfilEgresado;
  onChange: (perfil: PerfilEgresado) => void;
  onNext: () => void;
}

export default function StepPerfil({ perfil, onChange, onNext }: Props) {
  const [mejorandoResumen, setMejorandoResumen] = useState(false);
  const [mejorandoExperienciaId, setMejorandoExperienciaId] = useState<string | null>(null);
  const [errorIa, setErrorIa] = useState<string | null>(null);

  const update = <K extends keyof PerfilEgresado>(key: K, value: PerfilEgresado[K]) => {
    onChange({ ...perfil, [key]: value });
  };

  const handleMejorarResumen = async () => {
    setMejorandoResumen(true);
    setErrorIa(null);
    try {
      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "resumen",
          borrador: perfil.resumen,
          habilidades: perfil.habilidades,
          educacion: perfil.educacion,
          experiencia: perfil.experiencia,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorIa(data.error ?? "No se pudo mejorar el resumen.");
        return;
      }
      update("resumen", data.resultado);
    } catch {
      setErrorIa("Ocurrió un error de conexión. Intenta de nuevo.");
    } finally {
      setMejorandoResumen(false);
    }
  };

  const handleMejorarExperiencia = async (id: string) => {
    const exp = perfil.experiencia.find((e) => e.id === id);
    if (!exp) return;

    setMejorandoExperienciaId(id);
    setErrorIa(null);
    try {
      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "experiencia",
          puesto: exp.puesto,
          empresa: exp.empresa,
          texto: exp.descripcion,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorIa(data.error ?? "No se pudo mejorar esta experiencia.");
        return;
      }
      const next = perfil.experiencia.map((e) =>
        e.id === id ? { ...e, descripcion: data.resultado } : e
      );
      update("experiencia", next);
    } catch {
      setErrorIa("Ocurrió un error de conexión. Intenta de nuevo.");
    } finally {
      setMejorandoExperienciaId(null);
    }
  };

  const addEducacion = () => {
    update("educacion", [
      ...perfil.educacion,
      { id: crypto.randomUUID(), titulo: "", institucion: "", periodo: "" },
    ]);
  };

  const addExperiencia = () => {
    update("experiencia", [
      ...perfil.experiencia,
      { id: crypto.randomUUID(), puesto: "", empresa: "", periodo: "", descripcion: "" },
    ]);
  };

  const isValid =
    perfil.nombre.trim().length > 1 &&
    perfil.email.trim().length > 3 &&
    perfil.habilidades.length > 0;

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-2xl font-bold text-navy">Cuéntanos sobre ti</h2>
      <p className="mt-1 text-sm text-muted">
        Esta información se usará para calcular tu match y generar tu CV optimizado.
      </p>

      <div className="mt-8 space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Nombre completo *</label>
            <input
              className={inputClass}
              value={perfil.nombre}
              onChange={(e) => update("nombre", e.target.value)}
              placeholder="Ej. María Fernanda López"
            />
          </div>
          <div>
            <label className={labelClass}>Correo electrónico *</label>
            <input
              className={inputClass}
              type="email"
              value={perfil.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="tucorreo@ejemplo.com"
            />
          </div>
          <div>
            <label className={labelClass}>Teléfono</label>
            <input
              className={inputClass}
              value={perfil.telefono}
              onChange={(e) => update("telefono", e.target.value)}
              placeholder="55 1234 5678"
            />
          </div>
          <div>
            <label className={labelClass}>Ciudad</label>
            <input
              className={inputClass}
              value={perfil.ciudad}
              onChange={(e) => update("ciudad", e.target.value)}
              placeholder="Ciudad de México"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className={labelClass}>Resumen profesional</label>
            <button
              type="button"
              onClick={handleMejorarResumen}
              disabled={mejorandoResumen}
              className={aiButtonClass}
            >
              {mejorandoResumen ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Sparkles size={14} />
              )}
              Mejorar con IA
            </button>
          </div>
          <textarea
            className={inputClass}
            rows={3}
            value={perfil.resumen}
            onChange={(e) => update("resumen", e.target.value)}
            placeholder="Escribe algunas palabras clave (ej. 'analista de datos, egresado, trabajo en equipo') y deja que la IA lo redacte por ti."
          />
        </div>

        {errorIa && (
          <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{errorIa}</p>
        )}

        <div>
          <label className={labelClass}>Habilidades * (separadas por coma)</label>
          <input
            className={inputClass}
            value={perfil.habilidades.join(", ")}
            onChange={(e) =>
              update(
                "habilidades",
                e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
              )
            }
            placeholder="Excel, Power BI, Trabajo en equipo, SQL"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className={labelClass}>Educación</label>
            <button
              type="button"
              onClick={addEducacion}
              className="flex items-center gap-1 text-xs font-semibold text-cyan hover:text-cyan-light"
            >
              <Plus size={14} /> Agregar
            </button>
          </div>
          <div className="space-y-3">
            {perfil.educacion.map((edu, i) => (
              <div key={edu.id} className="rounded-lg border border-border p-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <input
                    className={inputClass}
                    placeholder="Título / carrera"
                    value={edu.titulo}
                    onChange={(e) => {
                      const next = [...perfil.educacion];
                      next[i] = { ...edu, titulo: e.target.value };
                      update("educacion", next);
                    }}
                  />
                  <input
                    className={inputClass}
                    placeholder="Institución"
                    value={edu.institucion}
                    onChange={(e) => {
                      const next = [...perfil.educacion];
                      next[i] = { ...edu, institucion: e.target.value };
                      update("educacion", next);
                    }}
                  />
                  <input
                    className={inputClass}
                    placeholder="Periodo (2020-2024)"
                    value={edu.periodo}
                    onChange={(e) => {
                      const next = [...perfil.educacion];
                      next[i] = { ...edu, periodo: e.target.value };
                      update("educacion", next);
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    update("educacion", perfil.educacion.filter((_, idx) => idx !== i))
                  }
                  className="mt-2 flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
                >
                  <Trash2 size={12} /> Eliminar
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className={labelClass}>Experiencia / Prácticas profesionales</label>
            <button
              type="button"
              onClick={addExperiencia}
              className="flex items-center gap-1 text-xs font-semibold text-cyan hover:text-cyan-light"
            >
              <Plus size={14} /> Agregar
            </button>
          </div>
          <div className="space-y-3">
            {perfil.experiencia.map((exp, i) => (
              <div key={exp.id} className="rounded-lg border border-border p-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <input
                    className={inputClass}
                    placeholder="Puesto"
                    value={exp.puesto}
                    onChange={(e) => {
                      const next = [...perfil.experiencia];
                      next[i] = { ...exp, puesto: e.target.value };
                      update("experiencia", next);
                    }}
                  />
                  <input
                    className={inputClass}
                    placeholder="Empresa"
                    value={exp.empresa}
                    onChange={(e) => {
                      const next = [...perfil.experiencia];
                      next[i] = { ...exp, empresa: e.target.value };
                      update("experiencia", next);
                    }}
                  />
                  <input
                    className={inputClass}
                    placeholder="Periodo"
                    value={exp.periodo}
                    onChange={(e) => {
                      const next = [...perfil.experiencia];
                      next[i] = { ...exp, periodo: e.target.value };
                      update("experiencia", next);
                    }}
                  />
                </div>
                <textarea
                  className={`${inputClass} mt-2`}
                  rows={3}
                  placeholder={"Escribe una idea por línea, aunque sean solo palabras clave. Ej:\ncoordinación de transporte\ntrabajé en ventas de transporte"}
                  value={exp.descripcion}
                  onChange={(e) => {
                    const next = [...perfil.experiencia];
                    next[i] = { ...exp, descripcion: e.target.value };
                    update("experiencia", next);
                  }}
                />
                <div className="mt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleMejorarExperiencia(exp.id)}
                    disabled={mejorandoExperienciaId === exp.id || !exp.descripcion.trim()}
                    className={aiButtonClass}
                  >
                    {mejorandoExperienciaId === exp.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Sparkles size={14} />
                    )}
                    Mejorar con IA
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      update("experiencia", perfil.experiencia.filter((_, idx) => idx !== i))
                    }
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
                  >
                    <Trash2 size={12} /> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>Proyectos destacados</label>
          <textarea
            className={inputClass}
            rows={2}
            value={perfil.proyectos}
            onChange={(e) => update("proyectos", e.target.value)}
            placeholder="Proyectos escolares, personales o de investigación relevantes."
          />
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          disabled={!isValid}
          onClick={onNext}
          className="flex items-center gap-2 rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-white transition hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-40"
        >
          Continuar <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
