import Link from "next/link";
import { ArrowRight, ShieldCheck, TrendingUp, Users } from "lucide-react";

const STATS = [
  { icon: Users, value: "+5,000", label: "CVs creados" },
  { icon: TrendingUp, value: "88%", label: "incremento en llamadas de reclutadores" },
  { icon: ShieldCheck, value: "100%", label: "optimizado para filtros ATS" },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, #0284c7 0%, transparent 40%), radial-gradient(circle at 80% 0%, #10b981 0%, transparent 35%)",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-cyan-light">
            Hecho para recién egresados y estudiantes
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-tight text-white md:text-6xl">
            Supera los filtros ATS y consigue tu{" "}
            <span className="gradient-text">primer empleo</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-slate-300">
            Pega tu perfil y la vacante que quieres. En segundos obtienes tu
            porcentaje de match, tus fortalezas y un CV optimizado listo para
            pasar cualquier sistema de reclutamiento automatizado.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/analisis"
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan to-mint px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-cyan/20 transition hover:opacity-90"
            >
              Obtén tu diagnóstico gratis
              <ArrowRight size={18} />
            </Link>
            <a
              href="#como-funciona"
              className="rounded-lg border border-white/15 px-7 py-3.5 text-base font-semibold text-white transition hover:bg-white/5"
            >
              Ver cómo funciona
            </a>
          </div>

          <p className="mt-4 text-xs text-slate-400">
            Sin tarjeta de crédito · Reporte de match 100% gratuito
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3">
          {STATS.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="flex flex-col items-center rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-center backdrop-blur-sm"
            >
              <Icon className="mb-2 text-mint-light" size={22} />
              <span className="text-2xl font-bold text-white">{value}</span>
              <span className="mt-1 text-xs text-slate-300">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
