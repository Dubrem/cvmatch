import { NextRequest, NextResponse } from "next/server";
import { registrarVisita } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { path } = await req.json();
    await registrarVisita(typeof path === "string" ? path.slice(0, 200) : "/");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error al registrar visita:", error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
