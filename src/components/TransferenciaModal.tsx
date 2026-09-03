"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Copy, Check, Loader2, Landmark, MessageCircle, LogIn } from "lucide-react";
import { DATOS_BANCARIOS, DESCARGAS_PAQUETE, construirLinkWhatsApp } from "@/lib/config";

interface Props {
  onClose: () => void;
}

export default function TransferenciaModal({ onClose }: Props) {
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [autenticado, setAutenticado] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [codigo, setCodigo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/cuenta/me")
      .then((res) => setAutenticado(res.ok))
      .catch(() => setAutenticado(false))
      .finally(() => setCargandoSesion(false));
  }, []);

  const copiarClabe = () => {
    navigator.clipboard.writeText(DATOS_BANCARIOS.clabe);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleTransferi = async () => {
    setError(null);
    setEnviando(true);
    try {
      const res = await fetch("/api/transferencia", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo registrar tu solicitud.");
        return;
      }
      setCodigo(data.codigo);
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

        {cargandoSesion ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-muted" size={24} />
          </div>
        ) : !autenticado ? (
          <div className="py-2 text-center">
            <p className="text-sm text-muted">
              Necesitas una cuenta para poder generar tu código de seguimiento y descargar tu CV
              después.
            </p>
            <div className="mt-5 flex justify-center gap-3">
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
          </div>
        ) : !codigo ? (
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

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <button
              onClick={handleTransferi}
              disabled={enviando}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-navy py-3 text-sm font-semibold text-white transition hover:bg-navy-light disabled:opacity-60"
            >
              {enviando && <Loader2 size={16} className="animate-spin" />}
              Ya hice la transferencia
            </button>
            <p className="mt-3 text-center text-xs text-muted">
              Te daremos un código de seguimiento para que lo envíes junto con tu comprobante por
              WhatsApp.
            </p>
          </>
        ) : (
          <div className="py-2 text-center">
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-mint/10 text-mint">
              <Check size={24} />
            </span>
            <p className="font-semibold text-navy">Tu código de seguimiento es:</p>
            <p className="mt-2 rounded-xl border-2 border-dashed border-cyan bg-cyan/5 py-3 font-mono text-2xl font-extrabold tracking-wider text-cyan">
              {codigo}
            </p>
            <p className="mt-3 text-sm text-muted">
              Envíanos tu comprobante junto con este código por WhatsApp. En cuanto lo confirmemos,
              verás tu pago aprobado dentro de tu cuenta.
            </p>
            <a
              href={construirLinkWhatsApp(codigo)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-mint py-3 text-sm font-semibold text-white transition hover:bg-mint-light"
            >
              <MessageCircle size={16} />
              Enviar comprobante por WhatsApp
            </a>
            <Link
              href="/cuenta"
              className="mt-3 block text-center text-xs font-semibold text-cyan hover:text-cyan-light"
            >
              Ir a mi cuenta
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
