import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, and, ne, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, books, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/require-user";
import { isUuid } from "@/lib/validators/uuid";

export default async function ComparePickerPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const user = await requireUser();
  const { projectId } = await params;
  if (!isUuid(projectId)) notFound();

  const projectRows = await db
    .select({
      id: projects.id,
      name: projects.name,
      visibility: projects.visibility,
      ownerId: projects.ownerId,
      bookId: projects.bookId,
      bookTitle: books.title,
      bookAuthor: books.author,
      bookCoverUrl: books.coverUrl,
    })
    .from(projects)
    .innerJoin(books, eq(projects.bookId, books.id))
    .where(eq(projects.id, projectId))
    .limit(1);

  if (projectRows.length === 0) notFound();
  const project = projectRows[0];

  const canView =
    project.visibility === "public" || project.ownerId === user.id;
  if (!canView) notFound();

  const otherProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      ownerDisplayName: users.displayName,
      ownerUsername: users.username,
      description: projects.description,
    })
    .from(projects)
    .innerJoin(users, eq(projects.ownerId, users.id))
    .where(
      and(
        eq(projects.bookId, project.bookId),
        eq(projects.visibility, "public"),
        ne(projects.id, projectId)
      )
    )
    .orderBy(desc(projects.updatedAt));

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
          Compare readings
        </div>
        <h1
          style={{
            fontSize: "1.6rem",
            fontWeight: 700,
            color: "var(--nr-text)",
            marginBottom: "0.25rem",
          }}
        >
          {project.name}
        </h1>
        <div style={{ fontSize: "0.9rem", color: "var(--nr-text-soft)" }}>
          {project.bookTitle} by {project.bookAuthor}
        </div>
        <p
          style={{
            fontSize: "0.9rem",
            color: "var(--nr-text-soft)",
            marginTop: "1rem",
            maxWidth: "36rem",
          }}
        >
          Pick another public reading of the same book. The comparison shows the
          same passages side by side, so you can see where the two readers agree
          and where they do not.
        </p>
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
          Other public readings of this book
        </div>

        {otherProjects.length === 0 ? (
          <p style={{ color: "var(--nr-text-soft)", fontSize: "0.9rem" }}>
            No other public readings of this book yet. When someone else starts
            a public reading of the same book, they will appear here.
          </p>
        ) : (
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            {otherProjects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/compare/${project.id}/${p.id}`}
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
                    {p.name}
                  </div>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--nr-text-soft)",
                      marginTop: "0.15rem",
                    }}
                  >
                    by {p.ownerDisplayName ?? p.ownerUsername}
                  </div>
                  {p.description && (
                    <div
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--nr-text-soft)",
                        marginTop: "0.5rem",
                      }}
                    >
                      {p.description}
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link
        href={`/projects/${projectId}`}
        className="nr-link"
        style={{ fontSize: "0.9rem" }}
      >
        Back to project
      </Link>
    </div>
  );
}