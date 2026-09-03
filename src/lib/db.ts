import { Pool } from "pg";
import { DESCARGAS_PAQUETE } from "./config";

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
        CREATE TABLE IF NOT EXISTS usuarios (
          id BIGSERIAL PRIMARY KEY,
          nombre TEXT NOT NULL,
          correo TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          creditos INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS cvs_generados (
          id BIGSERIAL PRIMARY KEY,
          usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
          perfil JSONB NOT NULL,
          resultado JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS donantes (
          id BIGSERIAL PRIMARY KEY,
          nombre TEXT NOT NULL,
          correo TEXT NOT NULL,
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

export async function registrarDonante(nombre: string, correo: string): Promise<void> {
  await ensureTables();
  await getPool().query("INSERT INTO donantes (nombre, correo) VALUES ($1, $2)", [nombre, correo]);
}

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  passwordHash: string;
  creditos: number;
}

function mapUsuario(r: {
  id: number;
  nombre: string;
  correo: string;
  password_hash: string;
  creditos: number;
}): Usuario {
  return {
    id: r.id,
    nombre: r.nombre,
    correo: r.correo,
    passwordHash: r.password_hash,
    creditos: r.creditos,
  };
}

export async function crearUsuario(
  nombre: string,
  correo: string,
  passwordHash: string
): Promise<Usuario> {
  await ensureTables();
  const res = await getPool().query(
    `INSERT INTO usuarios (nombre, correo, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, nombre, correo, password_hash, creditos`,
    [nombre, correo.toLowerCase().trim(), passwordHash]
  );
  return mapUsuario(res.rows[0]);
}

export async function obtenerUsuarioPorCorreo(correo: string): Promise<Usuario | null> {
  await ensureTables();
  const res = await getPool().query(
    "SELECT id, nombre, correo, password_hash, creditos FROM usuarios WHERE correo = $1",
    [correo.toLowerCase().trim()]
  );
  return res.rows[0] ? mapUsuario(res.rows[0]) : null;
}

export async function obtenerUsuarioPorId(id: number): Promise<Usuario | null> {
  await ensureTables();
  const res = await getPool().query(
    "SELECT id, nombre, correo, password_hash, creditos FROM usuarios WHERE id = $1",
    [id]
  );
  return res.rows[0] ? mapUsuario(res.rows[0]) : null;
}

export async function descontarCredito(usuarioId: number): Promise<boolean> {
  await ensureTables();
  const res = await getPool().query(
    "UPDATE usuarios SET creditos = creditos - 1 WHERE id = $1 AND creditos > 0 RETURNING id",
    [usuarioId]
  );
  return (res.rowCount ?? 0) > 0;
}

export async function guardarCvGenerado(
  usuarioId: number,
  perfil: unknown,
  resultado: unknown
): Promise<void> {
  await ensureTables();
  await getPool().query(
    "INSERT INTO cvs_generados (usuario_id, perfil, resultado) VALUES ($1, $2, $3)",
    [usuarioId, JSON.stringify(perfil), JSON.stringify(resultado)]
  );
}

export interface CvGuardado {
  id: number;
  perfil: unknown;
  resultado: unknown;
  fecha: string;
}

export async function obtenerCvsDeUsuario(usuarioId: number): Promise<CvGuardado[]> {
  await ensureTables();
  const res = await getPool().query(
    `SELECT id, perfil, resultado, created_at
     FROM cvs_generados
     WHERE usuario_id = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [usuarioId]
  );
  return res.rows.map((r) => ({
    id: r.id,
    perfil: r.perfil,
    resultado: r.resultado,
    fecha: r.created_at,
  }));
}

export async function aprobarSolicitudTransferencia(
  id: number
): Promise<{ ok: boolean; mensaje: string }> {
  await ensureTables();
  const db = getPool();

  const solicitud = await db.query(
    "SELECT id, email, confirmada FROM solicitudes_transferencia WHERE id = $1",
    [id]
  );
  const fila = solicitud.rows[0];
  if (!fila) return { ok: false, mensaje: "Solicitud no encontrada." };
  if (fila.confirmada) return { ok: false, mensaje: "Esta solicitud ya estaba confirmada." };

  const usuario = await obtenerUsuarioPorCorreo(fila.email);

  await db.query("UPDATE solicitudes_transferencia SET confirmada = true WHERE id = $1", [id]);

  if (!usuario) {
    return {
      ok: true,
      mensaje: `Marcada como confirmada, pero ${fila.email} todavía no tiene cuenta registrada en /cuenta/registro. Cuando se registre, agrégale los créditos manualmente o dile que contacte soporte.`,
    };
  }

  await db.query("UPDATE usuarios SET creditos = creditos + $1 WHERE id = $2", [
    DESCARGAS_PAQUETE,
    usuario.id,
  ]);

  return { ok: true, mensaje: `Se agregaron ${DESCARGAS_PAQUETE} descargas a ${usuario.correo}.` };
}

export interface EstadisticasAdmin {
  totalVisitas: number;
  visitasUltimos7Dias: { fecha: string; visitas: number }[];
  totalCompras: number;
  ingresoTotal: number;
  compras: { email: string | null; fecha: string; monto: number; moneda: string }[];
  solicitudesTransferencia: {
    id: number;
    email: string;
    fecha: string;
    monto: number;
    confirmada: boolean;
    tieneCuenta: boolean;
  }[];
  donantes: { nombre: string; correo: string; fecha: string }[];
}

export async function obtenerEstadisticas(): Promise<EstadisticasAdmin> {
  await ensureTables();
  const db = getPool();

  const [totalVisitas, visitasPorDia, totalCompras, compras, transferencias, donantes] =
    await Promise.all([
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
        `SELECT st.id, st.email, st.created_at, st.monto, st.confirmada,
                (u.id IS NOT NULL) AS tiene_cuenta
       FROM solicitudes_transferencia st
       LEFT JOIN usuarios u ON u.correo = st.email
       ORDER BY st.created_at DESC
       LIMIT 100`
      ),
      db.query(
        `SELECT nombre, correo, created_at FROM donantes ORDER BY created_at DESC LIMIT 100`
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
      id: r.id,
      email: r.email,
      fecha: r.created_at,
      monto: r.monto,
      confirmada: r.confirmada,
      tieneCuenta: r.tiene_cuenta,
    })),
    donantes: donantes.rows.map((r) => ({
      nombre: r.nombre,
      correo: r.correo,
      fecha: r.created_at,
    })),
  };
}
