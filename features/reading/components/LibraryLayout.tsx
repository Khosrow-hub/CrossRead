"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Current = {
  projectId: string;
  bookTitle: string;
  bookAuthor: string;
  bookCover: string | null;
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
  const [mode, setMode] = useState<"mobile" | "tablet" | "desktop">("desktop");

  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      if (w < 900) setMode("mobile");
      else if (w < 1280) setMode("tablet");
      else setMode("desktop");
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (mode === "mobile") return <MobileLayout {...props} />;
  if (mode === "tablet") return <TabletLayout {...props} />;
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
  layout,
}: {
  current: Current;
  layout: "row" | "stack";
}) {
  const isStack = layout === "stack";
  const coverW = isStack ? "8rem" : "10rem";
  const coverH = isStack ? "11rem" : "14rem";

  return (
    <div
      className="nr-surface"
      style={{
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        position: "relative",
      }}
    >
      {current ? (
        <div
          style={{
            display: "flex",
            flexDirection: isStack ? "column" : "row",
            gap: "2rem",
            alignItems: isStack ? "center" : "flex-start",
          }}
        >
          <div
            className="nr-inset"
            style={{
              width: coverW,
              height: coverH,
              borderRadius: "1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "3rem",
              fontWeight: 700,
              color: "var(--nr-text-soft)",
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            {current.bookCover ? (
              <img
                src={current.bookCover}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              current.bookTitle.charAt(0)
            )}
          </div>

          <div
            style={{
              flex: 1,
              minWidth: 0,
              textAlign: isStack ? "center" : "left",
              width: "100%",
            }}
          >
            <div
              style={{
                fontSize: "0.7rem",
                color: "var(--nr-text-soft)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontWeight: 700,
                marginBottom: "0.5rem",
              }}
            >
              Continue reading
            </div>
            <h1
              style={{
                fontSize: "clamp(1.6rem, 2.5vw, 2.1rem)",
                fontWeight: 800,
                color: "var(--nr-text)",
                marginBottom: "0.25rem",
                letterSpacing: "-0.02em",
              }}
            >
              {current.bookTitle}
            </h1>
            <div
              style={{
                fontSize: "0.95rem",
                color: "var(--nr-text-soft)",
                marginBottom: "1.5rem",
              }}
            >
              {current.bookAuthor}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.8rem",
                color: "var(--nr-text-soft)",
                marginBottom: "0.4rem",
              }}
            >
              <span>Progress</span>
              <span style={{ fontWeight: 700, color: "var(--nr-text)" }}>
                {current.progressPercentage}%
              </span>
            </div>
            <div
              className="nr-inset"
              style={{
                width: "100%",
                height: "0.5rem",
                borderRadius: "0.3rem",
                overflow: "hidden",
                marginBottom: "1.25rem",
              }}
            >
              <div
                style={{
                  width: `${current.progressPercentage}%`,
                  height: "100%",
                  background: "var(--nr-text)",
                  borderRadius: "0.3rem",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.3rem",
                marginBottom: "1.5rem",
                fontSize: "0.85rem",
                color: "var(--nr-text-soft)",
              }}
            >
              <div>
                Current location:{" "}
                <span style={{ color: "var(--nr-text)" }}>
                  {current.currentLocation ?? "Not yet placed"}
                </span>
              </div>
              <div>
                Last read:{" "}
                <span style={{ color: "var(--nr-text)" }}>
                  {current.lastReadAgo}
                </span>
              </div>
              {current.latestVersionMessage && (
                <div>
                  Latest version:{" "}
                  <span style={{ color: "var(--nr-text)" }}>
                    {current.latestVersionMessage}
                  </span>
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                alignItems: "center",
                flexWrap: "wrap",
                justifyContent: isStack ? "center" : "flex-start",
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
                Reading history
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
            alignItems: isStack ? "center" : "flex-start",
            gap: "1.5rem",
            textAlign: isStack ? "center" : "left",
            padding: "1rem 0",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.7rem",
                color: "var(--nr-text-soft)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontWeight: 700,
                marginBottom: "0.5rem",
              }}
            >
              Start reading
            </div>
            <h1
              style={{
                fontSize: "clamp(1.6rem, 2.5vw, 2.1rem)",
                fontWeight: 800,
                color: "var(--nr-text)",
                marginBottom: "0.75rem",
                letterSpacing: "-0.02em",
              }}
            >
              Your next reading journey starts here
            </h1>
            <p
              style={{
                fontSize: "0.95rem",
                color: "var(--nr-text-soft)",
                maxWidth: "32rem",
                lineHeight: 1.6,
              }}
            >
              Pick a book from the catalog, start a project, and build a reading
              you can return to and share.
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

      <div
        style={{
          display: "flex",
          justifyContent: isStack ? "center" : "flex-end",
        }}
      >
        <Link
          href="/projects/new"
          className="nr-surface-sm"
          style={{
            width: isStack ? "100%" : "8rem",
            height: "2rem",
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
        padding: "1.1rem",
        display: "flex",
        flexDirection: "column",
        background: highlighted ? "var(--nr-surface-raised)" : undefined,
        minHeight: "4.5rem",
        position: "relative",
      }}
    >
      <div
        style={{
          fontSize: "0.65rem",
          color: "var(--nr-text-soft)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          fontWeight: 700,
          marginBottom: "0.6rem",
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function EmptyState({
  title,
  hint,
  actionLabel,
  actionHref,
}: {
  title: string;
  hint: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.4rem",
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          fontSize: "0.85rem",
          fontWeight: 700,
          color: "var(--nr-text)",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: "0.8rem",
          color: "var(--nr-text-soft)",
          lineHeight: 1.5,
        }}
      >
        {hint}
      </div>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="nr-link"
          style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

function ProjectsCard({ myProjects }: { myProjects: Props["myProjects"] }) {
  return (
    <RightCard title="Your projects">
      {myProjects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          hint="A reading project is your notes on one book, kept together."
          actionLabel="Start one"
          actionHref="/projects/new"
        />
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {myProjects.map((p) => (
            <li key={p.id} style={{ marginBottom: "0.6rem" }}>
              <Link
                href={`/projects/${p.id}`}
                style={{
                  color: "var(--nr-text)",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  fontWeight: 700,
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
  );
}

function VersionsCard({
  recentVersions,
}: {
  recentVersions: Props["recentVersions"];
}) {
  return (
    <RightCard title="Recent versions">
      {recentVersions.length === 0 ? (
        <EmptyState
          title="No saved versions"
          hint="Press Save changes in the reader to keep a version."
        />
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {recentVersions.map((v) => (
            <li key={v.id} style={{ marginBottom: "0.6rem" }}>
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
  );
}

function SuggestionsCard({
  openSuggestionCount,
}: {
  openSuggestionCount: number;
}) {
  return (
    <RightCard title="Suggestions" highlighted>
      {openSuggestionCount === 0 ? (
        <EmptyState
          title="No suggestions yet"
          hint="When another reader proposes an edit to your notes, it appears here."
        />
      ) : (
        <div>
          <div
            style={{
              fontSize: "2.25rem",
              fontWeight: 800,
              color: "var(--nr-text)",
              letterSpacing: "-0.02em",
              lineHeight: 1,
              marginBottom: "0.4rem",
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
  );
}

function NotesCard({ recentNotes }: { recentNotes: Props["recentNotes"] }) {
  return (
    <div
      className="nr-surface"
      style={{
        padding: "1.1rem 1.25rem",
        position: "relative",
      }}
    >
      <div
        style={{
          fontSize: "0.65rem",
          color: "var(--nr-text-soft)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          fontWeight: 700,
          marginBottom: "0.75rem",
        }}
      >
        Recent notes
      </div>
      {recentNotes.length === 0 ? (
        <EmptyState
          title="No notes yet"
          hint="Open a project and select a sentence to add one."
        />
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {recentNotes.map((n) => (
            <li
              key={n.id}
              style={{
                fontSize: "0.85rem",
                color: "var(--nr-text)",
                marginBottom: "0.5rem",
                lineHeight: 1.5,
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
  );
}

function VersionsSavedCard({ versionCount }: { versionCount: number }) {
  return (
    <div
      className="nr-surface"
      style={{ padding: "1.1rem", position: "relative" }}
    >
      <div
        style={{
          fontSize: "0.65rem",
          color: "var(--nr-text-soft)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          fontWeight: 700,
        }}
      >
        Versions saved
      </div>
      <div
        style={{
          fontSize: "2.25rem",
          fontWeight: 800,
          color: "var(--nr-text)",
          letterSpacing: "-0.02em",
          lineHeight: 1,
          marginTop: "0.5rem",
        }}
      >
        {versionCount}
      </div>
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
        <ContinueReadingCard current={current} layout="row" />
      </div>

      <div style={{ gridColumn: "4", gridRow: "1 / 2" }}>
        <ProjectsCard myProjects={myProjects} />
      </div>

      <div style={{ gridColumn: "4", gridRow: "2 / 3" }}>
        <VersionsCard recentVersions={recentVersions} />
      </div>

      <div style={{ gridColumn: "4", gridRow: "3 / 4" }}>
        <SuggestionsCard openSuggestionCount={openSuggestionCount} />
      </div>

      <div style={{ gridColumn: "2 / 4", gridRow: "4" }}>
        <NotesCard recentNotes={recentNotes} />
      </div>

      <div style={{ gridColumn: "4", gridRow: "4" }}>
        <VersionsSavedCard versionCount={versionCount} />
      </div>
    </div>
  );
}

function TabletLayout({
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
        gap: "1.25rem",
      }}
    >
      <SearchBar />

      <ContinueReadingCard current={current} layout="row" />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.25rem",
        }}
      >
        <ProjectsCard myProjects={myProjects} />
        <VersionsCard recentVersions={recentVersions} />
        <SuggestionsCard openSuggestionCount={openSuggestionCount} />
        <NotesCard recentNotes={recentNotes} />
        <div style={{ gridColumn: "1 / 3" }}>
          <VersionsSavedCard versionCount={versionCount} />
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
      <ContinueReadingCard current={current} layout="stack" />
      <ProjectsCard myProjects={myProjects} />
      <VersionsCard recentVersions={recentVersions} />
      <SuggestionsCard openSuggestionCount={openSuggestionCount} />
      <NotesCard recentNotes={recentNotes} />
      <VersionsSavedCard versionCount={versionCount} />
    </div>
  );
}