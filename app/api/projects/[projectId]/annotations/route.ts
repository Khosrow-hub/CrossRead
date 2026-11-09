import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { annotations, projects, passages, chapters } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { isUuid } from "@/lib/validators/uuid";

const createAnnotationSchema = z.object({
  passageId: z.string().uuid(),
  type: z.enum(["highlight", "note", "question", "interpretation"]),
  content: z.string().min(1, "Write something").max(4000),
  startOffset: z.number().int().min(0).optional(),
  endOffset: z.number().int().min(0).optional(),
  selectedText: z.string().max(4000).optional(),
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
    .select({ id: projects.id, bookId: projects.bookId })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, user.id)))
    .limit(1);

  if (projectRows.length === 0) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const project = projectRows[0];

  try {
    const body = await request.json();
    const parsed = createAnnotationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const passageRows = await db
      .select({ id: passages.id })
      .from(passages)
      .innerJoin(chapters, eq(passages.chapterId, chapters.id))
      .where(
        and(
          eq(passages.id, parsed.data.passageId),
          eq(chapters.bookId, project.bookId)
        )
      )
      .limit(1);

    if (passageRows.length === 0) {
      return NextResponse.json(
        { error: "That passage does not belong to this book." },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(annotations)
      .values({
        projectId,
        passageId: parsed.data.passageId,
        authorId: user.id,
        type: parsed.data.type,
        content: parsed.data.content,
        isDraft: true,
        pendingAction: "create",
        startOffset: parsed.data.startOffset ?? null,
        endOffset: parsed.data.endOffset ?? null,
        selectedText: parsed.data.selectedText ?? null,
      })
      .returning({
        id: annotations.id,
        passageId: annotations.passageId,
        type: annotations.type,
        content: annotations.content,
        createdAt: annotations.createdAt,
        isDraft: annotations.isDraft,
        authorId: annotations.authorId,
        startOffset: annotations.startOffset,
        endOffset: annotations.endOffset,
        selectedText: annotations.selectedText,
      });

    return NextResponse.json({ annotation: created }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}