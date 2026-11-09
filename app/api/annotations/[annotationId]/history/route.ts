import { NextResponse } from "next/server";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  annotations,
  projects,
  versionEdits,
  versions,
  users,
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { isUuid } from "@/lib/validators/uuid";

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

  const annotationRows = await db
    .select({
      id: annotations.id,
      projectId: annotations.projectId,
      ownerId: projects.ownerId,
      visibility: projects.visibility,
    })
    .from(annotations)
    .innerJoin(projects, eq(annotations.projectId, projects.id))
    .where(eq(annotations.id, annotationId))
    .limit(1);

  if (annotationRows.length === 0) {
    return NextResponse.json(
      { error: "Annotation not found" },
      { status: 404 }
    );
  }

  const annotation = annotationRows[0];
  const canView =
    annotation.ownerId === user.id || annotation.visibility === "public";
  if (!canView) {
    return NextResponse.json(
      { error: "Annotation not found" },
      { status: 404 }
    );
  }

  const rows = await db
    .select({
      id: versionEdits.id,
      action: versionEdits.action,
      beforeData: versionEdits.beforeData,
      afterData: versionEdits.afterData,
      createdAt: versionEdits.createdAt,
      versionId: versionEdits.versionId,
      versionMessage: versions.message,
      authorUsername: users.username,
      authorDisplayName: users.displayName,
    })
    .from(versionEdits)
    .innerJoin(versions, eq(versionEdits.versionId, versions.id))
    .innerJoin(users, eq(versions.authorId, users.id))
    .where(eq(versionEdits.annotationId, annotationId))
    .orderBy(asc(versionEdits.createdAt));

  return NextResponse.json({ history: rows });
}