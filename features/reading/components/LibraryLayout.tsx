"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Current = {
  projectId: string;
  bookTitle: string;
  bookAuthor: string;
  currentLocation: string | null;
  progressPercentage: number;
  lastReadAt: string;
  lastReadAgo: string;
  latestVersionMessage: string | null;
} | null;

type Props = {
  current: Current;
  myProjects: { id: string; name: string; bookTitle: string }[];
  recentNotes: { id: string; content: string }[];
  recentVersions: {
    id: string;
    message: string;
    projectName: string;
    createdAtAgo: string;
  }[];
  versionCount: number;
  openSuggestionCount: number;
};

export function LibraryLayout(props: Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function update() {
      setIsMobile(window.innerWidth < 900);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (isMobile) {
    return <MobileLayout {...props} />;
  }

  return <DesktopLayout {...props} />;
}

function SearchBar() {
  return (
    <form
      action="/books"
      method="get"
      className="nr-surface-sm"
      style={{
        width: "100%",
        maxWidth: "22rem",
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
          minWidth: 0,
        }}
      />
    </form>
  );
}

function ContinueReadingCard({
  current,
  coverSize,
  stack,
}: {
  current: Current;
  coverSize: { width: string; height: string };
  stack: boolean;
}) {
  return (
    <div
      className="nr-surface"
      style={{
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        minHeight: stack ? undefined : "26rem",
        position: "relative",
      }}
    >
      {current ? (
        <div
          style={{
            display: "flex",
            flexDirection: stack ? "column" : "row",
            gap: "2rem",
            alignItems: stack ? "center" : "flex-start",
            flex: 1,
          }}
        >
          <div
            className="nr-inset"
            style={{
              width: coverSize.width,
              height: coverSize.height,
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

          <div
            style={{
              flex: 1,
              minWidth: 0,
              textAlign: stack ? "center" : "left",
              width: "100%",
            }}
          >
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
                fontSize: "1.75rem",
                fontWeight: 700,
                color: "var(--nr-text)",
                marginBottom: "0.25rem",
              }}
            >
              {current.bookTitle}
            </h1>
            <div
              style={{
                fontSize: "0.95rem",
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
                {current.lastReadAgo}
              </span>
            </div>
            {current.latestVersionMessage && (
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "var(--nr-text-soft)",
                  marginBottom: "1rem",
                }}
              >
                Latest version:{" "}
                <span style={{ color: "var(--nr-text)" }}>
                  {current.latestVersionMessage}
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
                justifyContent: stack ? "center" : "flex-start",
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
            alignItems: stack ? "center" : "flex-start",
            flex: 1,
            gap: "1.25rem",
            textAlign: stack ? "center" : "left",
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
                fontSize: "1.75rem",
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
          position: stack ? "static" : "absolute",
          bottom: "1.25rem",
          right: "1.25rem",
          width: "100%",
          maxWidth: stack ? undefined : "7rem",
          height: "1.9rem",
          borderRadius: "0.95rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--nr-text)",
          fontSize: "0.85rem",
          textDecoration: "none",
          alignSelf: stack ? "stretch" : "auto",
          marginTop: stack ? "0.5rem" : 0,
        }}
      >
        New project
      </Link>
    </div>
  );
}

function RightCard({
  children,
  title,
  highlighted,
}: {
  children: React.ReactNode;
  title: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className="nr-surface"
      style={{
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

function DesktopLayout({
  current,
  myProjects,
  recentNotes,
  recentVersions,
  versionCount,
  openSuggestionCount,
}: Props) {
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
        <SearchBar />
      </div>

      <div style={{ gridColumn: "1 / 4", gridRow: "2 / 4" }}>
        <ContinueReadingCard
          current={current}
          coverSize={{ width: "10rem", height: "14rem" }}
          stack={false}
        />
      </div>

      <div style={{ gridColumn: "4", gridRow: "1 / 2" }}>
        <RightCard title="Your projects">
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
      </div>

      <div style={{ gridColumn: "4", gridRow: "2 / 3" }}>
        <RightCard title="Recent versions">
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
                    {v.projectName} · {v.createdAtAgo}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </RightCard>
      </div>

      <div style={{ gridColumn: "4", gridRow: "3 / 4" }}>
        <RightCard title="Suggestions" highlighted>
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
                Open suggestion{openSuggestionCount === 1 ? "" : "s"} waiting
                for your review
              </div>
            </div>
          )}
        </RightCard>
      </div>

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
      </div>
    </div>
  );
}

function MobileLayout({
  current,
  myProjects,
  recentNotes,
  recentVersions,
  versionCount,
  openSuggestionCount,
}: Props) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <SearchBar />

      <ContinueReadingCard
        current={current}
        coverSize={{ width: "7rem", height: "9.5rem" }}
        stack={true}
      />

      <RightCard title="Your projects">
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
                    fontSize: "0.95rem",
                    fontWeight: 600,
                  }}
                >
                  {p.name}
                </Link>
                <div
                  style={{
                    fontSize: "0.8rem",
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

      <RightCard title="Recent versions">
        {recentVersions.length === 0 ? (
          <EmptyText>No versions yet</EmptyText>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {recentVersions.map((v) => (
              <li key={v.id} style={{ marginBottom: "0.55rem" }}>
                <div
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--nr-text)",
                    fontWeight: 600,
                  }}
                >
                  {v.message}
                </div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--nr-text-soft)",
                  }}
                >
                  {v.projectName} · {v.createdAtAgo}
                </div>
              </li>
            ))}
          </ul>
        )}
      </RightCard>

      <RightCard title="Suggestions" highlighted>
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

      <div className="nr-surface" style={{ padding: "1rem 1.25rem" }}>
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
                  fontSize: "0.9rem",
                  color: "var(--nr-text)",
                  marginBottom: "0.5rem",
                  lineHeight: 1.4,
                }}
              >
                {n.content}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="nr-surface" style={{ padding: "1rem" }}>
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
      </div>
    </div>
  );
}