import { NextRequest, NextResponse } from "next/server";
import { obtenerCvsDeUsuario, obtenerSolicitudesDeUsuario, obtenerUsuarioPorId } from "@/lib/db";
import { usuarioIdDeSesion } from "@/lib/userAuth";

export async function GET(req: NextRequest) {
  const usuarioId = usuarioIdDeSesion(req);
  if (!usuarioId) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const usuario = await obtenerUsuarioPorId(usuarioId);
  if (!usuario) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const [cvs, solicitudes] = await Promise.all([
    obtenerCvsDeUsuario(usuario.id),
    obtenerSolicitudesDeUsuario(usuario.id),
  ]);

  return NextResponse.json({
    nombre: usuario.nombre,
    correo: usuario.correo,
    creditos: usuario.creditos,
    cvs,
    solicitudes,
  });
}
