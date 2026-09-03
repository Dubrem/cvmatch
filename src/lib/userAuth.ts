import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { NextRequest } from "next/server";

export const USER_COOKIE_NAME = "cvmatch_session";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashIntento = scryptSync(password, salt, 64);
  const hashGuardado = Buffer.from(hash, "hex");
  return hashIntento.length === hashGuardado.length && timingSafeEqual(hashIntento, hashGuardado);
}

function getSecret(): string {
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || "cvmatch-dev-secret";
}

export function generarTokenUsuario(usuarioId: number): string {
  const firma = createHmac("sha256", getSecret()).update(String(usuarioId)).digest("hex");
  return `${usuarioId}.${firma}`;
}

export function usuarioIdDeSesion(req: NextRequest): number | null {
  const token = req.cookies.get(USER_COOKIE_NAME)?.value;
  if (!token) return null;

  const [idStr, firma] = token.split(".");
  const id = Number(idStr);
  if (!idStr || !firma || Number.isNaN(id)) return null;

  const esperada = createHmac("sha256", getSecret()).update(idStr).digest("hex");
  const a = Buffer.from(firma);
  const b = Buffer.from(esperada);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  return id;
}
