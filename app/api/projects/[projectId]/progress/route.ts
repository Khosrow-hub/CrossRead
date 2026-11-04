import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, readingProgress } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

const progressSchema = z.object({
  currentLocation: z.string().max(200).optional(),
  progressPercentage: z.number().int().min(0).max(100).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { projectId } = await params;

  const projectRows = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, user.id)))
    .limit(1);

  if (projectRows.length === 0) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = progressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const existing = await db
    .select({ id: readingProgress.id })
    .from(readingProgress)
    .where(
      and(
        eq(readingProgress.userId, user.id),
        eq(readingProgress.projectId, projectId)
      )
    )
    .limit(1);

  const now = new Date();

  if (existing.length === 0) {
    await db.insert(readingProgress).values({
      userId: user.id,
      projectId,
      currentLocation: parsed.data.currentLocation ?? "Started reading",
      progressPercentage: parsed.data.progressPercentage ?? 0,
      lastReadAt: now,
      updatedAt: now,
    });
  } else {
    const update: Record<string, unknown> = {
      lastReadAt: now,
      updatedAt: now,
    };
    if (parsed.data.currentLocation !== undefined) {
      update.currentLocation = parsed.data.currentLocation;
    }
    if (parsed.data.progressPercentage !== undefined) {
      update.progressPercentage = parsed.data.progressPercentage;
    }

    await db
      .update(readingProgress)
      .set(update)
      .where(eq(readingProgress.id, existing[0].id));
  }

  return NextResponse.json({ ok: true });
}