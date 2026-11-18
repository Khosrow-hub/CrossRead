"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteAccountButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/settings/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not delete account");
        setLoading(false);
        return;
      }
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch {
      setError("Could not delete account");
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="nr-button"
        style={{ width: "auto", color: "#c0392b" }}
      >
        Delete my account
      </button>
    );
  }

  return (
    <div
      className="nr-surface-sm"
      style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}
    >
      <div
        style={{
          fontSize: "0.9rem",
          fontWeight: 700,
          color: "var(--nr-text)",
        }}
      >
        Are you sure?
      </div>
      <p style={{ fontSize: "0.85rem", color: "var(--nr-text-soft)" }}>
        Type your password to confirm. This cannot be undone.
      </p>
      {error && <div className="nr-error">{error}</div>}
      <input
        type="password"
        className="nr-input"
        placeholder="Your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoFocus
      />
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
        <button
          onClick={() => {
            setOpen(false);
            setPassword("");
            setError(null);
          }}
          className="nr-button"
          style={{ width: "auto" }}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          className="nr-button"
          style={{ width: "auto", color: "#c0392b" }}
          disabled={loading || password.length === 0}
        >
          {loading ? "Deleting" : "Delete account"}
        </button>
      </div>
    </div>
  );
}