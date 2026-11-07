import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { annotations, projects } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

const updateSchema = z.object({
  content: z.string().min(1).max(4000).optional(),
  type: z
    .enum(["highlight", "note", "question", "interpretation"])
    .optional(),
});

async function loadAnnotationWithAccess(
  annotationId: string,
  userId: string
) {
  const rows = await db
    .select({
      id: annotations.id,
      projectId: annotations.projectId,
      ownerId: projects.ownerId,
      content: annotations.content,
      type: annotations.type,
      isDeleted: annotations.isDeleted,
    })
    .from(annotations)
    .innerJoin(projects, eq(annotations.projectId, projects.id))
    .where(eq(annotations.id, annotationId))
    .limit(1);

  if (rows.length === 0) return null;
  const row = rows[0];
  if (row.ownerId !== userId) return null;
  if (row.isDeleted) return null;
  return row;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ annotationId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { annotationId } = await params;
  const existing = await loadAnnotationWithAccess(annotationId, user.id);
  if (!existing) {
    return NextResponse.json(
      { error: "Annotation not found" },
      { status: 404 }
    );
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

    const update: Record<string, string | Date> = {
      updatedAt: new Date(),
    };
    if (parsed.data.content !== undefined) {
      update.content = parsed.data.content;
    }
    if (parsed.data.type !== undefined) {
      update.type = parsed.data.type;
    }

    const [updated] = await db
      .update(annotations)
      .set(update)
      .where(eq(annotations.id, annotationId))
      .returning({
        id: annotations.id,
        content: annotations.content,
        type: annotations.type,
        updatedAt: annotations.updatedAt,
      });

    return NextResponse.json({ annotation: updated });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ annotationId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { annotationId } = await params;
  const existing = await loadAnnotationWithAccess(annotationId, user.id);
  if (!existing) {
    return NextResponse.json(
      { error: "Annotation not found" },
      { status: 404 }
    );
  }

  await db
    .update(annotations)
    .set({ isDeleted: true, updatedAt: new Date() })
    .where(and(eq(annotations.id, annotationId), eq(annotations.isDeleted, false)));

  return NextResponse.json({ ok: true });
}