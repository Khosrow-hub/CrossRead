import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  projects,
  books,
  versions,
  versionEdits,
} from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/require-user";

type Snapshot = {
  type: string;
  content: string;
  passageId: string;
};

export default async function VersionDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; versionId: string }>;
}) {
  const user = await requireUser();
  const { projectId, versionId } = await params;

  const versionRows = await db
    .select({
      id: versions.id,
      message: versions.message,
      createdAt: versions.createdAt,
      projectName: projects.name,
      bookTitle: books.title,
      bookAuthor: books.author,
    })
    .from(versions)
    .innerJoin(projects, eq(versions.projectId, projects.id))
    .innerJoin(books, eq(projects.bookId, books.id))
    .where(
      and(
        eq(versions.id, versionId),
        eq(versions.projectId, projectId),
        eq(projects.ownerId, user.id)
      )
    )
    .limit(1);

  if (versionRows.length === 0) notFound();
  const version = versionRows[0];

  const edits = await db
    .select({
      id: versionEdits.id,
      action: versionEdits.action,
      beforeData: versionEdits.beforeData,
      afterData: versionEdits.afterData,
    })
    .from(versionEdits)
    .where(eq(versionEdits.versionId, versionId))
    .orderBy(asc(versionEdits.createdAt));

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
          {version.projectName}
        </div>
        <h1
          style={{
            fontSize: "1.6rem",
            fontWeight: 700,
            color: "var(--nr-text)",
            marginBottom: "0.25rem",
          }}
        >
          {version.message}
        </h1>
        <div style={{ fontSize: "0.9rem", color: "var(--nr-text-soft)" }}>
          {version.bookTitle} by {version.bookAuthor} ·{" "}
          {version.createdAt.toLocaleString()}
        </div>

        <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.75rem" }}>
          <Link
            href={`/projects/${projectId}/versions`}
            className="nr-button"
            style={{ width: "auto", textDecoration: "none" }}
          >
            Back to history
          </Link>
          <Link
            href={`/projects/${projectId}/read`}
            className="nr-link"
            style={{ alignSelf: "center", fontSize: "0.9rem" }}
          >
            Open reading
          </Link>
        </div>
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
          What changed
        </div>

        {edits.length === 0 ? (
          <p style={{ color: "var(--nr-text-soft)", fontSize: "0.9rem" }}>
            This version recorded no individual edits.
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {edits.map((e) => {
              const after = e.afterData as Snapshot | null;
              const before = e.beforeData as Snapshot | null;
              return (
                <li
                  key={e.id}
                  className="nr-inset"
                  style={{
                    padding: "1rem 1.25rem",
                    marginBottom: "0.75rem",
                    color: "var(--nr-text)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--nr-text-soft)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {e.action} {after?.type ?? before?.type ?? "annotation"}
                  </div>

                  {before && (
                    <div
                      style={{
                        fontSize: "0.9rem",
                        color: "var(--nr-text-soft)",
                        textDecoration: "line-through",
                        marginBottom: "0.4rem",
                      }}
                    >
                      {before.content}
                    </div>
                  )}

                  {after && (
                    <div
                      style={{ fontSize: "0.9rem", color: "var(--nr-text)" }}
                    >
                      {after.content}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}