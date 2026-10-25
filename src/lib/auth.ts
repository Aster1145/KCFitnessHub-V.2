import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users, type User } from "@/db/schema";

export const SESSION_COOKIE = "forge_session";
const SESSION_DAYS = 7;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const hash = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(key, "hex");
  return hash.length === keyBuf.length && crypto.timingSafeEqual(hash, keyBuf);
}

export async function createSession(userId: number) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await db.insert(sessions).values({ token, userId, expiresAt });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getSessionUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const rows = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1);

  return rows[0]?.user ?? null;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.token, token));
  jar.delete(SESSION_COOKIE);
}

/** Guard for portal layouts — single login for everyone, silently routed. */
export async function requireRole(role: "admin" | "member" | "trainer") {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== role) {
    // Authenticated but wrong portal — send them to their own home.
    redirect(
      user.role === "admin" ? "/admin" : user.role === "trainer" ? "/trainer" : "/member"
    );
  }
  return user;
}

export function homeForRole(role: string): string {
  return role === "admin" ? "/admin" : role === "trainer" ? "/trainer" : "/member";
}
