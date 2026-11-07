import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  suggestions,
  annotations,
  projects,
  versions,
  versionEdits,
  notifications,
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

const actionSchema = z.object({
  action: z.enum(["accept", "decline"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ suggestionId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { suggestionId } = await params;

  const suggestionRows = await db
    .select()
    .from(suggestions)
    .where(eq(suggestions.id, suggestionId))
    .limit(1);

  if (suggestionRows.length === 0) {
    return NextResponse.json(
      { error: "Suggestion not found" },
      { status: 404 }
    );
  }

  const suggestion = suggestionRows[0];

  const targetRows = await db
    .select()
    .from(projects)
    .where(eq(projects.id, suggestion.targetProjectId))
    .limit(1);

  if (targetRows.length === 0) {
    return NextResponse.json(
      { error: "Target project not found" },
      { status: 404 }
    );
  }

  const target = targetRows[0];

  if (target.ownerId !== user.id) {
    return NextResponse.json(
      { error: "Only the project owner can respond to this suggestion." },
      { status: 403 }
    );
  }

  if (suggestion.status !== "open") {
    return NextResponse.json(
      { error: "This suggestion has already been handled." },
      { status: 400 }
    );
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  if (parsed.data.action === "decline") {
    await db
      .update(suggestions)
      .set({ status: "declined", updatedAt: new Date() })
      .where(eq(suggestions.id, suggestionId));

    if (suggestion.authorId !== user.id) {
      await db.insert(notifications).values({
        userId: suggestion.authorId,
        actorId: user.id,
        type: "suggestion_declined",
        projectId: target.id,
        suggestionId: suggestion.id,
      });
    }

    return NextResponse.json({ ok: true, status: "declined" });
  }

  const annotationRows = await db
    .select()
    .from(annotations)
    .where(eq(annotations.id, suggestion.targetAnnotationId))
    .limit(1);

  if (annotationRows.length === 0) {
    return NextResponse.json(
      { error: "Annotation not found" },
      { status: 404 }
    );
  }

  const annotation = annotationRows[0];

  const [version] = await db
    .insert(versions)
    .values({
      projectId: target.id,
      authorId: user.id,
      message: `Accepted a suggestion from another reader`,
    })
    .returning({ id: versions.id });

  await db.insert(versionEdits).values({
    versionId: version.id,
    annotationId: annotation.id,
    action: "update",
    beforeData: {
      type: annotation.type,
      content: annotation.content,
      passageId: annotation.passageId,
    },
    afterData: {
      type: annotation.type,
      content: suggestion.proposedContent,
      passageId: annotation.passageId,
    },
  });

  await db
    .update(annotations)
    .set({
      content: suggestion.proposedContent,
      updatedAt: new Date(),
    })
    .where(eq(annotations.id, annotation.id));

  await db
    .update(suggestions)
    .set({ status: "accepted", updatedAt: new Date() })
    .where(eq(suggestions.id, suggestionId));

  if (suggestion.authorId !== user.id) {
    await db.insert(notifications).values({
      userId: suggestion.authorId,
      actorId: user.id,
      type: "suggestion_accepted",
      projectId: target.id,
      suggestionId: suggestion.id,
    });
  }

  return NextResponse.json({ ok: true, status: "accepted" });
}