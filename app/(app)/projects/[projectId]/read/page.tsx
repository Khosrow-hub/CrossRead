import { notFound } from "next/navigation";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  projects,
  books,
  chapters,
  passages,
  annotations,
} from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/require-user";
import Reader from "@/features/reading/components/Reader";

export default async function ReadPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const user = await requireUser();
  const { projectId } = await params;

  const projectRows = await db
    .select({
      id: projects.id,
      name: projects.name,
      ownerId: projects.ownerId,
      bookId: projects.bookId,
      bookTitle: books.title,
      bookAuthor: books.author,
    })
    .from(projects)
    .innerJoin(books, eq(projects.bookId, books.id))
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, user.id)))
    .limit(1);

  if (projectRows.length === 0) notFound();
  const project = projectRows[0];

  const chapterRows = await db
    .select({
      id: chapters.id,
      title: chapters.title,
      position: chapters.position,
    })
    .from(chapters)
    .where(eq(chapters.bookId, project.bookId))
    .orderBy(asc(chapters.position));

  const passageRows = await db
    .select({
      id: passages.id,
      chapterId: passages.chapterId,
      text: passages.text,
      position: passages.position,
    })
    .from(passages)
    .innerJoin(chapters, eq(passages.chapterId, chapters.id))
    .where(eq(chapters.bookId, project.bookId))
    .orderBy(asc(chapters.position), asc(passages.position));

  const annotationRows = await db
    .select({
      id: annotations.id,
      passageId: annotations.passageId,
      type: annotations.type,
      content: annotations.content,
      createdAt: annotations.createdAt,
    })
    .from(annotations)
    .where(
      and(
        eq(annotations.projectId, projectId),
        eq(annotations.isDeleted, false)
      )
    )
    .orderBy(asc(annotations.createdAt));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div
        className="nr-surface"
        style={{
          padding: "1.25rem 1.5rem",
        }}
      >
        <div
          style={{
            fontSize: "0.75rem",
            color: "var(--nr-text-soft)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: "0.25rem",
          }}
        >
          {project.name}
        </div>
        <div
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "var(--nr-text)",
          }}
        >
          {project.bookTitle}
        </div>
        <div style={{ fontSize: "0.9rem", color: "var(--nr-text-soft)" }}>
          {project.bookAuthor}
        </div>
      </div>

      <Reader
        projectId={project.id}
        chapters={chapterRows}
        passages={passageRows}
        initialAnnotations={annotationRows.map((a) => ({
          ...a,
          createdAt: a.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}