import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { eq, and, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions, users, type User } from "@/lib/db/schema";

// ---------------------------------------------------------------------------
// Session management.
//
// How it works:
// 1. On login, we generate a random 32 byte token (base64url).
// 2. We store the token in the sessions table, linked to the user, with an
//    expiry 7 days in the future.
// 3. We set an HTTP only cookie named "crossread_session" containing the token.
// 4. On every request, getCurrentUser() reads the cookie, looks up the session,
//    checks the expiry, and returns the user or null.
// 5. On logout, we delete the session row and clear the cookie.
//
// HTTP only means JavaScript in the browser cannot read the cookie.
// That is what protects against XSS stealing the session token.
// SameSite lax means the cookie is not sent on cross site requests.
// Secure is enabled in production so the cookie only travels over HTTPS.
// ---------------------------------------------------------------------------

const COOKIE_NAME = "crossread_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function createSession(userId: string): Promise<void> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.insert(sessions).values({
    id: token,
    userId,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const rows = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, token), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (rows.length === 0) {
    return null;
  }

  return rows[0].user;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (token) {
    await db.delete(sessions).where(eq(sessions.id, token));
  }

  cookieStore.delete(COOKIE_NAME);
}