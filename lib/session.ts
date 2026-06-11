import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  isLoggedIn: boolean;
  username: string;
}

const sessionOptions = {
  password: process.env.AUTH_SECRET!,
  cookieName: "sucata-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 8, // 8 horas
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function requireAuth(): Promise<void | never> {
  const session = await getSession();
  if (!session.isLoggedIn) {
    throw new Error("UNAUTHORIZED");
  }
}
