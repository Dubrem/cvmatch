"use client";

import { useState } from "react";
import { X, Copy, Check, Loader2, HeartHandshake } from "lucide-react";
import { DATOS_BANCARIOS, CORREO_COMPROBANTES } from "@/lib/config";

interface Props {
  onClose: () => void;
}

export default function DonacionModal({ onClose }: Props) {
  const [copiado, setCopiado] = useState(false);
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copiarClabe = () => {
    navigator.clipboard.writeText(DATOS_BANCARIOS.clabe);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const res = await fetch("/api/donante", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, correo }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo registrar tu donativo.");
        return;
      }
      setEnviado(true);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-surface p-7 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted hover:text-navy"
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>

        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint/10 text-mint">
            <HeartHandshake size={22} />
          </span>
          <div>
            <h3 className="font-bold text-navy">Haz una donación</h3>
            <p className="text-xs text-muted">Ayuda a otro egresado a conseguir su primer empleo.</p>
          </div>
        </div>

        {!enviado ? (
          <>
            <div className="space-y-3 rounded-xl border border-border bg-background p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted">Banco</span>
                <span className="font-semibold text-navy">{DATOS_BANCARIOS.banco}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">CLABE</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-navy">{DATOS_BANCARIOS.clabe}</span>
                  <button
                    type="button"
                    onClick={copiarClabe}
                    className="text-mint hover:text-mint-light"
                    aria-label="Copiar CLABE"
                  >
                    {copiado ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Titular</span>
                <span className="font-semibold text-navy">{DATOS_BANCARIOS.titular}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Monto</span>
                <span className="font-semibold text-navy">El que gustes aportar</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-5">
              <p className="mb-3 text-sm font-medium text-navy-light">
                ¿Quieres registrarte como donante? Déjanos tus datos:
              </p>
              <div className="space-y-3">
                <input
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-navy placeholder:text-slate-400 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/20"
                />
                <input
                  type="email"
                  required
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                  className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-navy placeholder:text-slate-400 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/20"
                />
              </div>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={enviando}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-mint py-3 text-sm font-semibold text-white transition hover:bg-mint-light disabled:opacity-60"
              >
                {enviando && <Loader2 size={16} className="animate-spin" />}
                Registrarme como donante
              </button>
              <p className="mt-3 text-center text-xs text-muted">
                También puedes escribirnos directo a{" "}
                <span className="font-medium text-navy">{CORREO_COMPROBANTES}</span>.
              </p>
            </form>
          </>
        ) : (
          <div className="py-4 text-center">
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-mint/10 text-mint">
              <Check size={24} />
            </span>
            <p className="font-semibold text-navy">¡Gracias por tu apoyo, {nombre}!</p>
            <p className="mt-1 text-sm text-muted">
              Registramos tus datos. En cuanto veamos tu depósito, te contactaremos a {correo}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
