import { Pool, types } from "pg";
import { randomBytes, randomInt } from "crypto";
import { DESCARGAS_PAQUETE } from "./config";

// Postgres devuelve BIGINT/BIGSERIAL (OID 20) como string por defecto para no
// perder precisión en enteros de 64 bits. Nuestros ids nunca se acercan a ese
// límite, así que los tratamos como number para evitar bugs de tipo en toda
// la app (ej. comparaciones "typeof id === 'number'" en las rutas API).
types.setTypeParser(20, (val: string) => parseInt(val, 10));

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
        CREATE TABLE IF NOT EXISTS usuarios (
          id BIGSERIAL PRIMARY KEY,
          nombre TEXT NOT NULL,
          correo TEXT UNIQUE,
          telefono TEXT,
          password_hash TEXT NOT NULL,
          creditos INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        ALTER TABLE usuarios ALTER COLUMN correo DROP NOT NULL;
        ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefono TEXT;
        CREATE UNIQUE INDEX IF NOT EXISTS usuarios_telefono_idx
          ON usuarios (telefono) WHERE telefono IS NOT NULL;
        CREATE TABLE IF NOT EXISTS solicitudes_transferencia (
          id BIGSERIAL PRIMARY KEY,
          usuario_id BIGINT REFERENCES usuarios(id) ON DELETE CASCADE,
          email TEXT,
          telefono TEXT,
          codigo TEXT,
          monto INTEGER NOT NULL,
          confirmada BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        ALTER TABLE solicitudes_transferencia ALTER COLUMN email DROP NOT NULL;
        ALTER TABLE solicitudes_transferencia ADD COLUMN IF NOT EXISTS usuario_id BIGINT REFERENCES usuarios(id) ON DELETE CASCADE;
        ALTER TABLE solicitudes_transferencia ADD COLUMN IF NOT EXISTS codigo TEXT;
        ALTER TABLE solicitudes_transferencia ADD COLUMN IF NOT EXISTS telefono TEXT;
        CREATE UNIQUE INDEX IF NOT EXISTS solicitudes_transferencia_codigo_idx
          ON solicitudes_transferencia (codigo) WHERE codigo IS NOT NULL;
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
        CREATE TABLE IF NOT EXISTS codigos_recuperacion (
          id BIGSERIAL PRIMARY KEY,
          usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
          codigo TEXT NOT NULL,
          usado BOOLEAN NOT NULL DEFAULT false,
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

export async function registrarDonante(nombre: string, correo: string): Promise<void> {
  await ensureTables();
  await getPool().query("INSERT INTO donantes (nombre, correo) VALUES ($1, $2)", [nombre, correo]);
}

export interface Usuario {
  id: number;
  nombre: string;
  telefono: string;
  passwordHash: string;
  creditos: number;
}

function mapUsuario(r: {
  id: number;
  nombre: string;
  telefono: string;
  password_hash: string;
  creditos: number;
}): Usuario {
  return {
    id: r.id,
    nombre: r.nombre,
    telefono: r.telefono,
    passwordHash: r.password_hash,
    creditos: r.creditos,
  };
}

function normalizarTelefono(telefono: string): string {
  return telefono.replace(/\D/g, "");
}

export async function crearUsuario(
  nombre: string,
  telefono: string,
  passwordHash: string
): Promise<Usuario> {
  await ensureTables();
  const res = await getPool().query(
    `INSERT INTO usuarios (nombre, telefono, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, nombre, telefono, password_hash, creditos`,
    [nombre, normalizarTelefono(telefono), passwordHash]
  );
  return mapUsuario(res.rows[0]);
}

export async function obtenerUsuarioPorTelefono(telefono: string): Promise<Usuario | null> {
  await ensureTables();
  const res = await getPool().query(
    "SELECT id, nombre, telefono, password_hash, creditos FROM usuarios WHERE telefono = $1",
    [normalizarTelefono(telefono)]
  );
  return res.rows[0] ? mapUsuario(res.rows[0]) : null;
}

export async function obtenerUsuarioPorId(id: number): Promise<Usuario | null> {
  await ensureTables();
  const res = await getPool().query(
    "SELECT id, nombre, telefono, password_hash, creditos FROM usuarios WHERE id = $1",
    [id]
  );
  return res.rows[0] ? mapUsuario(res.rows[0]) : null;
}

export async function actualizarPassword(usuarioId: number, passwordHash: string): Promise<void> {
  await ensureTables();
  await getPool().query("UPDATE usuarios SET password_hash = $1 WHERE id = $2", [
    passwordHash,
    usuarioId,
  ]);
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

function generarCodigoSeguimiento(): string {
  return `MCV-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function crearSolicitudTransferencia(
  usuarioId: number,
  telefono: string,
  monto: number
): Promise<string> {
  await ensureTables();
  const db = getPool();

  for (let intento = 0; intento < 5; intento++) {
    const codigo = generarCodigoSeguimiento();
    try {
      await db.query(
        "INSERT INTO solicitudes_transferencia (usuario_id, telefono, codigo, monto) VALUES ($1, $2, $3, $4)",
        [usuarioId, telefono, codigo, monto]
      );
      return codigo;
    } catch (error) {
      const codigoDuplicado = (error as { code?: string })?.code === "23505";
      if (!codigoDuplicado || intento === 4) throw error;
    }
  }
  throw new Error("No se pudo generar un código de seguimiento único.");
}

export interface SolicitudCliente {
  codigo: string;
  monto: number;
  confirmada: boolean;
  fecha: string;
}

export async function obtenerSolicitudesDeUsuario(usuarioId: number): Promise<SolicitudCliente[]> {
  await ensureTables();
  const res = await getPool().query(
    `SELECT codigo, monto, confirmada, created_at
     FROM solicitudes_transferencia
     WHERE usuario_id = $1
     ORDER BY created_at DESC
     LIMIT 20`,
    [usuarioId]
  );
  return res.rows.map((r) => ({
    codigo: r.codigo,
    monto: r.monto,
    confirmada: r.confirmada,
    fecha: r.created_at,
  }));
}

export async function aprobarSolicitudTransferencia(
  id: number
): Promise<{ ok: boolean; mensaje: string }> {
  await ensureTables();
  const db = getPool();

  const solicitud = await db.query(
    "SELECT id, usuario_id, confirmada FROM solicitudes_transferencia WHERE id = $1",
    [id]
  );
  const fila = solicitud.rows[0];
  if (!fila) return { ok: false, mensaje: "Solicitud no encontrada." };
  if (fila.confirmada) return { ok: false, mensaje: "Esta solicitud ya estaba confirmada." };
  if (!fila.usuario_id) {
    return { ok: false, mensaje: "Esta solicitud no está ligada a ninguna cuenta." };
  }

  await db.query("UPDATE solicitudes_transferencia SET confirmada = true WHERE id = $1", [id]);

  const res = await db.query(
    "UPDATE usuarios SET creditos = creditos + $1 WHERE id = $2 RETURNING telefono",
    [DESCARGAS_PAQUETE, fila.usuario_id]
  );

  return { ok: true, mensaje: `Se agregaron ${DESCARGAS_PAQUETE} descargas a ${res.rows[0].telefono}.` };
}

function generarCodigoNumerico(): string {
  return String(randomInt(100000, 1000000));
}

export async function crearCodigoRecuperacion(usuarioId: number): Promise<string> {
  await ensureTables();
  const codigo = generarCodigoNumerico();
  await getPool().query(
    "INSERT INTO codigos_recuperacion (usuario_id, codigo) VALUES ($1, $2)",
    [usuarioId, codigo]
  );
  return codigo;
}

export async function validarCodigoRecuperacion(
  telefono: string,
  codigo: string
): Promise<Usuario | null> {
  await ensureTables();
  const db = getPool();

  const usuario = await obtenerUsuarioPorTelefono(telefono);
  if (!usuario) return null;

  const res = await db.query(
    `SELECT id FROM codigos_recuperacion
     WHERE usuario_id = $1 AND codigo = $2 AND usado = false
       AND created_at > now() - interval '30 minutes'
     ORDER BY created_at DESC
     LIMIT 1`,
    [usuario.id, codigo]
  );
  if (!res.rows[0]) return null;

  await db.query("UPDATE codigos_recuperacion SET usado = true WHERE id = $1", [res.rows[0].id]);
  return usuario;
}

export interface RecuperacionPendiente {
  id: number;
  nombre: string;
  telefono: string;
  codigo: string;
  usado: boolean;
  fecha: string;
}

export async function obtenerRecuperacionesRecientes(): Promise<RecuperacionPendiente[]> {
  await ensureTables();
  const res = await getPool().query(
    `SELECT cr.id, cr.codigo, cr.usado, cr.created_at, u.nombre, u.telefono
     FROM codigos_recuperacion cr
     JOIN usuarios u ON u.id = cr.usuario_id
     WHERE cr.created_at > now() - interval '24 hours'
     ORDER BY cr.created_at DESC
     LIMIT 50`
  );
  return res.rows.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    telefono: r.telefono,
    codigo: r.codigo,
    usado: r.usado,
    fecha: r.created_at,
  }));
}

export interface EstadisticasAdmin {
  totalVisitas: number;
  visitasUltimos7Dias: { fecha: string; visitas: number }[];
  totalCompras: number;
  ingresoTotal: number;
  compras: { email: string | null; fecha: string; monto: number; moneda: string }[];
  solicitudesTransferencia: {
    id: number;
    codigo: string | null;
    nombre: string | null;
    telefono: string;
    fecha: string;
    monto: number;
    confirmada: boolean;
  }[];
  donantes: { nombre: string; correo: string; fecha: string }[];
  recuperaciones: RecuperacionPendiente[];
}

export async function obtenerEstadisticas(): Promise<EstadisticasAdmin> {
  await ensureTables();
  const db = getPool();

  const [totalVisitas, visitasPorDia, totalCompras, compras, transferencias, donantes, recuperaciones] =
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
        `SELECT st.id, st.codigo, COALESCE(st.telefono, st.email) AS contacto, st.created_at, st.monto, st.confirmada, u.nombre
       FROM solicitudes_transferencia st
       LEFT JOIN usuarios u ON u.id = st.usuario_id
       ORDER BY st.created_at DESC
       LIMIT 100`
      ),
      db.query(
        `SELECT nombre, correo, created_at FROM donantes ORDER BY created_at DESC LIMIT 100`
      ),
      obtenerRecuperacionesRecientes(),
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
      codigo: r.codigo,
      nombre: r.nombre,
      telefono: r.contacto,
      fecha: r.created_at,
      monto: r.monto,
      confirmada: r.confirmada,
    })),
    donantes: donantes.rows.map((r) => ({
      nombre: r.nombre,
      correo: r.correo,
      fecha: r.created_at,
    })),
    recuperaciones,
  };
}
