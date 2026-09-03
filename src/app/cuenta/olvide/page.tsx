"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, MessageCircle } from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-navy placeholder:text-slate-400 focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20";

export default function OlvidePage() {
  const router = useRouter();
  const [telefono, setTelefono] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/cuenta/recuperar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefono }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo procesar tu solicitud.");
        return;
      }
      setEnviado(true);
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

        <div className="card-shadow rounded-2xl border border-border bg-surface p-7">
          {!enviado ? (
            <form onSubmit={handleSubmit}>
              <h1 className="text-lg font-bold text-navy">Recuperar contraseña</h1>
              <p className="mt-1 text-sm text-muted">
                Te enviaremos un código de recuperación por WhatsApp al número con el que te
                registraste.
              </p>

              <div className="mt-5">
                <label className="mb-1.5 block text-sm font-medium text-navy-light">
                  Número de WhatsApp
                </label>
                <input
                  type="tel"
                  className={inputClass}
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="442 105 2174"
                  required
                />
              </div>

              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan to-mint py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Solicitar código
              </button>
            </form>
          ) : (
            <div className="text-center">
              <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-mint/10 text-mint">
                <MessageCircle size={22} />
              </span>
              <p className="font-semibold text-navy">Solicitud enviada</p>
              <p className="mt-1 text-sm text-muted">
                Si ese número tiene una cuenta, en breve recibirás un código de 6 dígitos por
                WhatsApp. Úsalo en la siguiente pantalla para crear tu nueva contraseña.
              </p>
              <button
                onClick={() => router.push("/cuenta/restablecer")}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-navy py-3 text-sm font-semibold text-white transition hover:bg-navy-light"
              >
                Ya tengo mi código
              </button>
            </div>
          )}

          <p className="mt-4 text-center text-sm text-muted">
            <Link href="/cuenta/login" className="font-semibold text-cyan hover:text-cyan-light">
              Volver a iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
