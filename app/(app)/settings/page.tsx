import { requireUser } from "@/lib/auth/require-user";
import { SettingsForm } from "@/features/settings/components/SettingsForm";

export default async function SettingsPage() {
  const user = await requireUser();

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
          Settings
        </h1>
        <p
          style={{
            fontSize: "0.9rem",
            color: "var(--nr-text-soft)",
            marginBottom: "1.75rem",
          }}
        >
          These details appear on your projects and on suggestions you send.
        </p>

        <SettingsForm
          initialDisplayName={user.displayName ?? ""}
          initialBio={user.bio ?? ""}
          initialAvatarUrl={user.avatarUrl ?? ""}
        />
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
          Account
        </div>
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
            <div className="nr-label">Joined</div>
            <div style={{ color: "var(--nr-text)" }}>
              {user.createdAt.toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}