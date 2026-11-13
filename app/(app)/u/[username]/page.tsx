import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  users,
  projects,
  books,
  annotations,
  versions,
} from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/require-user";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  await requireUser();
  const { username } = await params;

  const userRows = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (userRows.length === 0) notFound();
  const profile = userRows[0];

  const publicProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      createdAt: projects.createdAt,
      forkedFromId: projects.forkedFromId,
      bookTitle: books.title,
      bookAuthor: books.author,
      bookCoverUrl: books.coverUrl,
      bookSlug: books.slug,
    })
    .from(projects)
    .innerJoin(books, eq(projects.bookId, books.id))
    .where(
      and(eq(projects.ownerId, profile.id), eq(projects.visibility, "public"))
    )
    .orderBy(desc(projects.updatedAt));

  const noteCountRows = await db
    .select({ id: annotations.id })
    .from(annotations)
    .innerJoin(projects, eq(annotations.projectId, projects.id))
    .where(
      and(eq(projects.ownerId, profile.id), eq(annotations.isDeleted, false))
    );
  const noteCount = noteCountRows.length;

  const versionCountRows = await db
    .select({ id: versions.id })
    .from(versions)
    .innerJoin(projects, eq(versions.projectId, projects.id))
    .where(eq(projects.ownerId, profile.id));
  const versionCount = versionCountRows.length;

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
              width: "6rem",
              height: "6rem",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
              fontWeight: 700,
              color: "var(--nr-text-soft)",
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              (profile.displayName ?? profile.username).charAt(0).toUpperCase()
            )}
          </div>
          <div style={{ flex: 1, minWidth: "16rem" }}>
            <h1
              style={{
                fontSize: "1.9rem",
                fontWeight: 700,
                color: "var(--nr-text)",
                marginBottom: "0.15rem",
              }}
            >
              {profile.displayName ?? profile.username}
            </h1>
            <div
              style={{
                fontSize: "0.95rem",
                color: "var(--nr-text-soft)",
                marginBottom: "1rem",
              }}
            >
              @{profile.username}
            </div>
            {profile.bio ? (
              <p
                style={{
                  fontSize: "0.95rem",
                  color: "var(--nr-text)",
                  lineHeight: 1.6,
                  maxWidth: "36rem",
                  marginBottom: "1rem",
                }}
              >
                {profile.bio}
              </p>
            ) : (
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "var(--nr-text-soft)",
                  fontStyle: "italic",
                  marginBottom: "1rem",
                }}
              >
                No bio yet.
              </p>
            )}
            <div
              style={{
                display: "flex",
                gap: "1.5rem",
                fontSize: "0.85rem",
                color: "var(--nr-text-soft)",
                flexWrap: "wrap",
              }}
            >
              <span>
                <strong style={{ color: "var(--nr-text)" }}>
                  {publicProjects.length}
                </strong>{" "}
                public project{publicProjects.length === 1 ? "" : "s"}
              </span>
              <span>
                <strong style={{ color: "var(--nr-text)" }}>{noteCount}</strong>{" "}
                note{noteCount === 1 ? "" : "s"}
              </span>
              <span>
                <strong style={{ color: "var(--nr-text)" }}>
                  {versionCount}
                </strong>{" "}
                version{versionCount === 1 ? "" : "s"}
              </span>
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
          Public reading projects
        </div>

        {publicProjects.length === 0 ? (
          <p style={{ color: "var(--nr-text-soft)", fontSize: "0.9rem" }}>
            This reader has no public projects yet.
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
            {publicProjects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/projects/${p.id}`}
                  className="nr-surface-sm"
                  style={{
                    display: "flex",
                    gap: "1rem",
                    padding: "0.75rem",
                    textDecoration: "none",
                    alignItems: "center",
                  }}
                >
                  <div
                    className="nr-inset"
                    style={{
                      width: "3.5rem",
                      height: "5rem",
                      borderRadius: "0.5rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      color: "var(--nr-text-soft)",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    {p.bookCoverUrl ? (
                      <img
                        src={p.bookCoverUrl}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      p.bookTitle.charAt(0)
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
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
                      {p.bookTitle} by {p.bookAuthor}
                    </div>
                    {p.description && (
                      <div
                        style={{
                          fontSize: "0.85rem",
                          color: "var(--nr-text-soft)",
                          marginTop: "0.4rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {p.description}
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}