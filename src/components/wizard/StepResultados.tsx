"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Download,
  RotateCcw,
  Landmark,
  Loader2,
  LogIn,
  MessageCircle,
} from "lucide-react";
import type { MatchResult, PerfilEgresado } from "@/lib/types";
import { generarCvPdf } from "@/lib/pdf";
import { construirLinkWhatsApp } from "@/lib/config";
import TransferenciaModal from "@/components/TransferenciaModal";

interface Props {
  perfil: PerfilEgresado;
  resultado: MatchResult;
  onRestart: () => void;
}

function scoreColor(pct: number) {
  if (pct >= 75) return { ring: "#10b981", text: "text-mint" };
  if (pct >= 50) return { ring: "#0284c7", text: "text-cyan" };
  return { ring: "#f59e0b", text: "text-amber-500" };
}

export default function StepResultados({ perfil, resultado, onRestart }: Props) {
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [autenticado, setAutenticado] = useState(false);
  const [creditos, setCreditos] = useState(0);
  const [codigoPendiente, setCodigoPendiente] = useState<string | null>(null);
  const [mostrarTransferencia, setMostrarTransferencia] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const color = scoreColor(resultado.match_percentage);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (resultado.match_percentage / 100) * circumference;

  const cargarSesion = () => {
    fetch("/api/cuenta/me")
      .then(async (res) => {
        if (!res.ok) {
          setAutenticado(false);
          return;
        }
        const data = await res.json();
        setAutenticado(true);
        setCreditos(data.creditos ?? 0);
        const pendiente = data.solicitudes?.find(
          (s: { confirmada: boolean; codigo: string }) => !s.confirmada
        );
        setCodigoPendiente(pendiente?.codigo ?? null);
      })
      .catch(() => setAutenticado(false))
      .finally(() => setCargandoSesion(false));
  };

  useEffect(() => {
    cargarSesion();
  }, []);

  const handleDownload = async () => {
    setError(null);
    setDownloading(true);
    try {
      const res = await fetch("/api/cuenta/descargar", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo descargar.");
        return;
      }
      const doc = generarCvPdf(perfil, resultado);
      doc.save(`CV-${perfil.nombre.replace(/\s+/g, "_") || "optimizado"}.pdf`);
      setCreditos((c) => c - 1);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <div className="card-shadow flex flex-col items-center rounded-2xl border border-border bg-surface p-6">
            <svg width="140" height="140" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#e2e8f0" strokeWidth="10" />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke={color.ring}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform="rotate(-90 60 60)"
              />
              <text
                x="60"
                y="66"
                textAnchor="middle"
                fontSize="24"
                fontWeight="bold"
                fill="#0f172a"
              >
                {resultado.match_percentage}%
              </text>
            </svg>
            <p className={`mt-2 text-sm font-semibold ${color.text}`}>Porcentaje de match</p>
          </div>

          <div className="card-shadow rounded-2xl border border-border bg-surface p-6">
            <h3 className="flex items-center gap-2 text-sm font-bold text-navy">
              <CheckCircle2 size={16} className="text-mint" /> Puntos a favor
            </h3>
            <ul className="mt-3 space-y-2">
              {resultado.key_matches.map((k, i) => (
                <li key={i} className="text-sm text-navy-light">
                  • {k}
                </li>
              ))}
            </ul>
          </div>

          <div className="card-shadow rounded-2xl border border-border bg-surface p-6">
            <h3 className="flex items-center gap-2 text-sm font-bold text-navy">
              <AlertTriangle size={16} className="text-amber-500" /> Brechas a mejorar
            </h3>
            <ul className="mt-3 space-y-3">
              {resultado.gaps_and_recommendations.map((g, i) => (
                <li key={i} className="text-sm text-navy-light">
                  <p className="font-medium text-navy">{g.brecha}</p>
                  <p className="text-muted">{g.recomendacion}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="card-shadow rounded-2xl border border-border bg-surface p-6">
            <h3 className="flex items-center gap-2 text-sm font-bold text-navy">
              <MapPin size={16} className="text-cyan" /> Vacantes sugeridas en tu zona
            </h3>
            <ul className="mt-3 space-y-3">
              {resultado.vacantes_sugeridas.map((v, i) => (
                <li key={i} className="text-sm">
                  <p className="font-medium text-navy">{v.titulo}</p>
                  <p className="text-muted">
                    {v.empresa} · {v.ubicacion}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <div className="card-shadow rounded-2xl border border-border bg-surface p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <h3 className="font-bold text-navy">Vista previa del CV optimizado</h3>
                <p className="text-xs text-muted">Formato de una columna, listo para sistemas ATS.</p>
              </div>

              {cargandoSesion ? (
                <Loader2 size={18} className="animate-spin text-muted" />
              ) : !autenticado ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/cuenta/login"
                    className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-navy-light transition hover:bg-slate-50"
                  >
                    <LogIn size={16} /> Iniciar sesión
                  </Link>
                  <Link
                    href="/cuenta/registro"
                    className="flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-light"
                  >
                    Crear cuenta
                  </Link>
                </div>
              ) : creditos > 0 ? (
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-light disabled:opacity-50"
                >
                  {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  Descargar PDF ({creditos} disp.)
                </button>
              ) : codigoPendiente ? (
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-700">
                    Pago pendiente — código {codigoPendiente}
                  </span>
                  <a
                    href={construirLinkWhatsApp(codigoPendiente)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg bg-mint px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-mint-light"
                  >
                    <MessageCircle size={16} /> Enviar comprobante
                  </a>
                </div>
              ) : (
                <button
                  onClick={() => setMostrarTransferencia(true)}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan to-mint px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  <Landmark size={16} /> Pagar por transferencia
                </button>
              )}
            </div>

            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

            <div className="space-y-6 text-navy">
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

          <button
            onClick={onRestart}
            className="mt-4 flex items-center gap-2 text-sm font-medium text-muted hover:text-navy"
          >
            <RotateCcw size={14} /> Analizar otra vacante
          </button>
        </div>
      </div>

      {mostrarTransferencia && (
        <TransferenciaModal
          onClose={() => {
            setMostrarTransferencia(false);
            cargarSesion();
          }}
        />
      )}
    </div>
  );
}
