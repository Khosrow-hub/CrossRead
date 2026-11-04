import { NextResponse } from "next/server";
import { eq, desc, and } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  readingProgress,
  projects,
  books,
  versions,
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rows = await db
    .select({
      progressId: readingProgress.id,
      projectId: projects.id,
      projectName: projects.name,
      bookTitle: books.title,
      bookAuthor: books.author,
      bookCover: books.coverUrl,
      currentLocation: readingProgress.currentLocation,
      progressPercentage: readingProgress.progressPercentage,
      lastReadAt: readingProgress.lastReadAt,
    })
    .from(readingProgress)
    .innerJoin(projects, eq(readingProgress.projectId, projects.id))
    .innerJoin(books, eq(projects.bookId, books.id))
    .where(
      and(
        eq(readingProgress.userId, user.id),
        eq(projects.ownerId, user.id)
      )
    )
    .orderBy(desc(readingProgress.lastReadAt))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ continueReading: null });
  }

  const row = rows[0];

  const latestVersionRows = await db
    .select({
      id: versions.id,
      message: versions.message,
      createdAt: versions.createdAt,
    })
    .from(versions)
    .where(eq(versions.projectId, row.projectId))
    .orderBy(desc(versions.createdAt))
    .limit(1);

  const latestVersion = latestVersionRows[0] ?? null;

  return NextResponse.json({
    continueReading: {
      projectId: row.projectId,
      projectName: row.projectName,
      bookTitle: row.bookTitle,
      bookAuthor: row.bookAuthor,
      bookCover: row.bookCover,
      currentLocation: row.currentLocation,
      progressPercentage: row.progressPercentage,
      lastReadAt: row.lastReadAt,
      latestVersion,
    },
  });
}