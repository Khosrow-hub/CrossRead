import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  projects,
  annotations,
  readingProgress,
  notifications,
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { projectId } = await params;

  const sourceRows = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (sourceRows.length === 0) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const source = sourceRows[0];

  if (source.visibility === "private" && source.ownerId !== user.id) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (source.ownerId === user.id) {
    return NextResponse.json(
      { error: "You already own this project" },
      { status: 400 }
    );
  }

  const baseSlug = slugify(`${source.name}-copy`) || "reading";
  let slug = baseSlug;
  let attempt = 1;

  while (true) {
    const existing = await db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.ownerId, user.id), eq(projects.slug, slug)))
      .limit(1);

    if (existing.length === 0) break;

    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }

  const [created] = await db
    .insert(projects)
    .values({
      slug,
      ownerId: user.id,
      bookId: source.bookId,
      name: `${source.name} copy`,
      description: source.description,
      visibility: source.visibility,
      forkedFromId: source.id,
    })
    .returning({ id: projects.id });

  const sourceAnnotations = await db
    .select()
    .from(annotations)
    .where(
      and(
        eq(annotations.projectId, source.id),
        eq(annotations.isDeleted, false)
      )
    );

  if (sourceAnnotations.length > 0) {
    await db.insert(annotations).values(
      sourceAnnotations.map((a) => ({
        projectId: created.id,
        passageId: a.passageId,
        authorId: a.authorId,
        type: a.type,
        content: a.content,
        isDeleted: false,
        isDraft: false,
        forkedFromAnnotationId: a.forkedFromAnnotationId ?? a.id,
      }))
    );
  }

  const sourceProgress = await db
    .select()
    .from(readingProgress)
    .where(eq(readingProgress.projectId, source.id))
    .limit(1);

  const location = sourceProgress[0]?.currentLocation ?? "Started reading";

  await db.insert(readingProgress).values({
    userId: user.id,
    projectId: created.id,
    currentLocation: location,
    progressPercentage: sourceProgress[0]?.progressPercentage ?? 0,
    lastReadAt: new Date(),
    updatedAt: new Date(),
  });

  if (source.ownerId !== user.id) {
    await db.insert(notifications).values({
      userId: source.ownerId,
      actorId: user.id,
      type: "project_forked",
      projectId: created.id,
    });
  }

  return NextResponse.json({ project: created }, { status: 201 });
}