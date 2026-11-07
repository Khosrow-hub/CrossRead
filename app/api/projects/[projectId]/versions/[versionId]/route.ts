import { NextResponse } from "next/server";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  versions,
  versionEdits,
  projects,
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(
  _request: Request,
  {
    params,
  }: { params: Promise<{ projectId: string; versionId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { projectId, versionId } = await params;

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

  const versionRows = await db
    .select()
    .from(versions)
    .where(and(eq(versions.id, versionId), eq(versions.projectId, projectId)))
    .limit(1);

  if (versionRows.length === 0) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  const version = versionRows[0];

  const edits = await db
    .select()
    .from(versionEdits)
    .where(eq(versionEdits.versionId, versionId))
    .orderBy(asc(versionEdits.createdAt));

  return NextResponse.json({ version, edits });
}