import { NextResponse } from "next/server";
import { USER_COOKIE_NAME } from "@/lib/userAuth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(USER_COOKIE_NAME);
  return res;
}
