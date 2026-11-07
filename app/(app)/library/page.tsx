import Link from "next/link";
import { eq, desc, count, and } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  books,
  projects,
  annotations,
  versions,
  readingProgress,
  suggestions,
} from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/require-user";
import { LibraryLayout } from "@/features/reading/components/LibraryLayout";

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default async function LibraryPage() {
  const user = await requireUser();

  const myProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      bookTitle: books.title,
    })
    .from(projects)
    .innerJoin(books, eq(projects.bookId, books.id))
    .where(eq(projects.ownerId, user.id))
    .orderBy(desc(projects.updatedAt))
    .limit(3);

  const recentNotes = await db
    .select({
      id: annotations.id,
      content: annotations.content,
    })
    .from(annotations)
    .innerJoin(projects, eq(annotations.projectId, projects.id))
    .where(eq(projects.ownerId, user.id))
    .orderBy(desc(annotations.createdAt))
    .limit(2);

  const recentVersions = await db
    .select({
      id: versions.id,
      message: versions.message,
      createdAt: versions.createdAt,
      projectName: projects.name,
    })
    .from(versions)
    .innerJoin(projects, eq(versions.projectId, projects.id))
    .where(eq(projects.ownerId, user.id))
    .orderBy(desc(versions.createdAt))
    .limit(2);

  const versionCountResult = await db
    .select({ value: count() })
    .from(versions)
    .innerJoin(projects, eq(versions.projectId, projects.id))
    .where(eq(projects.ownerId, user.id));
  const versionCount = versionCountResult[0]?.value ?? 0;

  const suggestionsCountResult = await db
    .select({ value: count() })
    .from(suggestions)
    .innerJoin(projects, eq(suggestions.targetProjectId, projects.id))
    .where(
      and(
        eq(projects.ownerId, user.id),
        eq(suggestions.status, "open")
      )
    );
  const openSuggestionCount = suggestionsCountResult[0]?.value ?? 0;

  const progressRows = await db
    .select({
      projectId: readingProgress.projectId,
      projectName: projects.name,
      bookTitle: books.title,
      bookAuthor: books.author,
      currentLocation: readingProgress.currentLocation,
      progressPercentage: readingProgress.progressPercentage,
      lastReadAt: readingProgress.lastReadAt,
    })
    .from(readingProgress)
    .innerJoin(projects, eq(readingProgress.projectId, projects.id))
    .innerJoin(books, eq(projects.bookId, books.id))
    .where(eq(readingProgress.userId, user.id))
    .orderBy(desc(readingProgress.lastReadAt))
    .limit(1);

  const current = progressRows[0] ?? null;

  let latestVersion: { message: string; createdAt: Date } | null = null;
  if (current) {
    const versionRows = await db
      .select({ message: versions.message, createdAt: versions.createdAt })
      .from(versions)
      .where(eq(versions.projectId, current.projectId))
      .orderBy(desc(versions.createdAt))
      .limit(1);
    latestVersion = versionRows[0] ?? null;
  }

  return (
    <LibraryLayout
      current={
        current
          ? {
              projectId: current.projectId,
              bookTitle: current.bookTitle,
              bookAuthor: current.bookAuthor,
              currentLocation: current.currentLocation,
              progressPercentage: current.progressPercentage,
              lastReadAt: current.lastReadAt.toISOString(),
              lastReadAgo: timeAgo(current.lastReadAt),
              latestVersionMessage: latestVersion?.message ?? null,
            }
          : null
      }
      myProjects={myProjects.map((p) => ({
        id: p.id,
        name: p.name,
        bookTitle: p.bookTitle,
      }))}
      recentNotes={recentNotes.map((n) => ({
        id: n.id,
        content: n.content,
      }))}
      recentVersions={recentVersions.map((v) => ({
        id: v.id,
        message: v.message,
        projectName: v.projectName,
        createdAtAgo: timeAgo(v.createdAt),
      }))}
      versionCount={versionCount}
      openSuggestionCount={openSuggestionCount}
    />
  );
}