"use client";

import { useEffect, useState } from "react";
import { Eye, DollarSign, ShoppingBag, Lock, Loader2 } from "lucide-react";
import type { EstadisticasAdmin } from "@/lib/db";

export default function AdminPage() {
  const [stats, setStats] = useState<EstadisticasAdmin | null>(null);
  const [necesitaLogin, setNecesitaLogin] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const cargarStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.status === 401) {
        setNecesitaLogin(true);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al cargar estadísticas.");
        return;
      }
      setStats(data);
      setNecesitaLogin(false);
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial de datos del servidor
    cargarStats();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Contraseña incorrecta.");
        setLoading(false);
        return;
      }
      setPassword("");
      await cargarStats();
    } catch {
      setError("Error de conexión.");
      setLoading(false);
    }
  };

  if (necesitaLogin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy px-6">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm"
        >
          <div className="mb-6 flex flex-col items-center text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan/10 text-cyan">
              <Lock size={22} />
            </span>
            <h1 className="text-lg font-bold text-white">Panel de administración</h1>
            <p className="mt-1 text-sm text-slate-400">Ingresa la contraseña para continuar.</p>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            autoFocus
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan focus:outline-none"
          />
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan to-mint py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Entrar
          </button>
        </form>
      </div>
    );
  }

  if (loading && !stats) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="animate-spin text-muted" size={28} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!stats) return null;

  const maxVisitas = Math.max(1, ...stats.visitasUltimos7Dias.map((d) => d.visitas));

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold text-navy">Panel de administración</h1>
        <p className="mt-1 text-sm text-muted">Visitas y compras de MatchCV.</p>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="card-shadow rounded-2xl border border-border bg-surface p-6">
            <div className="flex items-center gap-2 text-cyan">
              <Eye size={18} />
              <span className="text-sm font-semibold">Visitas totales</span>
            </div>
            <p className="mt-3 text-3xl font-bold text-navy">{stats.totalVisitas}</p>
          </div>
          <div className="card-shadow rounded-2xl border border-border bg-surface p-6">
            <div className="flex items-center gap-2 text-mint">
              <ShoppingBag size={18} />
              <span className="text-sm font-semibold">Compras totales</span>
            </div>
            <p className="mt-3 text-3xl font-bold text-navy">{stats.totalCompras}</p>
          </div>
          <div className="card-shadow rounded-2xl border border-border bg-surface p-6">
            <div className="flex items-center gap-2 text-amber-500">
              <DollarSign size={18} />
              <span className="text-sm font-semibold">Ingresos</span>
            </div>
            <p className="mt-3 text-3xl font-bold text-navy">
              ${(stats.ingresoTotal / 100).toLocaleString("es-MX")} MXN
            </p>
          </div>
        </div>

        <div className="card-shadow mt-6 rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-sm font-bold text-navy">Visitas — últimos 7 días</h2>
          <div className="mt-4 flex items-end gap-3" style={{ height: 120 }}>
            {stats.visitasUltimos7Dias.length === 0 && (
              <p className="text-sm text-muted">Sin datos todavía.</p>
            )}
            {stats.visitasUltimos7Dias.map((d) => (
              <div key={d.fecha} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-cyan/70"
                  style={{ height: `${(d.visitas / maxVisitas) * 90}px` }}
                />
                <span className="text-[10px] text-muted">{d.fecha.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-shadow mt-6 overflow-hidden rounded-2xl border border-border bg-surface">
          <h2 className="border-b border-border px-6 py-4 text-sm font-bold text-navy">
            Compras recientes
          </h2>
          {stats.compras.length === 0 ? (
            <p className="px-6 py-6 text-sm text-muted">Todavía no hay compras registradas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted">
                    <th className="px-6 py-3">Correo</th>
                    <th className="px-6 py-3">Fecha</th>
                    <th className="px-6 py-3">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.compras.map((c, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-6 py-3 text-navy">{c.email ?? "—"}</td>
                      <td className="px-6 py-3 text-muted">
                        {new Date(c.fecha).toLocaleString("es-MX")}
                      </td>
                      <td className="px-6 py-3 text-navy">
                        ${(c.monto / 100).toLocaleString("es-MX")} {c.moneda.toUpperCase()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
