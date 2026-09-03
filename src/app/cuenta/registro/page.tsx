"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-navy placeholder:text-slate-400 focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20";

export default function RegistroPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/cuenta/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, telefono, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo crear tu cuenta.");
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
          <h1 className="text-lg font-bold text-navy">Crea tu cuenta</h1>
          <p className="mt-1 text-sm text-muted">
            Guarda tus CVs y descárgalos cuando confirmemos tu pago.
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-light">Nombre completo</label>
              <input
                className={inputClass}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-light">
                Número de WhatsApp
              </label>
              <input
                type="tel"
                className={inputClass}
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="55 1234 5678"
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
                placeholder="Mínimo 6 caracteres"
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
            Crear cuenta
          </button>

          <p className="mt-4 text-center text-sm text-muted">
            ¿Ya tienes cuenta?{" "}
            <Link href="/cuenta/login" className="font-semibold text-cyan hover:text-cyan-light">
              Inicia sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
