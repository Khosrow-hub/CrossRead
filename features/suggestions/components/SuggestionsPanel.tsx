"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Suggestion = {
  id: string;
  proposedContent: string;
  note: string | null;
  originalContent: string;
  annotationType: string;
  authorUsername: string;
  authorDisplayName: string | null;
  createdAt: string;
};

export function SuggestionsPanel({
  suggestions,
}: {
  suggestions: Suggestion[];
}) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function respond(id: string, action: "accept" | "decline") {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/suggestions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not process suggestion");
        setBusy(null);
        return;
      }
      setOpenId(null);
      setBusy(null);
      router.refresh();
    } catch {
      setError("Could not process suggestion");
      setBusy(null);
    }
  }

  if (suggestions.length === 0) return null;

  return (
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
        Suggestions ({suggestions.length})
      </div>

      {error && <div className="nr-error">{error}</div>}

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {suggestions.map((s) => {
          const open = openId === s.id;
          return (
            <li
              key={s.id}
              className="nr-surface-sm"
              style={{
                padding: "1rem 1.25rem",
                marginBottom: "0.75rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: 700,
                      color: "var(--nr-text)",
                    }}
                  >
                    Suggested edit to a {s.annotationType}
                  </div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--nr-text-soft)",
                      marginTop: "0.15rem",
                    }}
                  >
                    by {s.authorDisplayName ?? s.authorUsername} ·{" "}
                    {new Date(s.createdAt).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => setOpenId(open ? null : s.id)}
                  className="nr-button"
                  style={{ width: "auto", padding: "0.5rem 0.9rem", fontSize: "0.85rem" }}
                >
                  {open ? "Close" : "Review"}
                </button>
              </div>

              {open && (
                <div style={{ marginTop: "1rem" }}>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--nr-text-soft)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: "0.35rem",
                    }}
                  >
                    Your current note
                  </div>
                  <div
                    className="nr-inset"
                    style={{
                      padding: "0.75rem 1rem",
                      fontSize: "0.9rem",
                      color: "var(--nr-text)",
                      marginBottom: "0.9rem",
                    }}
                  >
                    {s.originalContent}
                  </div>

                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--nr-text-soft)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: "0.35rem",
                    }}
                  >
                    Their proposed version
                  </div>
                  <div
                    className="nr-inset"
                    style={{
                      padding: "0.75rem 1rem",
                      fontSize: "0.9rem",
                      color: "var(--nr-text)",
                      marginBottom: "0.9rem",
                    }}
                  >
                    {s.proposedContent}
                  </div>

                  {s.note && (
                    <>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--nr-text-soft)",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          marginBottom: "0.35rem",
                        }}
                      >
                        Their note
                      </div>
                      <div
                        style={{
                          fontSize: "0.9rem",
                          color: "var(--nr-text)",
                          marginBottom: "0.9rem",
                          fontStyle: "italic",
                        }}
                      >
                        {s.note}
                      </div>
                    </>
                  )}

                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      onClick={() => respond(s.id, "decline")}
                      className="nr-button"
                      style={{ width: "auto" }}
                      disabled={busy === s.id}
                    >
                      {busy === s.id ? "Working" : "Decline"}
                    </button>
                    <button
                      onClick={() => respond(s.id, "accept")}
                      className="nr-button"
                      style={{ width: "auto" }}
                      disabled={busy === s.id}
                    >
                      {busy === s.id ? "Working" : "Accept"}
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}