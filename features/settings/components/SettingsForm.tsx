"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SettingsForm({
  initialDisplayName,
  initialBio,
  initialAvatarUrl,
}: {
  initialDisplayName: string;
  initialBio: string;
  initialAvatarUrl: string;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload/avatar", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not upload image");
        setUploading(false);
        return;
      }
      setAvatarUrl(data.url);
      setUploading(false);
      router.refresh();
    } catch {
      setError("Could not upload image");
      setUploading(false);
    }
  }

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

      <div style={{ marginBottom: "1.5rem" }}>
        <div className="nr-label">Avatar</div>
        <div
          style={{
            display: "flex",
            gap: "1.25rem",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              style={{
                width: "4.5rem",
                height: "4.5rem",
                borderRadius: "50%",
                objectFit: "cover",
                boxShadow:
                  "inset 4px 4px 10px var(--nr-shadow-dark), inset -4px -4px 10px var(--nr-shadow-light)",
              }}
            />
          ) : (
            <div
              className="nr-inset"
              style={{
                width: "4.5rem",
                height: "4.5rem",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "var(--nr-text-soft)",
              }}
            >
              {(displayName || "?").charAt(0).toUpperCase()}
            </div>
          )}
          <label
            className="nr-button"
            style={{
              width: "auto",
              cursor: uploading ? "not-allowed" : "pointer",
              opacity: uploading ? 0.6 : 1,
            }}
          >
            {uploading ? "Uploading" : "Choose image"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              disabled={uploading}
              style={{ display: "none" }}
            />
          </label>
        </div>
        <div
          style={{
            fontSize: "0.75rem",
            color: "var(--nr-text-soft)",
            marginTop: "0.5rem",
          }}
        >
          JPEG, PNG, or WebP. Up to 1 MB.
        </div>
      </div>

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
      </div>

      <button type="submit" className="nr-button" disabled={saving}>
        {saving ? "Saving" : "Save changes"}
      </button>
    </form>
  );
}