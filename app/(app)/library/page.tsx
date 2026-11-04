import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, desc, count, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  books,
  chapters,
  projects,
  annotations,
  versions,
} from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/require-user";

export default async function LibraryPage() {
  const user = await requireUser();

  // --- my projects ---
  const myProjects = await db
    .select({
      id: projects.id,
      slug: projects.slug,
      name: projects.name,
      bookTitle: books.title,
      bookAuthor: books.author,
      visibility: projects.visibility,
    })
    .from(projects)
    .innerJoin(books, eq(projects.bookId, books.id))
    .where(eq(projects.ownerId, user.id))
    .orderBy(desc(projects.updatedAt))
    .limit(5);

  // --- all books (for search, and for the main card when no project) ---
  const allBooks = await db.select().from(books).orderBy(books.title);

  // --- recent notes across my projects ---
  const recentNotes = await db
    .select({
      id: annotations.id,
      content: annotations.content,
      type: annotations.type,
      projectName: projects.name,
      createdAt: annotations.createdAt,
    })
    .from(annotations)
    .innerJoin(projects, eq(annotations.projectId, projects.id))
    .where(eq(projects.ownerId, user.id))
    .orderBy(desc(annotations.createdAt))
    .limit(5);

  // --- recent versions across my projects ---
  const recentVersions = await db
    .select({
      id: versions.id,
      message: versions.message,
      createdAt: versions.createdAt,
      projectName: projects.name,
    })
    .from(versions)
    .innerJoin(projects, eq(versions.projectId, projects.id))
    .where(eq(projects.ownerId, user.id))
    .orderBy(desc(versions.createdAt))
    .limit(5);

  // --- version count ---
  const versionCountResult = await db
    .select({ value: count() })
    .from(versions)
    .innerJoin(projects, eq(versions.projectId, projects.id))
    .where(eq(projects.ownerId, user.id));
  const versionCount = versionCountResult[0]?.value ?? 0;

  // --- current reading: most recently updated project ---
  const currentProject = myProjects[0] ?? null;

  return (
    <div
      style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr 1fr",
        gridTemplateRows: "auto 1fr auto auto",
        gap: "1.25rem",
      }}
    >
      {/* TOP: search bar */}
      <div
        style={{
          gridColumn: "1 / 4",
          gridRow: "1",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <form
          action="/books"
          method="get"
          className="nr-surface-sm"
          style={{
            width: "18rem",
            height: "2.4rem",
            borderRadius: "0.7rem",
            display: "flex",
            alignItems: "center",
            paddingLeft: "0.85rem",
            paddingRight: "0.75rem",
            gap: "0.5rem",
          }}
        >
          <span
            style={{
              color: "var(--nr-text-soft)",
              fontSize: "0.9rem",
            }}
          >
            ⌕
          </span>
          <input
            name="q"
            type="text"
            placeholder="Search books and authors"
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              outline: "none",
              color: "var(--nr-text)",
              fontSize: "0.9rem",
            }}
          />
        </form>
      </div>

      {/* MAIN CARD: current reading or start */}
      <div
        className="nr-surface"
        style={{
          gridColumn: "1 / 4",
          gridRow: "2 / 4",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "2rem",
          minHeight: "26rem",
        }}
      >
        {currentProject ? (
          <>
            <div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--nr-text-soft)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "0.75rem",
                }}
              >
                Continue reading
              </div>
              <h1
                style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: "var(--nr-text)",
                  marginBottom: "0.35rem",
                }}
              >
                {currentProject.bookTitle}
              </h1>
              <div
                style={{
                  fontSize: "1rem",
                  color: "var(--nr-text-soft)",
                }}
              >
                {currentProject.bookAuthor}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                alignItems: "flex-end",
                justifyContent: "space-between",
              }}
            >
              <Link
                href={`/projects/${currentProject.id}/read`}
                className="nr-button"
                style={{ width: "auto", textDecoration: "none" }}
              >
                Open project
              </Link>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--nr-text-soft)",
                }}
              >
                {recentNotes.length} recent notes
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--nr-text-soft)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "0.75rem",
                }}
              >
                Start reading
              </div>
              <h1
                style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: "var(--nr-text)",
                  marginBottom: "0.35rem",
                }}
              >
                Pick a book
              </h1>
              <div
                style={{
                  fontSize: "1rem",
                  color: "var(--nr-text-soft)",
                  maxWidth: "32rem",
                }}
              >
                Start a reading project from the catalog. Every project keeps
                your notes, highlights, and versions in one place.
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                alignItems: "center",
              }}
            >
              <Link
                href="/books"
                className="nr-button"
                style={{ width: "auto", textDecoration: "none" }}
              >
                Browse books
              </Link>
            </div>
          </>
        )}

        {/* plus pill bottom left */}
        <Link
          href="/projects/new"
          className="nr-surface-sm"
          style={{
            position: "absolute",
            bottom: "1.25rem",
            right: "1.25rem",
            width: "7rem",
            height: "1.9rem",
            borderRadius: "0.95rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--nr-text)",
            fontSize: "0.85rem",
            textDecoration: "none",
          }}
        >
          New project
        </Link>
      </div>

      {/* RIGHT COLUMN 1: your projects */}
      <RightCard gridRow="1 / 2" title="Your projects">
        {myProjects.length === 0 ? (
          <EmptyText>No projects yet</EmptyText>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {myProjects.slice(0, 3).map((p) => (
              <li key={p.id} style={{ marginBottom: "0.55rem" }}>
                <Link
                  href={`/projects/${p.id}`}
                  style={{
                    color: "var(--nr-text)",
                    textDecoration: "none",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                  }}
                >
                  {p.name}
                </Link>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--nr-text-soft)",
                  }}
                >
                  {p.bookTitle}
                </div>
              </li>
            ))}
          </ul>
        )}
      </RightCard>

      {/* RIGHT COLUMN 2: recent versions */}
      <RightCard gridRow="2 / 3" title="Recent versions">
        {recentVersions.length === 0 ? (
          <EmptyText>No versions yet</EmptyText>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {recentVersions.slice(0, 2).map((v) => (
              <li key={v.id} style={{ marginBottom: "0.55rem" }}>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--nr-text)",
                    fontWeight: 600,
                  }}
                >
                  {v.message}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--nr-text-soft)",
                  }}
                >
                  {v.projectName}
                </div>
              </li>
            ))}
          </ul>
        )}
      </RightCard>

      {/* RIGHT COLUMN 3 (highlighted): suggestions */}
      <RightCard gridRow="3 / 4" title="Suggestions" highlighted>
        <EmptyText>No suggestions yet</EmptyText>
      </RightCard>

      {/* BOTTOM CENTER: recent notes */}
      <div
        className="nr-surface"
        style={{
          gridColumn: "2 / 4",
          gridRow: "4",
          padding: "1.1rem 1.25rem",
          minHeight: "6rem",
        }}
      >
        <div
          style={{
            fontSize: "0.75rem",
            color: "var(--nr-text-soft)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: "0.6rem",
          }}
        >
          Recent notes
        </div>
        {recentNotes.length === 0 ? (
          <EmptyText>No notes yet</EmptyText>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {recentNotes.slice(0, 2).map((n) => (
              <li
                key={n.id}
                style={{
                  fontSize: "0.85rem",
                  color: "var(--nr-text)",
                  marginBottom: "0.5rem",
                  lineHeight: 1.4,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {n.content}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* BOTTOM RIGHT: paper stack with count */}
      <div
        className="nr-surface"
        style={{
          gridColumn: "4",
          gridRow: "4",
          padding: "1rem",
          position: "relative",
          minHeight: "6rem",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            fontSize: "0.75rem",
            color: "var(--nr-text-soft)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Versions saved
        </div>
        <div
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            color: "var(--nr-text)",
            marginTop: "0.35rem",
          }}
        >
          {versionCount}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "-1.5rem",
            right: "-1rem",
            width: "8rem",
            height: "6rem",
          }}
        >
          <div
            className="nr-surface-sm"
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "1rem 1rem 0 0",
              transform: "rotate(-10deg) translate(10px, 6px)",
              opacity: 0.5,
            }}
          />
          <div
            className="nr-surface-sm"
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "1rem 1rem 0 0",
              transform: "rotate(-5deg) translate(4px, 2px)",
              opacity: 0.75,
            }}
          />
          <div
            className="nr-surface-sm"
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "1rem 1rem 0 0",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function RightCard({
  children,
  title,
  gridRow,
  highlighted,
}: {
  children: React.ReactNode;
  title: string;
  gridRow: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className="nr-surface"
      style={{
        gridColumn: "4",
        gridRow,
        padding: "0.95rem 1rem",
        display: "flex",
        flexDirection: "column",
        background: highlighted ? "#eceff4" : undefined,
        minHeight: "4rem",
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
        {title}
      </div>
      {children}
    </div>
  );
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: "0.8rem",
        color: "var(--nr-text-soft)",
        fontStyle: "italic",
      }}
    >
      {children}
    </div>
  );
}