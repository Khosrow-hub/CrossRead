"use client";

import { useMemo, useState } from "react";

type Chapter = {
  id: string;
  title: string;
  position: number;
};

type Passage = {
  id: string;
  chapterId: string;
  text: string;
  position: number;
};

type Annotation = {
  id: string;
  passageId: string;
  type: "highlight" | "note" | "question" | "interpretation";
  content: string;
  createdAt: string;
};

type ReaderProps = {
  projectId: string;
  chapters: Chapter[];
  passages: Passage[];
  initialAnnotations: Annotation[];
};

type DraftState = {
  passageId: string;
  type: "highlight" | "note" | "question" | "interpretation";
  content: string;
} | null;

export default function Reader({
  projectId,
  chapters,
  passages,
  initialAnnotations,
}: ReaderProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [draft, setDraft] = useState<DraftState>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const annotationsByPassage = useMemo(() => {
    const map = new Map<string, Annotation[]>();
    for (const a of annotations) {
      const list = map.get(a.passageId) ?? [];
      list.push(a);
      map.set(a.passageId, list);
    }
    return map;
  }, [annotations]);

  function openDraft(passageId: string, type: DraftState extends null ? never : "note") {
    setDraft({ passageId, type, content: "" });
  }

  async function submitDraft() {
    if (!draft || draft.content.trim().length === 0) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/annotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passageId: draft.passageId,
          type: draft.type,
          content: draft.content.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save note");
        setSaving(false);
        return;
      }

      setAnnotations((prev) => [...prev, data.annotation]);
      setDraft(null);
      setSaving(false);
    } catch {
      setError("Could not save note");
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {error && <div className="nr-error">{error}</div>}

      <div className="nr-surface" style={{ padding: "2rem" }}>
        {chapters.map((chapter) => {
          const chapterPassages = passages.filter(
            (p) => p.chapterId === chapter.id
          );
          return (
            <section key={chapter.id} style={{ marginBottom: "2rem" }}>
              <h2
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "var(--nr-text)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "1rem",
                }}
              >
                {chapter.title}
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {chapterPassages.map((p) => {
                  const list = annotationsByPassage.get(p.id) ?? [];
                  return (
                    <div key={p.id}>
                      <p
                        style={{
                          fontSize: "1rem",
                          lineHeight: 1.75,
                          color: "var(--nr-text)",
                          margin: 0,
                        }}
                      >
                        {p.text}
                      </p>

                      <button
                        onClick={() => openDraft(p.id, "note")}
                        className="nr-link"
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: 0,
                          marginTop: "0.5rem",
                          fontSize: "0.85rem",
                          cursor: "pointer",
                        }}
                      >
                        Add note
                      </button>

                      {list.length > 0 && (
                        <div
                          style={{
                            marginTop: "0.75rem",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.5rem",
                          }}
                        >
                          {list.map((a) => (
                            <div
                              key={a.id}
                              className="nr-inset"
                              style={{
                                padding: "0.75rem 1rem",
                                fontSize: "0.9rem",
                                color: "var(--nr-text)",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "0.7rem",
                                  color: "var(--nr-text-soft)",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.08em",
                                  marginBottom: "0.3rem",
                                }}
                              >
                                {a.type}
                              </div>
                              {a.content}
                            </div>
                          ))}
                        </div>
                      )}

                      {draft && draft.passageId === p.id && (
                        <div
                          className="nr-surface"
                          style={{ padding: "1rem", marginTop: "0.75rem" }}
                        >
                          <textarea
                            className="nr-input"
                            rows={3}
                            placeholder="Write your note"
                            value={draft.content}
                            onChange={(e) =>
                              setDraft({ ...draft, content: e.target.value })
                            }
                            autoFocus
                          />
                          <div
                            style={{
                              display: "flex",
                              gap: "0.5rem",
                              marginTop: "0.75rem",
                              justifyContent: "flex-end",
                            }}
                          >
                            <button
                              onClick={() => setDraft(null)}
                              className="nr-button"
                              style={{ width: "auto" }}
                              disabled={saving}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={submitDraft}
                              className="nr-button"
                              style={{ width: "auto" }}
                              disabled={saving}
                            >
                              {saving ? "Saving" : "Save note"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}