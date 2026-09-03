import { NextRequest, NextResponse } from "next/server";
import { crearSolicitudTransferencia, obtenerUsuarioPorId } from "@/lib/db";
import { usuarioIdDeSesion } from "@/lib/userAuth";
import { PRECIO_PAQUETE_CENTAVOS } from "@/lib/config";

export async function POST(req: NextRequest) {
  const usuarioId = usuarioIdDeSesion(req);
  if (!usuarioId) {
    return NextResponse.json({ error: "Necesitas iniciar sesión primero." }, { status: 401 });
  }

  try {
    const usuario = await obtenerUsuarioPorId(usuarioId);
    if (!usuario) {
      return NextResponse.json({ error: "Necesitas iniciar sesión primero." }, { status: 401 });
    }

    const codigo = await crearSolicitudTransferencia(usuario.id, usuario.correo, PRECIO_PAQUETE_CENTAVOS);
    return NextResponse.json({ ok: true, codigo });
  } catch (error) {
    console.error("Error al registrar solicitud de transferencia:", error);
    return NextResponse.json({ error: "No se pudo registrar tu solicitud." }, { status: 500 });
  }
}
