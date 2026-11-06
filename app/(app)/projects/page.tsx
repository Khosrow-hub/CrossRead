import Link from "next/link";
import { eq, desc, and, count, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  projects,
  books,
  annotations,
  versions,
  suggestions,
} from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/require-user";

export default async function ProjectsPage() {
  const user = await requireUser();

  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      visibility: projects.visibility,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      forkedFromId: projects.forkedFromId,
      bookTitle: books.title,
      bookAuthor: books.author,
      bookSlug: books.slug,
    })
    .from(projects)
    .innerJoin(books, eq(projects.bookId, books.id))
    .where(eq(projects.ownerId, user.id))
    .orderBy(desc(projects.updatedAt));

  const noteCounts = await db
    .select({
      projectId: annotations.projectId,
      value: count(),
    })
    .from(annotations)
    .where(eq(annotations.isDeleted, false))
    .groupBy(annotations.projectId);

  const versionCounts = await db
    .select({
      projectId: versions.projectId,
      value: count(),
    })
    .from(versions)
    .groupBy(versions.projectId);

  const suggestionCounts = await db
    .select({
      projectId: suggestions.targetProjectId,
      value: count(),
    })
    .from(suggestions)
    .where(eq(suggestions.status, "open"))
    .groupBy(suggestions.targetProjectId);

  const noteMap = new Map(noteCounts.map((r) => [r.projectId, r.value]));
  const versionMap = new Map(versionCounts.map((r) => [r.projectId, r.value]));
  const suggestionMap = new Map(
    suggestionCounts.map((r) => [r.projectId, r.value])
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div
        className="nr-surface"
        style={{
          padding: "2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.6rem",
              fontWeight: 700,
              color: "var(--nr-text)",
              marginBottom: "0.4rem",
            }}
          >
            Your projects
          </h1>
          <p
            style={{
              fontSize: "0.9rem",
              color: "var(--nr-text-soft)",
            }}
          >
            Every project is a reading of a book, with its own notes and
            versions.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="nr-button"
          style={{ width: "auto", textDecoration: "none" }}
        >
          New project
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="nr-surface" style={{ padding: "2rem" }}>
          <div
            style={{
              fontSize: "0.95rem",
              color: "var(--nr-text-soft)",
              fontStyle: "italic",
            }}
          >
            No projects yet. Start one from a book.
          </div>
        </div>
      ) : (
        rows.map((p) => {
          const notes = noteMap.get(p.id) ?? 0;
          const versionTotal = versionMap.get(p.id) ?? 0;
          const openSuggestions = suggestionMap.get(p.id) ?? 0;
          return (
            <div
              key={p.id}
              className="nr-surface"
              style={{
                padding: "1.5rem 2rem",
                display: "flex",
                gap: "1.75rem",
                alignItems: "flex-start",
                flexWrap: "wrap",
              }}
            >
              <div
                className="nr-inset"
                style={{
                  width: "6rem",
                  height: "8.5rem",
                  borderRadius: "0.9rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: "var(--nr-text-soft)",
                  flexShrink: 0,
                }}
              >
                {p.bookTitle.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: "16rem" }}>
                <Link
                  href={`/projects/${p.id}`}
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "var(--nr-text)",
                    textDecoration: "none",
                  }}
                >
                  {p.name}
                </Link>
                <div
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--nr-text-soft)",
                    marginTop: "0.15rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  {p.bookTitle} by {p.bookAuthor} · {p.visibility}
                </div>
                {p.description && (
                  <p
                    style={{
                      fontSize: "0.9rem",
                      color: "var(--nr-text)",
                      lineHeight: 1.6,
                      marginBottom: "0.9rem",
                    }}
                  >
                    {p.description}
                  </p>
                )}
                <div
                  style={{
                    display: "flex",
                    gap: "1.5rem",
                    fontSize: "0.8rem",
                    color: "var(--nr-text-soft)",
                    marginBottom: "0.9rem",
                    flexWrap: "wrap",
                  }}
                >
                  <span>
                    <strong style={{ color: "var(--nr-text)" }}>{notes}</strong>{" "}
                    note{notes === 1 ? "" : "s"}
                  </span>
                  <span>
                    <strong style={{ color: "var(--nr-text)" }}>
                      {versionTotal}
                    </strong>{" "}
                    version{versionTotal === 1 ? "" : "s"}
                  </span>
                  {openSuggestions > 0 && (
                    <span>
                      <strong style={{ color: "var(--nr-text)" }}>
                        {openSuggestions}
                      </strong>{" "}
                      open suggestion{openSuggestions === 1 ? "" : "s"}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "0.75rem",
                    flexWrap: "wrap",
                  }}
                >
                  <Link
                    href={`/projects/${p.id}/read`}
                    className="nr-button"
                    style={{ width: "auto", textDecoration: "none" }}
                  >
                    Open reader
                  </Link>
                  <Link
                    href={`/projects/${p.id}/versions`}
                    className="nr-link"
                    style={{ alignSelf: "center", fontSize: "0.9rem" }}
                  >
                    Reading history
                  </Link>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}