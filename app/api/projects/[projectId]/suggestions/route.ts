import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  suggestions,
  annotations,
  projects,
  notifications,
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { isUuid } from "@/lib/validators/uuid";

const createSuggestionSchema = z.object({
  targetAnnotationId: z.string().uuid(),
  proposedContent: z.string().min(1, "The suggestion is empty").max(4000),
  note: z.string().max(1000).optional(),
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

  const sourceRows = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, user.id)))
    .limit(1);

  if (sourceRows.length === 0) {
    return NextResponse.json(
      { error: "Your fork was not found. Open the fork, not the original." },
      { status: 404 }
    );
  }

  const source = sourceRows[0];
  if (!source.forkedFromId) {
    return NextResponse.json(
      { error: "This project was not forked. Suggestions only come from a fork." },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const parsed = createSuggestionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const forkAnnotationRows = await db
      .select()
      .from(annotations)
      .where(eq(annotations.id, parsed.data.targetAnnotationId))
      .limit(1);

    if (forkAnnotationRows.length === 0) {
      return NextResponse.json(
        { error: "Annotation not found" },
        { status: 404 }
      );
    }

    const forkAnnotation = forkAnnotationRows[0];

    if (forkAnnotation.projectId !== projectId) {
      return NextResponse.json(
        { error: "That annotation is not part of your fork." },
        { status: 400 }
      );
    }

    const originalAnnotationId =
      forkAnnotation.forkedFromAnnotationId ?? forkAnnotation.id;

    const originalRows = await db
      .select()
      .from(annotations)
      .where(eq(annotations.id, originalAnnotationId))
      .limit(1);

    if (originalRows.length === 0) {
      return NextResponse.json(
        { error: "The original annotation could not be found." },
        { status: 404 }
      );
    }

    const original = originalRows[0];

    if (original.projectId !== source.forkedFromId) {
      return NextResponse.json(
        {
          error:
            "The original annotation does not belong to the project this fork was based on.",
        },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(suggestions)
      .values({
        sourceProjectId: projectId,
        targetProjectId: original.projectId,
        targetAnnotationId: original.id,
        authorId: user.id,
        proposedContent: parsed.data.proposedContent,
        note:
          parsed.data.note && parsed.data.note.trim().length > 0
            ? parsed.data.note.trim()
            : null,
        status: "open",
      })
      .returning({ id: suggestions.id });

    const targetProjectRows = await db
      .select({ ownerId: projects.ownerId })
      .from(projects)
      .where(eq(projects.id, original.projectId))
      .limit(1);

    if (
      targetProjectRows.length > 0 &&
      targetProjectRows[0].ownerId !== user.id
    ) {
      await db.insert(notifications).values({
        userId: targetProjectRows[0].ownerId,
        actorId: user.id,
        type: "suggestion_received",
        projectId: original.projectId,
        suggestionId: created.id,
      });
    }

    return NextResponse.json({ suggestion: created }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}