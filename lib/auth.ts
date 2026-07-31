import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { RoleSession } from "@/app/generated/prisma/client";

export const SESSION_COOKIE = "session_token";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours

export type SessionInfo =
  | { role: "ATHLETE"; athleteId: string }
  | { role: "ORGANISATEUR"; organisateurId: string };

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(
  role: RoleSession,
  userId: string
): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: {
      token,
      role,
      expiresAt,
      athleteId: role === "ATHLETE" ? userId : undefined,
      organisateurId: role === "ORGANISATEUR" ? userId : undefined,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });

  return token;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionInfo | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({ where: { token } });
  if (!session || session.expiresAt < new Date()) return null;

  if (session.role === "ATHLETE" && session.athleteId) {
    return { role: "ATHLETE", athleteId: session.athleteId };
  }
  if (session.role === "ORGANISATEUR" && session.organisateurId) {
    return { role: "ORGANISATEUR", organisateurId: session.organisateurId };
  }
  return null;
}

export function isMineur(dateNaissance: Date): boolean {
  const aujourdHui = new Date();
  let age = aujourdHui.getFullYear() - dateNaissance.getFullYear();
  const moisDiff = aujourdHui.getMonth() - dateNaissance.getMonth();
  if (
    moisDiff < 0 ||
    (moisDiff === 0 && aujourdHui.getDate() < dateNaissance.getDate())
  ) {
    age--;
  }
  return age < 18;
}
