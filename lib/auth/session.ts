import { cookies } from "next/headers";
import { randomBytes, createHmac, timingSafeEqual } from "crypto";
import { eq, and, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions, users, type User } from "@/lib/db/schema";

const COOKIE_NAME = "crossread_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET is missing or too short. It must be at least 32 characters."
    );
  }
  return secret;
}

function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

function signToken(token: string): string {
  const hmac = createHmac("sha256", getSecret());
  hmac.update(token);
  return hmac.digest("base64url");
}

function verifySignature(token: string, signature: string): boolean {
  const expected = signToken(token);
  if (expected.length !== signature.length) return false;
  try {
    return timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}

export async function createSession(userId: string): Promise<void> {
  const token = generateToken();
  const signature = signToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.insert(sessions).values({
    id: token,
    userId,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, `${token}.${signature}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const parts = raw.split(".");
  if (parts.length !== 2) return null;
  const [token, signature] = parts;
  if (!token || !signature) return null;
  if (!verifySignature(token, signature)) return null;

  const rows = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, token), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (rows.length === 0) return null;
  return rows[0].user;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (raw) {
    const [token] = raw.split(".");
    if (token) {
      await db.delete(sessions).where(eq(sessions.id, token));
    }
  }
  cookieStore.delete(COOKIE_NAME);
}