"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-navy placeholder:text-slate-400 focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20";

export default function LoginPage() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/cuenta/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo iniciar sesión.");
        return;
      }
      router.push("/cuenta");
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan to-mint text-white">
            <Sparkles size={18} />
          </span>
          <span className="text-lg font-bold text-navy">MatchCV</span>
        </Link>

        <form onSubmit={handleSubmit} className="card-shadow rounded-2xl border border-border bg-surface p-7">
          <h1 className="text-lg font-bold text-navy">Inicia sesión</h1>
          <p className="mt-1 text-sm text-muted">Entra para ver y descargar tus CVs.</p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-light">Correo</label>
              <input
                type="email"
                className={inputClass}
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-light">Contraseña</label>
              <input
                type="password"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                required
              />
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan to-mint py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Entrar
          </button>

          <p className="mt-4 text-center text-sm text-muted">
            ¿No tienes cuenta?{" "}
            <Link href="/cuenta/registro" className="font-semibold text-cyan hover:text-cyan-light">
              Regístrate
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
