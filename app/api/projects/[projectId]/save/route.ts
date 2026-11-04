import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, annotations, versions, versionEdits } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

const saveSchema = z.object({
  message: z.string().max(200).optional(),
});

export async function POST(
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

  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const draftRows = await db
    .select()
    .from(annotations)
    .where(
      and(
        eq(annotations.projectId, projectId),
        eq(annotations.isDraft, true),
        eq(annotations.isDeleted, false)
      )
    );

  if (draftRows.length === 0) {
    return NextResponse.json(
      { error: "Nothing to save" },
      { status: 400 }
    );
  }

  const message =
    parsed.data.message && parsed.data.message.trim().length > 0
      ? parsed.data.message.trim()
      : `Saved ${draftRows.length} change${draftRows.length === 1 ? "" : "s"}`;

  const [version] = await db
    .insert(versions)
    .values({
      projectId,
      authorId: user.id,
      message,
    })
    .returning({ id: versions.id, message: versions.message, createdAt: versions.createdAt });

  for (const annotation of draftRows) {
    await db.insert(versionEdits).values({
      versionId: version.id,
      annotationId: annotation.id,
      action: "create",
      beforeData: null,
      afterData: {
        type: annotation.type,
        content: annotation.content,
        passageId: annotation.passageId,
      },
    });
  }

  await db
    .update(annotations)
    .set({ isDraft: false, updatedAt: new Date() })
    .where(
      and(
        eq(annotations.projectId, projectId),
        eq(annotations.isDraft, true)
      )
    );

  return NextResponse.json({ version }, { status: 201 });
}