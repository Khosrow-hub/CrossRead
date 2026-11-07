import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { versions, projects } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { projectId } = await params;

  const projectRows = await db
    .select({
      id: projects.id,
      ownerId: projects.ownerId,
      visibility: projects.visibility,
    })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (projectRows.length === 0) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const project = projectRows[0];
  const canView = project.visibility === "public" || project.ownerId === user.id;
  if (!canView) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const rows = await db
    .select({
      id: versions.id,
      message: versions.message,
      createdAt: versions.createdAt,
      authorId: versions.authorId,
    })
    .from(versions)
    .where(eq(versions.projectId, projectId))
    .orderBy(desc(versions.createdAt));

  return NextResponse.json({ versions: rows });
}