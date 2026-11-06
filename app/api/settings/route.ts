import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

const updateSchema = z.object({
  displayName: z.string().max(80).optional(),
  bio: z.string().max(500).optional(),
});

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const updates: Record<string, string | null | Date> = {};
    if (parsed.data.displayName !== undefined) {
      const trimmed = parsed.data.displayName.trim();
      updates.displayName = trimmed.length > 0 ? trimmed : null;
    }
    if (parsed.data.bio !== undefined) {
      const trimmed = parsed.data.bio.trim();
      updates.bio = trimmed.length > 0 ? trimmed : null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: true });
    }

    updates.updatedAt = new Date();

    await db.update(users).set(updates).where(eq(users.id, user.id));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[settings] failed", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}