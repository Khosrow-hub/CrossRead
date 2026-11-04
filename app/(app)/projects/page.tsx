import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, books } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/require-user";

export default async function ProjectsPage() {
  const user = await requireUser();

  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      visibility: projects.visibility,
      bookTitle: books.title,
      bookAuthor: books.author,
    })
    .from(projects)
    .innerJoin(books, eq(projects.bookId, books.id))
    .where(eq(projects.ownerId, user.id))
    .orderBy(desc(projects.updatedAt));

  return (
    <div className="nr-surface" style={{ padding: "2rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <h1
          style={{
            fontSize: "1.4rem",
            fontWeight: 700,
            color: "var(--nr-text)",
          }}
        >
          Your projects
        </h1>
        <Link
          href="/projects/new"
          className="nr-button"
          style={{ width: "auto", textDecoration: "none" }}
        >
          New project
        </Link>
      </div>

      {rows.length === 0 ? (
        <p style={{ color: "var(--nr-text-soft)", fontSize: "0.9rem" }}>
          No projects yet.
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {rows.map((p) => (
            <li
              key={p.id}
              className="nr-surface-sm"
              style={{ padding: "1rem", marginBottom: "0.75rem" }}
            >
              <Link
                href={`/projects/${p.id}`}
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  color: "var(--nr-text)",
                  textDecoration: "none",
                }}
              >
                {p.name}
              </Link>
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "var(--nr-text-soft)",
                  marginTop: "0.15rem",
                }}
              >
                {p.bookTitle} by {p.bookAuthor} · {p.visibility}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}