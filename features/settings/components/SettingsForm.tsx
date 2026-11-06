"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SettingsForm({
  initialDisplayName,
  initialBio,
}: {
  initialDisplayName: string;
  initialBio: string;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, bio }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save");
        setSaving(false);
        return;
      }
      setSaving(false);
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Could not save");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="nr-error">{error}</div>}
      {success && (
        <div
          className="nr-inset"
          style={{
            padding: "0.75rem 1rem",
            fontSize: "0.9rem",
            color: "var(--nr-text)",
            marginBottom: "1rem",
          }}
        >
          Saved
        </div>
      )}

      <div style={{ marginBottom: "1.1rem" }}>
        <label className="nr-label" htmlFor="displayName">
          Display name
        </label>
        <input
          id="displayName"
          type="text"
          className="nr-input"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={80}
        />
        <div
          style={{
            fontSize: "0.75rem",
            color: "var(--nr-text-soft)",
            marginTop: "0.35rem",
          }}
        >
          Shown on your projects and suggestions. If left empty, your username is
          used.
        </div>
      </div>

      <div style={{ marginBottom: "1.75rem" }}>
        <label className="nr-label" htmlFor="bio">
          Bio
        </label>
        <textarea
          id="bio"
          className="nr-input"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          maxLength={500}
        />
        <div
          style={{
            fontSize: "0.75rem",
            color: "var(--nr-text-soft)",
            marginTop: "0.35rem",
          }}
        >
          A short line about what you read.
        </div>
      </div>

      <button type="submit" className="nr-button" disabled={saving}>
        {saving ? "Saving" : "Save changes"}
      </button>
    </form>
  );
}