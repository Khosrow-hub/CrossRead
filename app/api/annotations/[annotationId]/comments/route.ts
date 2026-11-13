import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  annotations,
  annotationComments,
  projects,
  users,
  notifications,
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { isUuid } from "@/lib/validators/uuid";

const createSchema = z.object({
  content: z.string().min(1, "Write something").max(2000),
});

async function loadAnnotationWithAccess(
  annotationId: string,
  userId: string
) {
  const rows = await db
    .select({
      id: annotations.id,
      projectId: annotations.projectId,
      authorId: annotations.authorId,
      isDeleted: annotations.isDeleted,
      ownerId: projects.ownerId,
      visibility: projects.visibility,
    })
    .from(annotations)
    .innerJoin(projects, eq(annotations.projectId, projects.id))
    .where(eq(annotations.id, annotationId))
    .limit(1);

  if (rows.length === 0) return null;
  const row = rows[0];
  if (row.isDeleted) return null;
  const canView = row.visibility === "public" || row.ownerId === userId;
  if (!canView) return null;
  return row;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ annotationId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { annotationId } = await params;
  if (!isUuid(annotationId)) {
    return NextResponse.json(
      { error: "Annotation not found" },
      { status: 404 }
    );
  }

  const annotation = await loadAnnotationWithAccess(annotationId, user.id);
  if (!annotation) {
    return NextResponse.json(
      { error: "Annotation not found" },
      { status: 404 }
    );
  }

  const rows = await db
    .select({
      id: annotationComments.id,
      content: annotationComments.content,
      createdAt: annotationComments.createdAt,
      authorId: annotationComments.authorId,
      authorUsername: users.username,
      authorDisplayName: users.displayName,
    })
    .from(annotationComments)
    .innerJoin(users, eq(annotationComments.authorId, users.id))
    .where(eq(annotationComments.annotationId, annotationId))
    .orderBy(asc(annotationComments.createdAt));

  return NextResponse.json({ comments: rows });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ annotationId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { annotationId } = await params;
  if (!isUuid(annotationId)) {
    return NextResponse.json(
      { error: "Annotation not found" },
      { status: 404 }
    );
  }

  const annotation = await loadAnnotationWithAccess(annotationId, user.id);
  if (!annotation) {
    return NextResponse.json(
      { error: "Annotation not found" },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(annotationComments)
      .values({
        annotationId,
        authorId: user.id,
        content: parsed.data.content.trim(),
      })
      .returning({
        id: annotationComments.id,
        createdAt: annotationComments.createdAt,
      });

    if (annotation.authorId !== user.id) {
      await db.insert(notifications).values({
        userId: annotation.authorId,
        actorId: user.id,
        type: "comment_received",
        projectId: annotation.projectId,
        annotationId: annotationId,
      });
    }

    return NextResponse.json(
      {
        comment: {
          id: created.id,
          content: parsed.data.content.trim(),
          createdAt: created.createdAt,
          authorId: user.id,
          authorUsername: user.username,
          authorDisplayName: user.displayName,
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}