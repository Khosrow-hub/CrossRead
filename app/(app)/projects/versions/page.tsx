import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { versions, projects } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/require-user";

export default async function AllVersionsPage() {
  const user = await requireUser();

  const rows = await db
    .select({
      id: versions.id,
      message: versions.message,
      createdAt: versions.createdAt,
      projectId: versions.projectId,
      projectName: projects.name,
    })
    .from(versions)
    .innerJoin(projects, eq(versions.projectId, projects.id))
    .where(eq(projects.ownerId, user.id))
    .orderBy(desc(versions.createdAt));

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
        Versions
      </h1>

      {rows.length === 0 ? (
        <p style={{ color: "var(--nr-text-soft)", fontSize: "0.9rem" }}>
          No versions saved yet.
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {rows.map((v) => (
            <li
              key={v.id}
              className="nr-surface-sm"
              style={{ padding: "1rem", marginBottom: "0.75rem" }}
            >
              <div
                style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "var(--nr-text)",
                }}
              >
                {v.message}
              </div>
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "var(--nr-text-soft)",
                  marginTop: "0.15rem",
                }}
              >
                {v.projectName} · {v.createdAt.toISOString()}
              </div>
              <Link
                href={`/projects/${v.projectId}/versions/${v.id}`}
                className="nr-link"
                style={{ fontSize: "0.85rem", display: "inline-block", marginTop: "0.5rem" }}
              >
                View details
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}