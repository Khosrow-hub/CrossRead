"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

type AnnotationType = "highlight" | "note" | "question" | "interpretation";

type Annotation = {
  id: string;
  passageId: string;
  type: AnnotationType;
  content: string;
  createdAt: string;
  isDraft: boolean;
};

type ReaderProps = {
  projectId: string;
  chapters: Chapter[];
  passages: Passage[];
  initialAnnotations: Annotation[];
  initialLocation: string | null;
};

type Draft = {
  passageId: string;
  type: AnnotationType;
  content: string;
};

type SelectionInfo = {
  passageId: string;
  type: AnnotationType;
};

export default function Reader({
  projectId,
  chapters,
  passages,
  initialAnnotations,
  initialLocation,
}: ReaderProps) {
  const router = useRouter();
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [selection, setSelection] = useState<SelectionInfo | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveBarOpen, setSaveBarOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastReportedChapterRef = useRef<string | null>(initialLocation);

  useEffect(() => {
    if (initialLocation) {
      const el = document.querySelector(
        `[data-chapter-title="${CSS.escape(initialLocation)}"]`
      );
      if (el) {
        el.scrollIntoView({ behavior: "auto", block: "start" });
      }
    }
  }, [initialLocation]);

  useEffect(() => {
    const firstChapter = chapters[0];
    const startingLocation =
      initialLocation ?? (firstChapter ? firstChapter.title : "Started reading");
    fetch(`/api/projects/${projectId}/progress`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentLocation: startingLocation,
        progressPercentage: 0,
      }),
    }).catch(() => {});
  }, [projectId, chapters, initialLocation]);

  useEffect(() => {
    if (chapters.length === 0) return;

    let observer: IntersectionObserver | null = null;
    let cancelled = false;

    const timer = setTimeout(() => {
      if (cancelled) return;

      const sections = document.querySelectorAll(
        `[data-chapter-title]`
      ) as NodeListOf<HTMLElement>;

      if (sections.length === 0) return;

      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries.filter((e) => e.isIntersecting);
          if (visible.length === 0) return;

          visible.sort((a, b) => {
            const posA = Number(
              (a.target as HTMLElement).dataset.chapterPosition ?? "0"
            );
            const posB = Number(
              (b.target as HTMLElement).dataset.chapterPosition ?? "0"
            );
            return posA - posB;
          });

          const topmost = visible[0].target as HTMLElement;
          const title = topmost.dataset.chapterTitle ?? null;
          if (!title || title === lastReportedChapterRef.current) return;

          const idx = chapters.findIndex((c) => c.title === title);
          const pct =
            chapters.length > 0
              ? Math.round(((idx + 1) / chapters.length) * 100)
              : 0;

          lastReportedChapterRef.current = title;

          fetch(`/api/projects/${projectId}/progress`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              currentLocation: title,
              progressPercentage: pct,
            }),
          }).catch(() => {});
        },
        { rootMargin: "-10% 0px -80% 0px", threshold: 0 }
      );

      sections.forEach((s) => observer!.observe(s));
    }, 100);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (observer) observer.disconnect();
    };
  }, [projectId, chapters]);

  useEffect(() => {
    function handleSelection() {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
        setSelection(null);
        return;
      }

      const range = sel.getRangeAt(0);
      const node = range.startContainer.parentElement;
      if (!node) {
        setSelection(null);
        return;
      }

      const passageEl = node.closest("[data-passage-id]") as HTMLElement | null;
      if (!passageEl || !containerRef.current?.contains(passageEl)) {
        setSelection(null);
        return;
      }

      const passageId = passageEl.dataset.passageId;
      if (!passageId) {
        setSelection(null);
        return;
      }

      setSelection({ passageId, type: "highlight" });
    }

    document.addEventListener("mouseup", handleSelection);
    document.addEventListener("touchend", handleSelection);
    return () => {
      document.removeEventListener("mouseup", handleSelection);
      document.removeEventListener("touchend", handleSelection);
    };
  }, []);

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

  function beginAnnotation(type: AnnotationType) {
    if (!selection) return;
    setDraft({ passageId: selection.passageId, type, content: "" });
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  }

  async function submitDraft() {
    if (!draft || draft.content.trim().length === 0) return;

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
      ref={containerRef}
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
            <section
              key={chapter.id}
              data-chapter-title={chapter.title}
              data-chapter-position={chapter.position}
              style={{ marginBottom: "2rem", scrollMarginTop: "2rem" }}
            >
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
                    <div key={p.id} data-passage-id={p.id}>
                      <p
                        style={{
                          fontSize: "1rem",
                          lineHeight: 1.75,
                          color: "var(--nr-text)",
                          margin: 0,
                          cursor: "text",
                          userSelect: "text",
                        }}
                      >
                        {p.text}
                      </p>

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
                          <div
                            style={{
                              fontSize: "0.7rem",
                              color: "var(--nr-text-soft)",
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                              marginBottom: "0.5rem",
                            }}
                          >
                            {draft.type}
                          </div>
                          <textarea
                            className="nr-input"
                            rows={3}
                            placeholder="Write your thought"
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
                              Add {draft.type}
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

      {selection && (
        <div
          className="nr-surface"
          style={{
            position: "fixed",
            bottom: "6rem",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "0.5rem",
            display: "flex",
            gap: "0.25rem",
            zIndex: 50,
          }}
        >
          {(["highlight", "note", "question", "interpretation"] as const).map(
            (t) => (
              <button
                key={t}
                onClick={() => beginAnnotation(t)}
                className="nr-button"
                style={{
                  width: "auto",
                  padding: "0.5rem 0.85rem",
                  fontSize: "0.85rem",
                  textTransform: "capitalize",
                }}
              >
                {t}
              </button>
            )
          )}
        </div>
      )}

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