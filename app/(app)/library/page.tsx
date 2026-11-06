import Link from "next/link";
import { eq, desc, count, and } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  books,
  projects,
  annotations,
  versions,
  readingProgress,
  suggestions,
} from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/require-user";

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default async function LibraryPage() {
  const user = await requireUser();

  const myProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      bookTitle: books.title,
    })
    .from(projects)
    .innerJoin(books, eq(projects.bookId, books.id))
    .where(eq(projects.ownerId, user.id))
    .orderBy(desc(projects.updatedAt))
    .limit(3);

  const recentNotes = await db
    .select({
      id: annotations.id,
      content: annotations.content,
    })
    .from(annotations)
    .innerJoin(projects, eq(annotations.projectId, projects.id))
    .where(eq(projects.ownerId, user.id))
    .orderBy(desc(annotations.createdAt))
    .limit(2);

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
    .limit(2);

  const versionCountResult = await db
    .select({ value: count() })
    .from(versions)
    .innerJoin(projects, eq(versions.projectId, projects.id))
    .where(eq(projects.ownerId, user.id));
  const versionCount = versionCountResult[0]?.value ?? 0;

  const suggestionsCountResult = await db
    .select({ value: count() })
    .from(suggestions)
    .innerJoin(projects, eq(suggestions.targetProjectId, projects.id))
    .where(
      and(
        eq(projects.ownerId, user.id),
        eq(suggestions.status, "open")
      )
    );
  const openSuggestionCount = suggestionsCountResult[0]?.value ?? 0;

  const progressRows = await db
    .select({
      projectId: readingProgress.projectId,
      projectName: projects.name,
      bookTitle: books.title,
      bookAuthor: books.author,
      bookCover: books.coverUrl,
      currentLocation: readingProgress.currentLocation,
      progressPercentage: readingProgress.progressPercentage,
      lastReadAt: readingProgress.lastReadAt,
    })
    .from(readingProgress)
    .innerJoin(projects, eq(readingProgress.projectId, projects.id))
    .innerJoin(books, eq(projects.bookId, books.id))
    .where(eq(readingProgress.userId, user.id))
    .orderBy(desc(readingProgress.lastReadAt))
    .limit(1);

  const current = progressRows[0] ?? null;

  let latestVersion: { message: string; createdAt: Date } | null = null;
  if (current) {
    const versionRows = await db
      .select({ message: versions.message, createdAt: versions.createdAt })
      .from(versions)
      .where(eq(versions.projectId, current.projectId))
      .orderBy(desc(versions.createdAt))
      .limit(1);
    latestVersion = versionRows[0] ?? null;
  }

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
          <span style={{ color: "var(--nr-text-soft)", fontSize: "0.9rem" }}>
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

      <div
        className="nr-surface"
        style={{
          gridColumn: "1 / 4",
          gridRow: "2 / 4",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          minHeight: "26rem",
          position: "relative",
        }}
      >
        {current ? (
          <div
            style={{
              display: "flex",
              gap: "2rem",
              alignItems: "flex-start",
              height: "100%",
              flexWrap: "wrap",
            }}
          >
            <div
              className="nr-inset"
              style={{
                width: "10rem",
                height: "14rem",
                borderRadius: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "3rem",
                fontWeight: 700,
                color: "var(--nr-text-soft)",
                flexShrink: 0,
              }}
            >
              {current.bookTitle.charAt(0)}
            </div>

            <div style={{ flex: 1, minWidth: "16rem" }}>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--nr-text-soft)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "0.5rem",
                }}
              >
                Continue reading
              </div>
              <h1
                style={{
                  fontSize: "1.9rem",
                  fontWeight: 700,
                  color: "var(--nr-text)",
                  marginBottom: "0.25rem",
                }}
              >
                {current.bookTitle}
              </h1>
              <div
                style={{
                  fontSize: "1rem",
                  color: "var(--nr-text-soft)",
                  marginBottom: "1.25rem",
                }}
              >
                {current.bookAuthor}
              </div>

              <div style={{ marginBottom: "0.4rem", fontSize: "0.85rem" }}>
                <span style={{ color: "var(--nr-text-soft)" }}>Progress </span>
                <span style={{ fontWeight: 700, color: "var(--nr-text)" }}>
                  {current.progressPercentage}%
                </span>
              </div>
              <div
                className="nr-inset"
                style={{
                  width: "100%",
                  height: "0.6rem",
                  borderRadius: "0.3rem",
                  overflow: "hidden",
                  marginBottom: "1rem",
                }}
              >
                <div
                  style={{
                    width: `${current.progressPercentage}%`,
                    height: "100%",
                    background: "var(--nr-accent)",
                    borderRadius: "0.3rem",
                  }}
                />
              </div>

              <div
                style={{
                  fontSize: "0.85rem",
                  color: "var(--nr-text-soft)",
                  marginBottom: "0.35rem",
                }}
              >
                Current location:{" "}
                <span style={{ color: "var(--nr-text)" }}>
                  {current.currentLocation ?? "Not yet placed"}
                </span>
              </div>
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "var(--nr-text-soft)",
                  marginBottom: "0.35rem",
                }}
              >
                Last read:{" "}
                <span style={{ color: "var(--nr-text)" }}>
                  {timeAgo(current.lastReadAt)}
                </span>
              </div>
              {latestVersion && (
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--nr-text-soft)",
                    marginBottom: "1rem",
                  }}
                >
                  Latest version:{" "}
                  <span style={{ color: "var(--nr-text)" }}>
                    {latestVersion.message}
                  </span>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  alignItems: "center",
                  marginTop: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <Link
                  href={`/projects/${current.projectId}/read`}
                  className="nr-button"
                  style={{ width: "auto", textDecoration: "none" }}
                >
                  Continue reading
                </Link>
                <Link
                  href={`/projects/${current.projectId}/versions`}
                  className="nr-link"
                  style={{ fontSize: "0.9rem" }}
                >
                  View reading history
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "flex-start",
              height: "100%",
              gap: "1.25rem",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--nr-text-soft)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "0.5rem",
                }}
              >
                Start reading
              </div>
              <h1
                style={{
                  fontSize: "1.9rem",
                  fontWeight: 700,
                  color: "var(--nr-text)",
                  marginBottom: "0.5rem",
                }}
              >
                Your next reading journey starts here
              </h1>
              <p
                style={{
                  fontSize: "0.95rem",
                  color: "var(--nr-text-soft)",
                  maxWidth: "32rem",
                }}
              >
                Explore books, start a reading project, and build on each
                other&apos;s interpretations.
              </p>
            </div>
            <Link
              href="/books"
              className="nr-button"
              style={{ width: "auto", textDecoration: "none" }}
            >
              Explore books
            </Link>
          </div>
        )}

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

      <RightCard gridRow="1 / 2" title="Your projects">
        {myProjects.length === 0 ? (
          <EmptyText>No projects yet</EmptyText>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {myProjects.map((p) => (
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

      <RightCard gridRow="2 / 3" title="Recent versions">
        {recentVersions.length === 0 ? (
          <EmptyText>No versions yet</EmptyText>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {recentVersions.map((v) => (
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
                  {v.projectName} · {timeAgo(v.createdAt)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </RightCard>

      <RightCard gridRow="3 / 4" title="Suggestions" highlighted>
        {openSuggestionCount === 0 ? (
          <EmptyText>No suggestions yet</EmptyText>
        ) : (
          <div>
            <div
              style={{
                fontSize: "1.75rem",
                fontWeight: 700,
                color: "var(--nr-text)",
                marginBottom: "0.25rem",
              }}
            >
              {openSuggestionCount}
            </div>
            <div
              style={{
                fontSize: "0.8rem",
                color: "var(--nr-text-soft)",
              }}
            >
              Open suggestion{openSuggestionCount === 1 ? "" : "s"} waiting for
              your review
            </div>
          </div>
        )}
      </RightCard>

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
            {recentNotes.map((n) => (
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