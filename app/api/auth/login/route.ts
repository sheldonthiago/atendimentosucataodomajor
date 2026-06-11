import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { getSession } from "@/lib/session";
import { z } from "zod";

const schema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(128),
});

function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) {
      // Still run comparison to avoid timing leak
      timingSafeEqual(bufA, bufA);
      return false;
    }
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const { username, password } = parsed.data;
  const validUser = process.env.ADMIN_USERNAME ?? "";
  const validPass = process.env.ADMIN_PASSWORD ?? "";

  if (!validUser || !validPass) {
    return NextResponse.json(
      { error: "Servidor não configurado" },
      { status: 500 }
    );
  }

  const userOk = safeCompare(username, validUser);
  const passOk = safeCompare(password, validPass);

  if (!userOk || !passOk) {
    return NextResponse.json(
      { error: "Usuário ou senha inválidos" },
      { status: 401 }
    );
  }

  const session = await getSession();
  session.isLoggedIn = true;
  session.username = username;
  await session.save();

  return NextResponse.json({ ok: true });
}
