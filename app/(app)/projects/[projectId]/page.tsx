import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, and, desc, count } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  projects,
  books,
  chapters,
  annotations,
  versions,
} from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/require-user";

export default async function ProjectOverviewPage({
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
      description: projects.description,
      visibility: projects.visibility,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      bookId: books.id,
      bookSlug: books.slug,
      bookTitle: books.title,
      bookAuthor: books.author,
      bookDescription: books.description,
    })
    .from(projects)
    .innerJoin(books, eq(projects.bookId, books.id))
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, user.id)))
    .limit(1);

  if (projectRows.length === 0) notFound();
  const project = projectRows[0];

  const chapterRows = await db
    .select({ id: chapters.id })
    .from(chapters)
    .where(eq(chapters.bookId, project.bookId));
  const chapterCount = chapterRows.length;

  const annotationCountResult = await db
    .select({ value: count() })
    .from(annotations)
    .where(
      and(
        eq(annotations.projectId, projectId),
        eq(annotations.isDeleted, false)
      )
    );
  const annotationCount = annotationCountResult[0]?.value ?? 0;

  const versionCountResult = await db
    .select({ value: count() })
    .from(versions)
    .where(eq(versions.projectId, projectId));
  const versionCount = versionCountResult[0]?.value ?? 0;

  const latestVersionRows = await db
    .select({
      id: versions.id,
      message: versions.message,
      createdAt: versions.createdAt,
    })
    .from(versions)
    .where(eq(versions.projectId, projectId))
    .orderBy(desc(versions.createdAt))
    .limit(1);
  const latestVersion = latestVersionRows[0] ?? null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="nr-surface" style={{ padding: "2rem" }}>
        <div
          style={{
            display: "flex",
            gap: "2rem",
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <div
            className="nr-inset"
            style={{
              width: "8rem",
              height: "11rem",
              borderRadius: "1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2.5rem",
              fontWeight: 700,
              color: "var(--nr-text-soft)",
              flexShrink: 0,
            }}
          >
            {project.bookTitle.charAt(0)}
          </div>
          <div style={{ flex: 1, minWidth: "16rem" }}>
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--nr-text-soft)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "0.4rem",
              }}
            >
              Reading project
            </div>
            <h1
              style={{
                fontSize: "1.9rem",
                fontWeight: 700,
                color: "var(--nr-text)",
                marginBottom: "0.25rem",
              }}
            >
              {project.name}
            </h1>
            <div
              style={{
                fontSize: "1rem",
                color: "var(--nr-text-soft)",
                marginBottom: "1rem",
              }}
            >
              {project.bookTitle} by {project.bookAuthor} · {project.visibility}
            </div>
            {project.description && (
              <p
                style={{
                  fontSize: "0.95rem",
                  color: "var(--nr-text)",
                  lineHeight: 1.6,
                  marginBottom: "1rem",
                }}
              >
                {project.description}
              </p>
            )}
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <Link
                href={`/projects/${project.id}/read`}
                className="nr-button"
                style={{ width: "auto", textDecoration: "none" }}
              >
                Open reader
              </Link>
              <Link
                href={`/projects/${project.id}/versions`}
                className="nr-button"
                style={{ width: "auto", textDecoration: "none" }}
              >
                Reading history
              </Link>
              <Link
                href={`/books/${project.bookSlug}`}
                className="nr-link"
                style={{ alignSelf: "center", fontSize: "0.9rem" }}
              >
                About the book
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(11rem, 1fr))",
          gap: "1rem",
        }}
      >
        <StatCard label="Chapters" value={chapterCount} />
        <StatCard label="Notes" value={annotationCount} />
        <StatCard label="Versions" value={versionCount} />
      </div>

      <div className="nr-surface" style={{ padding: "2rem" }}>
        <div
          style={{
            fontSize: "0.75rem",
            color: "var(--nr-text-soft)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: "1rem",
          }}
        >
          Latest version
        </div>

        {latestVersion ? (
          <Link
            href={`/projects/${project.id}/versions/${latestVersion.id}`}
            className="nr-surface-sm"
            style={{
              display: "block",
              padding: "1rem 1.25rem",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--nr-text)",
              }}
            >
              {latestVersion.message}
            </div>
            <div
              style={{
                fontSize: "0.85rem",
                color: "var(--nr-text-soft)",
                marginTop: "0.2rem",
              }}
            >
              {latestVersion.createdAt.toLocaleString()}
            </div>
          </Link>
        ) : (
          <p style={{ color: "var(--nr-text-soft)", fontSize: "0.9rem" }}>
            No versions saved yet. Open the reader and press save changes to
            create the first one.
          </p>
        )}
      </div>

      <div className="nr-surface" style={{ padding: "2rem" }}>
        <div
          style={{
            fontSize: "0.75rem",
            color: "var(--nr-text-soft)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: "1rem",
          }}
        >
          About the book
        </div>
        {project.bookDescription && (
          <p
            style={{
              fontSize: "0.95rem",
              color: "var(--nr-text)",
              lineHeight: 1.6,
              marginBottom: "0.75rem",
            }}
          >
            {project.bookDescription}
          </p>
        )}
        <Link
          href={`/books/${project.bookSlug}`}
          className="nr-link"
          style={{ fontSize: "0.9rem" }}
        >
          Open book page
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="nr-surface" style={{ padding: "1.25rem 1.5rem" }}>
      <div
        style={{
          fontSize: "0.7rem",
          color: "var(--nr-text-soft)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: "0.4rem",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "1.75rem",
          fontWeight: 700,
          color: "var(--nr-text)",
        }}
      >
        {value}
      </div>
    </div>
  );
}