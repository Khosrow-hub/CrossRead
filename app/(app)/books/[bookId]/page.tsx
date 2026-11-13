import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, desc, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { books, projects, chapters } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/require-user";

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const user = await requireUser();
  const { bookId } = await params;

  const bookRows = await db
    .select()
    .from(books)
    .where(eq(books.slug, bookId))
    .limit(1);

  if (bookRows.length === 0) notFound();
  const book = bookRows[0];

  const chapterRows = await db
    .select({ id: chapters.id })
    .from(chapters)
    .where(eq(chapters.bookId, book.id));
  const chapterCount = chapterRows.length;

  const projectsForBook = await db
    .select({
      id: projects.id,
      name: projects.name,
      visibility: projects.visibility,
      createdAt: projects.createdAt,
    })
    .from(projects)
    .where(and(eq(projects.bookId, book.id), eq(projects.ownerId, user.id)))
    .orderBy(desc(projects.createdAt));

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
              overflow: "hidden",
            }}
          >
            {book.coverUrl ? (
              <img
                src={book.coverUrl}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              book.title.charAt(0)
            )}
          </div>
          <div style={{ flex: 1, minWidth: "16rem" }}>
            <h1
              style={{
                fontSize: "1.9rem",
                fontWeight: 700,
                color: "var(--nr-text)",
                marginBottom: "0.25rem",
              }}
            >
              {book.title}
            </h1>
            <div
              style={{
                fontSize: "1rem",
                color: "var(--nr-text-soft)",
                marginBottom: "1rem",
              }}
            >
              {book.author}
            </div>
            {book.description && (
              <p
                style={{
                  fontSize: "0.95rem",
                  color: "var(--nr-text)",
                  lineHeight: 1.6,
                  marginBottom: "1rem",
                }}
              >
                {book.description}
              </p>
            )}
            <div
              style={{
                fontSize: "0.85rem",
                color: "var(--nr-text-soft)",
                marginBottom: "1.25rem",
              }}
            >
              {chapterCount} chapter{chapterCount === 1 ? "" : "s"}
            </div>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <Link
                href={`/projects/new?bookId=${book.id}`}
                className="nr-button"
                style={{ width: "auto", textDecoration: "none" }}
              >
                Start a reading project
              </Link>
              <Link
                href="/books"
                className="nr-link"
                style={{ alignSelf: "center", fontSize: "0.9rem" }}
              >
                Back to books
              </Link>
            </div>
          </div>
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
          Your projects on this book
        </div>

        {projectsForBook.length === 0 ? (
          <p style={{ color: "var(--nr-text-soft)", fontSize: "0.9rem" }}>
            You have no projects on this book yet.
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {projectsForBook.map((p) => (
              <li
                key={p.id}
                className="nr-surface-sm"
                style={{ padding: "1rem 1.25rem", marginBottom: "0.75rem" }}
              >
                <Link
                  href={`/projects/${p.id}`}
                  style={{
                    fontSize: "1rem",
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
                    marginTop: "0.2rem",
                  }}
                >
                  {p.visibility} · {p.createdAt.toLocaleDateString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}