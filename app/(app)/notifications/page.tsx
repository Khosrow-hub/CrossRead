import Link from "next/link";
import { eq, desc, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications, users, projects } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/require-user";

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function messageFor(
  type: string,
  actor: string,
  projectName: string | null
): string {
  const project = projectName ?? "your project";
  switch (type) {
    case "suggestion_received":
      return `${actor} suggested an edit to a note in ${project}`;
    case "suggestion_accepted":
      return `${actor} accepted your suggestion on ${project}`;
    case "suggestion_declined":
      return `${actor} declined your suggestion on ${project}`;
    case "project_forked":
      return `${actor} started their own version of ${project}`;
    case "comment_received":
      return `${actor} replied to one of your notes in ${project}`;
    default:
      return `New activity on ${project}`;
  }
}

function linkFor(
  type: string,
  projectId: string | null,
  suggestionId: string | null
): string {
  if (type === "suggestion_received" && projectId) {
    return `/projects/${projectId}`;
  }
  if (projectId) {
    return `/projects/${projectId}`;
  }
  return "/library";
}

export default async function NotificationsPage() {
  const user = await requireUser();

  const rows = await db
    .select({
      id: notifications.id,
      type: notifications.type,
      isRead: notifications.isRead,
      createdAt: notifications.createdAt,
      projectId: notifications.projectId,
      projectName: projects.name,
      suggestionId: notifications.suggestionId,
      actorUsername: users.username,
      actorDisplayName: users.displayName,
    })
    .from(notifications)
    .innerJoin(users, eq(notifications.actorId, users.id))
    .leftJoin(projects, eq(notifications.projectId, projects.id))
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(eq(notifications.userId, user.id), eq(notifications.isRead, false))
    );

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
          Notifications
        </h1>
        <p style={{ fontSize: "0.9rem", color: "var(--nr-text-soft)" }}>
          Activity on your projects and your notes.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="nr-surface" style={{ padding: "2rem" }}>
          <p
            style={{
              fontSize: "0.95rem",
              color: "var(--nr-text-soft)",
              fontStyle: "italic",
            }}
          >
            No notifications yet. When another reader forks your project, or
            responds to your note, it will appear here.
          </p>
        </div>
      ) : (
        rows.map((n) => {
          const actor = n.actorDisplayName ?? n.actorUsername;
          return (
            <Link
              key={n.id}
              href={linkFor(n.type, n.projectId, n.suggestionId)}
              className="nr-surface"
              style={{
                padding: "1.25rem 1.5rem",
                textDecoration: "none",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "1rem",
                flexWrap: "wrap",
                opacity: n.isRead ? 0.7 : 1,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "0.95rem",
                    color: "var(--nr-text)",
                    fontWeight: n.isRead ? 500 : 700,
                  }}
                >
                  {messageFor(n.type, actor, n.projectName)}
                </div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--nr-text-soft)",
                    marginTop: "0.25rem",
                  }}
                >
                  {relativeTime(n.createdAt)}
                </div>
              </div>
              {!n.isRead && (
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: "var(--nr-accent)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  New
                </span>
              )}
            </Link>
          );
        })
      )}
    </div>
  );
}