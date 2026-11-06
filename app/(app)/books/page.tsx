import Link from "next/link";
import { asc, ilike, or, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { books, projects } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/require-user";

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireUser();
  const { q } = await searchParams;
  const term = q?.trim() ?? "";

  const rows = await db
    .select()
    .from(books)
    .where(
      term.length > 0
        ? or(
            ilike(books.title, `%${term}%`),
            ilike(books.author, `%${term}%`)
          )
        : undefined
    )
    .orderBy(asc(books.title));

  const myProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      bookId: projects.bookId,
    })
    .from(projects)
    .where(eq(projects.ownerId, user.id));

  const projectCountByBook = new Map<string, number>();
  for (const p of myProjects) {
    projectCountByBook.set(p.bookId, (projectCountByBook.get(p.bookId) ?? 0) + 1);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="nr-surface" style={{ padding: "2rem" }}>
        <h1
          style={{
            fontSize: "1.6rem",
            fontWeight: 700,
            color: "var(--nr-text)",
            marginBottom: "0.4rem",
          }}
        >
          Books
        </h1>
        <p
          style={{
            fontSize: "0.9rem",
            color: "var(--nr-text-soft)",
            marginBottom: "1.25rem",
          }}
        >
          Every reading project begins with a book. Pick one, or find it faster
          with search.
        </p>

        <form method="get">
          <input
            name="q"
            type="text"
            defaultValue={term}
            placeholder="Search books and authors"
            className="nr-input"
          />
        </form>
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
            No books match that search.
          </div>
        </div>
      ) : (
        rows.map((b) => {
          const count = projectCountByBook.get(b.id) ?? 0;
          return (
            <div
              key={b.id}
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
                {b.title.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: "16rem" }}>
                <Link
                  href={`/books/${b.slug}`}
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "var(--nr-text)",
                    textDecoration: "none",
                  }}
                >
                  {b.title}
                </Link>
                <div
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--nr-text-soft)",
                    marginTop: "0.15rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  {b.author}
                </div>
                {b.description && (
                  <p
                    style={{
                      fontSize: "0.9rem",
                      color: "var(--nr-text)",
                      lineHeight: 1.6,
                      marginBottom: "0.9rem",
                    }}
                  >
                    {b.description}
                  </p>
                )}
                <div
                  style={{
                    display: "flex",
                    gap: "0.75rem",
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <Link
                    href={`/books/${b.slug}`}
                    className="nr-button"
                    style={{ width: "auto", textDecoration: "none" }}
                  >
                    Open book
                  </Link>
                  <Link
                    href={`/projects/new?bookId=${b.id}`}
                    className="nr-link"
                    style={{ fontSize: "0.9rem" }}
                  >
                    Start a reading project
                  </Link>
                  {count > 0 && (
                    <span
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--nr-text-soft)",
                      }}
                    >
                      You have {count} project{count === 1 ? "" : "s"} on this
                      book
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}