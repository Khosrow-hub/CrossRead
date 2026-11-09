import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, and, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, annotations, versions, versionEdits } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { isUuid } from "@/lib/validators/uuid";

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
  if (!isUuid(projectId)) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

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

  const pendingRows = await db
    .select()
    .from(annotations)
    .where(
      and(
        eq(annotations.projectId, projectId),
        isNotNull(annotations.pendingAction)
      )
    );

  if (pendingRows.length === 0) {
    return NextResponse.json({ error: "Nothing to save" }, { status: 400 });
  }

  const creates = pendingRows.filter((r) => r.pendingAction === "create").length;
  const updates = pendingRows.filter((r) => r.pendingAction === "update").length;
  const deletes = pendingRows.filter((r) => r.pendingAction === "delete").length;

  const autoParts: string[] = [];
  if (creates > 0) autoParts.push(`${creates} new`);
  if (updates > 0) autoParts.push(`${updates} edited`);
  if (deletes > 0) autoParts.push(`${deletes} deleted`);

  const message =
    parsed.data.message && parsed.data.message.trim().length > 0
      ? parsed.data.message.trim()
      : `Saved ${autoParts.join(", ")}`;

  try {
    const result = await db.transaction(async (tx) => {
      const [version] = await tx
        .insert(versions)
        .values({
          projectId,
          authorId: user.id,
          message,
        })
        .returning({
          id: versions.id,
          message: versions.message,
          createdAt: versions.createdAt,
        });

      for (const annotation of pendingRows) {
        if (annotation.pendingAction === "create") {
          await tx.insert(versionEdits).values({
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

        if (annotation.pendingAction === "update") {
          const lastEditRows = await tx
            .select({ afterData: versionEdits.afterData })
            .from(versionEdits)
            .where(eq(versionEdits.annotationId, annotation.id))
            .orderBy(versionEdits.createdAt);

          let before: unknown = null;
          if (lastEditRows.length > 0) {
            for (const row of lastEditRows) {
              if (row.afterData) before = row.afterData;
            }
          }

          await tx.insert(versionEdits).values({
            versionId: version.id,
            annotationId: annotation.id,
            action: "update",
            beforeData: before,
            afterData: {
              type: annotation.type,
              content: annotation.content,
              passageId: annotation.passageId,
            },
          });
        }

        if (annotation.pendingAction === "delete") {
          const lastEditRows = await tx
            .select({ afterData: versionEdits.afterData })
            .from(versionEdits)
            .where(eq(versionEdits.annotationId, annotation.id))
            .orderBy(versionEdits.createdAt);

          let before: unknown = null;
          if (lastEditRows.length > 0) {
            for (const row of lastEditRows) {
              if (row.afterData) before = row.afterData;
            }
          }

          await tx.insert(versionEdits).values({
            versionId: version.id,
            annotationId: annotation.id,
            action: "delete",
            beforeData: before,
            afterData: null,
          });
        }
      }

      await tx
        .update(annotations)
        .set({
          pendingAction: null,
          isDraft: false,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(annotations.projectId, projectId),
            isNotNull(annotations.pendingAction)
          )
        );

      return version;
    });

    return NextResponse.json({ version: result }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}