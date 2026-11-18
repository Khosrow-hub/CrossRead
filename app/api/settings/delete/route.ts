import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, and, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, projects, suggestions } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";

const deleteSchema = z.object({
  password: z.string().min(1, "Enter your password to confirm"),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const valid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Password is incorrect" },
        { status: 401 }
      );
    }

    await db.transaction(async (tx) => {
      const myProjects = await tx
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.ownerId, user.id));

      const myProjectIds = myProjects.map((p) => p.id);

      if (myProjectIds.length > 0) {
        await tx
          .update(suggestions)
          .set({ status: "declined", updatedAt: new Date() })
          .where(
            and(
              eq(suggestions.status, "open"),
              ne(suggestions.authorId, user.id)
            )
          );
      }

      await tx.delete(users).where(eq(users.id, user.id));
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}