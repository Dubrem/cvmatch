import { Pool } from "pg";

let pool: Pool | null = null;
let initialized: Promise<void> | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL no está configurada.");
    }
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
    });
  }
  return pool;
}

async function ensureTables(): Promise<void> {
  if (!initialized) {
    initialized = getPool()
      .query(
        `
        CREATE TABLE IF NOT EXISTS page_views (
          id BIGSERIAL PRIMARY KEY,
          path TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS purchases (
          id BIGSERIAL PRIMARY KEY,
          stripe_session_id TEXT UNIQUE NOT NULL,
          email TEXT,
          amount_total INTEGER,
          currency TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS solicitudes_transferencia (
          id BIGSERIAL PRIMARY KEY,
          email TEXT NOT NULL,
          monto INTEGER NOT NULL,
          confirmada BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        `
      )
      .then(() => undefined);
  }
  await initialized;
}

export async function registrarVisita(path: string): Promise<void> {
  await ensureTables();
  await getPool().query("INSERT INTO page_views (path) VALUES ($1)", [path]);
}

export async function registrarCompra(params: {
  sessionId: string;
  email: string | null;
  amountTotal: number | null;
  currency: string | null;
}): Promise<void> {
  await ensureTables();
  await getPool().query(
    `INSERT INTO purchases (stripe_session_id, email, amount_total, currency)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (stripe_session_id) DO NOTHING`,
    [params.sessionId, params.email, params.amountTotal, params.currency]
  );
}

export async function registrarSolicitudTransferencia(email: string, monto: number): Promise<void> {
  await ensureTables();
  await getPool().query(
    "INSERT INTO solicitudes_transferencia (email, monto) VALUES ($1, $2)",
    [email, monto]
  );
}

export interface EstadisticasAdmin {
  totalVisitas: number;
  visitasUltimos7Dias: { fecha: string; visitas: number }[];
  totalCompras: number;
  ingresoTotal: number;
  compras: { email: string | null; fecha: string; monto: number; moneda: string }[];
  solicitudesTransferencia: { email: string; fecha: string; monto: number; confirmada: boolean }[];
}

export async function obtenerEstadisticas(): Promise<EstadisticasAdmin> {
  await ensureTables();
  const db = getPool();

  const [totalVisitas, visitasPorDia, totalCompras, compras, transferencias] = await Promise.all([
    db.query("SELECT COUNT(*)::int AS total FROM page_views"),
    db.query(
      `SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS fecha, COUNT(*)::int AS visitas
       FROM page_views
       WHERE created_at > now() - interval '7 days'
       GROUP BY 1
       ORDER BY 1`
    ),
    db.query("SELECT COUNT(*)::int AS total, COALESCE(SUM(amount_total), 0)::int AS ingreso FROM purchases"),
    db.query(
      `SELECT email, created_at, amount_total, currency
       FROM purchases
       ORDER BY created_at DESC
       LIMIT 100`
    ),
    db.query(
      `SELECT email, created_at, monto, confirmada
       FROM solicitudes_transferencia
       ORDER BY created_at DESC
       LIMIT 100`
    ),
  ]);

  return {
    totalVisitas: totalVisitas.rows[0]?.total ?? 0,
    visitasUltimos7Dias: visitasPorDia.rows,
    totalCompras: totalCompras.rows[0]?.total ?? 0,
    ingresoTotal: totalCompras.rows[0]?.ingreso ?? 0,
    compras: compras.rows.map((r) => ({
      email: r.email,
      fecha: r.created_at,
      monto: r.amount_total ?? 0,
      moneda: r.currency ?? "mxn",
    })),
    solicitudesTransferencia: transferencias.rows.map((r) => ({
      email: r.email,
      fecha: r.created_at,
      monto: r.monto,
      confirmada: r.confirmada,
    })),
  };
}
