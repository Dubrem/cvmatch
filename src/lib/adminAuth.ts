import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest } from "next/server";

const COOKIE_NAME = "admin_session";

function firmar(password: string): string {
  return createHmac("sha256", password).update("matchcv-admin").digest("hex");
}

export function generarTokenSesion(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return firmar(password);
}

export function validarPassword(intento: string): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  const a = Buffer.from(intento);
  const b = Buffer.from(password);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function sesionValida(req: NextRequest): boolean {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const esperado = generarTokenSesion();
  if (!token || !esperado) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
