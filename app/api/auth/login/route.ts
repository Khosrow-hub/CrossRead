import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

const loginSchema = z.object({
  identifier: z.string().min(1, "Enter your username or email"),
  password: z.string().min(1, "Enter your password"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { identifier, password } = parsed.data;

    const rows = await db
      .select()
      .from(users)
      .where(or(eq(users.username, identifier), eq(users.email, identifier)))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const user = rows[0];
    const valid = await verifyPassword(password, user.passwordHash);

    if (!valid) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    await createSession(user.id);

    return NextResponse.json({
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}