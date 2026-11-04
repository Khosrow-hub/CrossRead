import { requireUser } from "@/lib/auth/require-user";

export default async function SettingsPage() {
  const user = await requireUser();

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
        Settings
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <div className="nr-label">Username</div>
          <div style={{ color: "var(--nr-text)" }}>@{user.username}</div>
        </div>
        <div>
          <div className="nr-label">Email</div>
          <div style={{ color: "var(--nr-text)" }}>{user.email}</div>
        </div>
        <div>
          <div className="nr-label">Display name</div>
          <div style={{ color: "var(--nr-text)" }}>
            {user.displayName ?? user.username}
          </div>
        </div>
      </div>
    </div>
  );
}