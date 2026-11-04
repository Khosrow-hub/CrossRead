import Link from "next/link";
import { asc, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { books } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/require-user";

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireUser();
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

  return (
    <div className="nr-surface" style={{ padding: "2rem" }}>
      <h1
        style={{
          fontSize: "1.4rem",
          fontWeight: 700,
          color: "var(--nr-text)",
          marginBottom: "1.5rem",
        }}
      >
        Books
      </h1>

      <form method="get" style={{ marginBottom: "1.5rem" }}>
        <input
          name="q"
          type="text"
          defaultValue={term}
          placeholder="Search books and authors"
          className="nr-input"
        />
      </form>

      {rows.length === 0 ? (
        <p style={{ color: "var(--nr-text-soft)", fontSize: "0.9rem" }}>
          No books found.
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {rows.map((b) => (
            <li
              key={b.id}
              className="nr-surface-sm"
              style={{ padding: "1rem", marginBottom: "0.75rem" }}
            >
              <Link
                href={`/books/${b.slug}`}
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  color: "var(--nr-text)",
                  textDecoration: "none",
                }}
              >
                {b.title}
              </Link>
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "var(--nr-text-soft)",
                  marginTop: "0.15rem",
                }}
              >
                {b.author}
              </div>
              {b.description && (
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--nr-text-soft)",
                    marginTop: "0.5rem",
                  }}
                >
                  {b.description}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}