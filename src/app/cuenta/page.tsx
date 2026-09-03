"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, FileText, LogOut, Loader2, Sparkles } from "lucide-react";
import { generarCvPdf } from "@/lib/pdf";
import type { MatchResult, PerfilEgresado } from "@/lib/types";

interface CvGuardado {
  id: number;
  perfil: PerfilEgresado;
  resultado: MatchResult;
  fecha: string;
}

interface Cuenta {
  nombre: string;
  correo: string;
  creditos: number;
  cvs: CvGuardado[];
}

export default function CuentaPage() {
  const router = useRouter();
  const [cuenta, setCuenta] = useState<Cuenta | null>(null);
  const [loading, setLoading] = useState(true);
  const [descargandoId, setDescargandoId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cuenta/me");
      if (res.status === 401) {
        router.push("/cuenta/login");
        return;
      }
      const data = await res.json();
      setCuenta(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial de sesión
    cargar();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/cuenta/logout", { method: "POST" });
    router.push("/");
  };

  const handleDescargar = async (cv: CvGuardado) => {
    setError(null);
    setDescargandoId(cv.id);
    try {
      const res = await fetch("/api/cuenta/descargar", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo descargar.");
        return;
      }
      const doc = generarCvPdf(cv.perfil, cv.resultado);
      doc.save(`CV-${cv.perfil.nombre.replace(/\s+/g, "_") || "optimizado"}.pdf`);
      setCuenta((prev) => (prev ? { ...prev, creditos: prev.creditos - 1 } : prev));
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setDescargandoId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="animate-spin text-muted" size={28} />
      </div>
    );
  }

  if (!cuenta) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan to-mint text-white">
              <Sparkles size={16} />
            </span>
            <span className="text-base font-bold text-navy">MatchCV</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-medium text-muted hover:text-navy"
          >
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-bold text-navy">Hola, {cuenta.nombre}</h1>
        <p className="mt-1 text-sm text-muted">{cuenta.correo}</p>

        <div className="card-shadow mt-6 flex items-center justify-between rounded-2xl border border-border bg-surface p-6">
          <div>
            <p className="text-sm text-muted">Descargas disponibles</p>
            <p className="text-3xl font-bold text-navy">{cuenta.creditos}</p>
          </div>
          {cuenta.creditos === 0 && (
            <Link
              href="/#precios"
              className="rounded-lg bg-gradient-to-r from-cyan to-mint px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Comprar descargas
            </Link>
          )}
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
        )}

        <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-muted">
          Tus CVs generados
        </h2>

        {cuenta.cvs.length === 0 ? (
          <div className="card-shadow mt-3 rounded-2xl border border-border bg-surface p-8 text-center">
            <FileText className="mx-auto mb-2 text-muted" size={28} />
            <p className="text-sm text-muted">
              Todavía no has generado ningún CV.{" "}
              <Link href="/analisis" className="font-semibold text-cyan hover:text-cyan-light">
                Empieza tu diagnóstico gratis
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {cuenta.cvs.map((cv) => (
              <div
                key={cv.id}
                className="card-shadow flex items-center justify-between rounded-2xl border border-border bg-surface p-5"
              >
                <div>
                  <p className="font-semibold text-navy">
                    {cv.resultado.match_percentage}% de match — {cv.perfil.nombre}
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(cv.fecha).toLocaleString("es-MX")}
                  </p>
                </div>
                <button
                  onClick={() => handleDescargar(cv)}
                  disabled={cuenta.creditos === 0 || descargandoId === cv.id}
                  className="flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {descargandoId === cv.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Download size={16} />
                  )}
                  Descargar
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
