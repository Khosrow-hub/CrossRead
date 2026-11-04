import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, books, versions } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/require-user";

export default async function ProjectVersionsPage({
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
      bookTitle: books.title,
      bookAuthor: books.author,
    })
    .from(projects)
    .innerJoin(books, eq(projects.bookId, books.id))
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, user.id)))
    .limit(1);

  if (projectRows.length === 0) notFound();
  const project = projectRows[0];

  const rows = await db
    .select({
      id: versions.id,
      message: versions.message,
      createdAt: versions.createdAt,
    })
    .from(versions)
    .where(eq(versions.projectId, projectId))
    .orderBy(desc(versions.createdAt));

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
          {project.name}
        </div>
        <h1
          style={{
            fontSize: "1.6rem",
            fontWeight: 700,
            color: "var(--nr-text)",
            marginBottom: "0.25rem",
          }}
        >
          Reading history
        </h1>
        <div style={{ fontSize: "0.9rem", color: "var(--nr-text-soft)" }}>
          {project.bookTitle} by {project.bookAuthor}
        </div>
      </div>

      <div className="nr-surface" style={{ padding: "2rem" }}>
        {rows.length === 0 ? (
          <p style={{ color: "var(--nr-text-soft)", fontSize: "0.9rem" }}>
            No versions saved yet. Save changes in the reader to create the
            first one.
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {rows.map((v) => (
              <li
                key={v.id}
                className="nr-surface-sm"
                style={{ padding: "1rem 1.25rem", marginBottom: "0.75rem" }}
              >
                <Link
                  href={`/projects/${projectId}/versions/${v.id}`}
                  style={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: "var(--nr-text)",
                    textDecoration: "none",
                  }}
                >
                  {v.message}
                </Link>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--nr-text-soft)",
                    marginTop: "0.2rem",
                  }}
                >
                  {v.createdAt.toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}