import { NextResponse } from "next/server";
import { eq, desc, and } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  suggestions,
  annotations,
  projects,
  users,
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rows = await db
    .select({
      id: suggestions.id,
      proposedContent: suggestions.proposedContent,
      note: suggestions.note,
      status: suggestions.status,
      createdAt: suggestions.createdAt,
      targetProjectId: suggestions.targetProjectId,
      targetProjectName: projects.name,
      targetAnnotationId: suggestions.targetAnnotationId,
      originalContent: annotations.content,
      annotationType: annotations.type,
      authorUsername: users.username,
      authorDisplayName: users.displayName,
    })
    .from(suggestions)
    .innerJoin(projects, eq(suggestions.targetProjectId, projects.id))
    .innerJoin(annotations, eq(suggestions.targetAnnotationId, annotations.id))
    .innerJoin(users, eq(suggestions.authorId, users.id))
    .where(
      and(
        eq(projects.ownerId, user.id),
        eq(suggestions.status, "open")
      )
    )
    .orderBy(desc(suggestions.createdAt));

  return NextResponse.json({ suggestions: rows });
}