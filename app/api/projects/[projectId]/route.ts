import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

const updateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  description: z.string().max(400).optional(),
  visibility: z.enum(["private", "public"]).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { projectId } = await params;

  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const project = rows[0];
  const canView = project.visibility === "public" || project.ownerId === user.id;
  if (!canView) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ project });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { projectId } = await params;

  const rows = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, user.id)))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
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

    const updates: Record<string, string | Date | null> = {
      updatedAt: new Date(),
    };
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.description !== undefined) {
      const trimmed = parsed.data.description.trim();
      updates.description = trimmed.length > 0 ? trimmed : null;
    }
    if (parsed.data.visibility !== undefined) {
      updates.visibility = parsed.data.visibility;
    }

    const [updated] = await db
      .update(projects)
      .set(updates)
      .where(eq(projects.id, projectId))
      .returning();

    return NextResponse.json({ project: updated });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { projectId } = await params;

  const rows = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, user.id)))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  await db.delete(projects).where(eq(projects.id, projectId));

  return NextResponse.json({ ok: true });
}