import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { annotations, projects } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

const createAnnotationSchema = z.object({
  passageId: z.string().uuid(),
  type: z.enum(["highlight", "note", "question", "interpretation"]),
  content: z.string().min(1, "Write something").max(4000),
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

  try {
    const body = await request.json();
    const parsed = createAnnotationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
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
      })
      .returning({
        id: annotations.id,
        passageId: annotations.passageId,
        type: annotations.type,
        content: annotations.content,
        createdAt: annotations.createdAt,
      });

    return NextResponse.json({ annotation: created }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}