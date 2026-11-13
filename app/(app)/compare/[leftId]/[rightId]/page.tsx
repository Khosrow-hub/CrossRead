import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, and, asc, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  projects,
  books,
  users,
  chapters,
  passages,
  annotations,
} from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/require-user";
import { isUuid } from "@/lib/validators/uuid";

type AnnotationRow = {
  id: string;
  projectId: string;
  passageId: string;
  type: "highlight" | "note" | "question" | "interpretation";
  content: string;
  selectedText: string | null;
};

export default async function ComparePage({
  params,
}: {
  params: Promise<{ leftId: string; rightId: string }>;
}) {
  const user = await requireUser();
  const { leftId, rightId } = await params;
  if (!isUuid(leftId) || !isUuid(rightId)) notFound();
  if (leftId === rightId) notFound();

  const projectRows = await db
    .select({
      id: projects.id,
      name: projects.name,
      ownerId: projects.ownerId,
      visibility: projects.visibility,
      bookId: projects.bookId,
      ownerDisplayName: users.displayName,
      ownerUsername: users.username,
      bookTitle: books.title,
      bookAuthor: books.author,
    })
    .from(projects)
    .innerJoin(books, eq(projects.bookId, books.id))
    .innerJoin(users, eq(projects.ownerId, users.id))
    .where(inArray(projects.id, [leftId, rightId]));

  if (projectRows.length !== 2) notFound();

  const left = projectRows.find((p) => p.id === leftId);
  const right = projectRows.find((p) => p.id === rightId);
  if (!left || !right) notFound();

  if (left.bookId !== right.bookId) notFound();

  const canViewLeft = left.visibility === "public" || left.ownerId === user.id;
  const canViewRight =
    right.visibility === "public" || right.ownerId === user.id;
  if (!canViewLeft || !canViewRight) notFound();

  const chapterRows = await db
    .select({
      id: chapters.id,
      title: chapters.title,
      position: chapters.position,
    })
    .from(chapters)
    .where(eq(chapters.bookId, left.bookId))
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
    .where(eq(chapters.bookId, left.bookId))
    .orderBy(asc(chapters.position), asc(passages.position));

  const annotationRows: AnnotationRow[] = await db
    .select({
      id: annotations.id,
      projectId: annotations.projectId,
      passageId: annotations.passageId,
      type: annotations.type,
      content: annotations.content,
      selectedText: annotations.selectedText,
    })
    .from(annotations)
    .where(
      and(
        inArray(annotations.projectId, [leftId, rightId]),
        eq(annotations.isDeleted, false),
        eq(annotations.isDraft, false)
      )
    )
    .orderBy(asc(annotations.createdAt));

  const byPassage = new Map<string, { left: AnnotationRow[]; right: AnnotationRow[] }>();
  for (const a of annotationRows) {
    const entry = byPassage.get(a.passageId) ?? { left: [], right: [] };
    if (a.projectId === leftId) entry.left.push(a);
    else if (a.projectId === rightId) entry.right.push(a);
    byPassage.set(a.passageId, entry);
  }

  const totalCompared = Array.from(byPassage.values()).filter(
    (e) => e.left.length > 0 || e.right.length > 0
  ).length;

  const agreements = Array.from(byPassage.values()).filter(
    (e) => e.left.length > 0 && e.right.length > 0
  ).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="nr-surface" style={{ padding: "2rem" }}>
        <div
          style={{
            fontSize: "0.75rem",
            color: "var(--nr-text-soft)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: "0.4rem",
          }}
        >
          Side by side
        </div>
        <h1
          style={{
            fontSize: "1.6rem",
            fontWeight: 700,
            color: "var(--nr-text)",
            marginBottom: "0.25rem",
          }}
        >
          {left.bookTitle} by {left.bookAuthor}
        </h1>
        <div style={{ fontSize: "0.9rem", color: "var(--nr-text-soft)" }}>
          {totalCompared} passage{totalCompared === 1 ? "" : "s"} annotated ·{" "}
          {agreements} where both readers wrote something
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
            marginTop: "1.5rem",
          }}
        >
          <Link
            href={`/projects/${left.id}`}
            className="nr-surface-sm"
            style={{ padding: "1rem 1.25rem", textDecoration: "none" }}
          >
            <div
              style={{
                fontSize: "0.7rem",
                color: "var(--nr-text-soft)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "0.25rem",
              }}
            >
              Left
            </div>
            <div
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--nr-text)",
              }}
            >
              {left.name}
            </div>
            <div
              style={{
                fontSize: "0.8rem",
                color: "var(--nr-text-soft)",
                marginTop: "0.15rem",
              }}
            >
              by {left.ownerDisplayName ?? left.ownerUsername}
            </div>
          </Link>
          <Link
            href={`/projects/${right.id}`}
            className="nr-surface-sm"
            style={{ padding: "1rem 1.25rem", textDecoration: "none" }}
          >
            <div
              style={{
                fontSize: "0.7rem",
                color: "var(--nr-text-soft)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "0.25rem",
              }}
            >
              Right
            </div>
            <div
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--nr-text)",
              }}
            >
              {right.name}
            </div>
            <div
              style={{
                fontSize: "0.8rem",
                color: "var(--nr-text-soft)",
                marginTop: "0.15rem",
              }}
            >
              by {right.ownerDisplayName ?? right.ownerUsername}
            </div>
          </Link>
        </div>
      </div>

      {chapterRows.map((chapter) => {
        const chapterPassages = passageRows.filter(
          (p) => p.chapterId === chapter.id
        );
        const chapterHasData = chapterPassages.some((p) => {
          const entry = byPassage.get(p.id);
          return entry && (entry.left.length > 0 || entry.right.length > 0);
        });
        if (!chapterHasData) return null;

        return (
          <div key={chapter.id} className="nr-surface" style={{ padding: "2rem" }}>
            <h2
              style={{
                fontSize: "1.05rem",
                fontWeight: 700,
                color: "var(--nr-text)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "1rem",
              }}
            >
              {chapter.title}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {chapterPassages.map((p) => {
                const entry = byPassage.get(p.id);
                if (!entry) return null;
                if (entry.left.length === 0 && entry.right.length === 0)
                  return null;

                return (
                  <div key={p.id}>
                    <div
                      className="nr-inset"
                      style={{
                        padding: "1rem 1.25rem",
                        fontSize: "0.95rem",
                        lineHeight: 1.7,
                        color: "var(--nr-text)",
                        marginBottom: "0.75rem",
                      }}
                    >
                      {p.text}
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "0.75rem",
                      }}
                    >
                      <Column
                        label={left.ownerDisplayName ?? left.ownerUsername}
                        annotations={entry.left}
                      />
                      <Column
                        label={right.ownerDisplayName ?? right.ownerUsername}
                        annotations={entry.right}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <Link
        href={`/projects/${leftId}`}
        className="nr-link"
        style={{ fontSize: "0.9rem" }}
      >
        Back to left project
      </Link>
    </div>
  );
}

function Column({
  label,
  annotations,
}: {
  label: string;
  annotations: AnnotationRow[];
}) {
  if (annotations.length === 0) {
    return (
      <div
        className="nr-inset"
        style={{
          padding: "0.75rem 1rem",
          fontSize: "0.85rem",
          color: "var(--nr-text-soft)",
          fontStyle: "italic",
        }}
      >
        {label} did not write anything here.
      </div>
    );
  }
  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
    >
      <div
        style={{
          fontSize: "0.7rem",
          color: "var(--nr-text-soft)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </div>
      {annotations.map((a) => (
        <div
          key={a.id}
          className="nr-inset"
          style={{
            padding: "0.75rem 1rem",
            fontSize: "0.9rem",
            color: "var(--nr-text)",
          }}
        >
          <div
            style={{
              fontSize: "0.7rem",
              color: "var(--nr-text-soft)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "0.3rem",
            }}
          >
            {a.type}
          </div>
          {a.selectedText && (
            <div
              style={{
                fontSize: "0.8rem",
                color: "var(--nr-text-soft)",
                fontStyle: "italic",
                marginBottom: "0.35rem",
              }}
            >
              &ldquo;{a.selectedText}&rdquo;
            </div>
          )}
          {a.type !== "highlight" && a.content}
        </div>
      ))}
    </div>
  );
}