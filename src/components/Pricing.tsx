"use client";

import { useState } from "react";
import { Check, Landmark, CreditCard } from "lucide-react";
import TransferenciaModal from "./TransferenciaModal";
import { DESCARGAS_PAQUETE } from "@/lib/config";

const FEATURES = [
  `${DESCARGAS_PAQUETE} descargas o adaptaciones de CV en PDF`,
  "Optimización automática para filtros ATS",
  "Palabras clave alineadas a cada vacante",
  "Vigencia de 90 días para usar tus descargas",
  "Soporte por correo electrónico",
];

export default function Pricing() {
  const [mostrarTransferencia, setMostrarTransferencia] = useState(false);

  return (
    <section id="precios" className="bg-navy/[0.03] py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold text-navy md:text-4xl">
            Precios simples y transparentes
          </h2>
          <p className="mt-4 text-muted">
            El diagnóstico y el reporte de match siempre son gratis. Solo
            pagas cuando quieras descargar tu CV optimizado.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
          <div className="card-shadow rounded-2xl border border-border bg-surface p-8">
            <h3 className="text-lg font-bold text-navy">
              Diagnóstico de Match
            </h3>
            <p className="mt-2 text-4xl font-extrabold text-navy">Gratis</p>
            <p className="mt-1 text-sm text-muted">Para siempre</p>
            <ul className="mt-6 space-y-3">
              {[
                "Porcentaje de compatibilidad con la vacante",
                "Puntos fuertes de tu perfil",
                "Vacantes sugeridas en tu zona",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-navy-light">
                  <Check size={16} className="mt-0.5 shrink-0 text-cyan" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative rounded-2xl border-2 border-mint bg-navy p-8 text-white shadow-xl shadow-mint/10">
            <span className="absolute -top-3 right-8 rounded-full bg-mint px-3 py-1 text-xs font-bold text-white">
              Más popular
            </span>
            <h3 className="text-lg font-bold">Paquete de {DESCARGAS_PAQUETE} descargas</h3>
            <p className="mt-2 text-4xl font-extrabold">
              $49 <span className="text-lg font-medium text-slate-300">MXN</span>
            </p>
            <p className="mt-1 text-sm text-slate-300">Pago único</p>
            <ul className="mt-6 space-y-3">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-200">
                  <Check size={16} className="mt-0.5 shrink-0 text-mint-light" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              disabled
              title="Pago con tarjeta próximamente"
              className="mt-8 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-white/10 py-3.5 text-sm font-semibold text-white/50"
            >
              <CreditCard size={16} />
              Pagar con tarjeta (próximamente)
            </button>
            <button
              onClick={() => setMostrarTransferencia(true)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan to-mint py-3.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Landmark size={16} />
              Pagar por transferencia
            </button>
          </div>
        </div>
      </div>

      {mostrarTransferencia && (
        <TransferenciaModal onClose={() => setMostrarTransferencia(false)} />
      )}
    </section>
  );
}
