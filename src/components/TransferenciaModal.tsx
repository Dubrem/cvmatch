"use client";

import { useState } from "react";
import Link from "next/link";
import { X, Copy, Check, Loader2, Landmark, MessageCircle } from "lucide-react";
import { DATOS_BANCARIOS, DESCARGAS_PAQUETE, WHATSAPP_LINK_COMPROBANTES } from "@/lib/config";

interface Props {
  onClose: () => void;
}

export default function TransferenciaModal({ onClose }: Props) {
  const [copiado, setCopiado] = useState(false);
  const [email, setEmail] = useState("");
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
      const res = await fetch("/api/transferencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo registrar tu solicitud.");
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
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan/10 text-cyan">
            <Landmark size={22} />
          </span>
          <div>
            <h3 className="font-bold text-navy">Pago por transferencia</h3>
            <p className="text-xs text-muted">Paquete de {DESCARGAS_PAQUETE} descargas — $49 MXN</p>
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
                    className="text-cyan hover:text-cyan-light"
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
                <span className="font-semibold text-navy">$49.00 MXN</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-5">
              <label className="mb-1.5 block text-sm font-medium text-navy-light">
                Correo con el que te registraste (o vas a registrarte)
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
                className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-navy placeholder:text-slate-400 focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20"
              />
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={enviando}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-navy py-3 text-sm font-semibold text-white transition hover:bg-navy-light disabled:opacity-60"
              >
                {enviando && <Loader2 size={16} className="animate-spin" />}
                Ya hice la transferencia
              </button>
              <p className="mt-2 text-center text-xs text-muted">
                ¿Aún no tienes cuenta?{" "}
                <Link href="/cuenta/registro" className="font-semibold text-cyan hover:text-cyan-light">
                  Regístrate aquí
                </Link>{" "}
                con el mismo correo antes de que confirmemos tu pago.
              </p>
            </form>
          </>
        ) : (
          <div className="py-4 text-center">
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-mint/10 text-mint">
              <Check size={24} />
            </span>
            <p className="font-semibold text-navy">¡Solicitud registrada!</p>
            <p className="mt-1 text-sm text-muted">
              Ahora envíanos tu comprobante por WhatsApp para confirmar más rápido. En cuanto lo
              validemos, activaremos tus {DESCARGAS_PAQUETE} descargas en la cuenta de{" "}
              <span className="font-medium text-navy">{email}</span>.
            </p>
            <a
              href={WHATSAPP_LINK_COMPROBANTES}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-mint py-3 text-sm font-semibold text-white transition hover:bg-mint-light"
            >
              <MessageCircle size={16} />
              Enviar comprobante por WhatsApp
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
