"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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
  isDraft: boolean;
};

type ReaderProps = {
  projectId: string;
  chapters: Chapter[];
  passages: Passage[];
  initialAnnotations: Annotation[];
};

type Draft = {
  passageId: string;
  content: string;
};

export default function Reader({
  projectId,
  chapters,
  passages,
  initialAnnotations,
}: ReaderProps) {
  const router = useRouter();
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveBarOpen, setSaveBarOpen] = useState(false);

  useEffect(() => {
    const firstChapter = chapters[0];
    fetch(`/api/projects/${projectId}/progress`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentLocation: firstChapter ? firstChapter.title : "Started reading",
        progressPercentage: 0,
      }),
    }).catch(() => {
      // progress tracking is not critical; do not break the reader if it fails
    });
  }, [projectId, chapters]);

  const annotationsByPassage = useMemo(() => {
    const map = new Map<string, Annotation[]>();
    for (const a of annotations) {
      const list = map.get(a.passageId) ?? [];
      list.push(a);
      map.set(a.passageId, list);
    }
    return map;
  }, [annotations]);

  const draftCount = annotations.filter((a) => a.isDraft).length;

  function openDraft(passageId: string) {
    setDraft({ passageId, content: "" });
  }

  async function submitDraft() {
    if (!draft || draft.content.trim().length === 0) return;

    const res = await fetch(`/api/projects/${projectId}/annotations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        passageId: draft.passageId,
        type: "note",
        content: draft.content.trim(),
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setSaveError(data.error || "Could not save note");
      return;
    }

    setAnnotations((prev) => [...prev, data.annotation]);
    setDraft(null);
  }

  async function handleSaveChanges() {
    setSaving(true);
    setSaveError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: saveMessage }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error || "Could not save changes");
        setSaving(false);
        return;
      }

      setAnnotations((prev) => prev.map((a) => ({ ...a, isDraft: false })));
      setSaveMessage("");
      setSaveBarOpen(false);
      setSaving(false);
      router.refresh();
    } catch {
      setSaveError("Could not save changes");
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        paddingBottom: "6rem",
      }}
    >
      {saveError && <div className="nr-error">{saveError}</div>}

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
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.5rem",
                }}
              >
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
                        onClick={() => openDraft(p.id)}
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
                                  display: "flex",
                                  justifyContent: "space-between",
                                }}
                              >
                                <span>{a.type}</span>
                                {a.isDraft && (
                                  <span
                                    style={{
                                      color: "var(--nr-accent)",
                                      fontWeight: 700,
                                    }}
                                  >
                                    Unsaved
                                  </span>
                                )}
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
                            >
                              Cancel
                            </button>
                            <button
                              onClick={submitDraft}
                              className="nr-button"
                              style={{ width: "auto" }}
                            >
                              Add note
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

      {saveBarOpen && (
        <div
          className="nr-surface"
          style={{
            position: "fixed",
            bottom: "1.5rem",
            right: "1.5rem",
            width: "22rem",
            padding: "1.25rem",
            zIndex: 40,
          }}
        >
          <div
            style={{
              fontSize: "0.85rem",
              fontWeight: 700,
              color: "var(--nr-text)",
              marginBottom: "0.75rem",
            }}
          >
            Save {draftCount} change{draftCount === 1 ? "" : "s"} as a version
          </div>
          <input
            type="text"
            className="nr-input"
            placeholder="Optional message"
            value={saveMessage}
            onChange={(e) => setSaveMessage(e.target.value)}
            maxLength={200}
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
              onClick={() => setSaveBarOpen(false)}
              className="nr-button"
              style={{ width: "auto" }}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveChanges}
              className="nr-button"
              style={{ width: "auto" }}
              disabled={saving}
            >
              {saving ? "Saving" : "Save"}
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          position: "fixed",
          bottom: "1.5rem",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 30,
        }}
      >
        <button
          onClick={() => setSaveBarOpen(true)}
          disabled={draftCount === 0 || saving}
          className="nr-button"
          style={{
            width: "auto",
            paddingLeft: "1.5rem",
            paddingRight: "1.5rem",
            opacity: draftCount === 0 ? 0.55 : 1,
          }}
        >
          {draftCount === 0
            ? "No changes to save"
            : `Save changes (${draftCount})`}
        </button>
      </div>
    </div>
  );
}