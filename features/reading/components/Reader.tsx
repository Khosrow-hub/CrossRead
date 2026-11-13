"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSelectionOffsets } from "@/features/reading/lib/selectionOffsets";

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
  authorId: string;
  startOffset: number | null;
  endOffset: number | null;
  selectedText: string | null;
};

type HistoryEntry = {
  id: string;
  action: "create" | "update" | "delete";
  beforeData: { type?: string; content?: string } | null;
  afterData: { type?: string; content?: string } | null;
  createdAt: string;
  versionId: string;
  versionMessage: string;
  authorUsername: string;
  authorDisplayName: string | null;
};

type CommentEntry = {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string | null;
};

type ReaderProps = {
  projectId: string;
  forkedFromId: string | null;
  currentUserId: string;
  chapters: Chapter[];
  passages: Passage[];
  initialAnnotations: Annotation[];
  initialLocation: string | null;
};

type Draft = {
  passageId: string;
  type: AnnotationType;
  content: string;
  startOffset: number | null;
  endOffset: number | null;
  selectedText: string | null;
};

type SelectionInfo = {
  passageId: string;
  startOffset: number | null;
  endOffset: number | null;
  selectedText: string | null;
};

type SuggestState = {
  annotationId: string;
  originalContent: string;
  proposedContent: string;
  note: string;
} | null;

type ReaderSettings = {
  fontSize: number;
  lineHeight: number;
  width: "narrow" | "medium" | "wide";
};

const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 18,
  lineHeight: 1.75,
  width: "medium",
};

function buildHighlightSegments(
  text: string,
  annotations: Annotation[]
): { text: string; highlight: boolean }[] {
  const ranges = annotations
    .filter(
      (a) =>
        a.startOffset !== null &&
        a.endOffset !== null &&
        a.startOffset < a.endOffset &&
        !a.isDraft
    )
    .map((a) => ({ start: a.startOffset as number, end: a.endOffset as number }))
    .sort((a, b) => a.start - b.start);

  if (ranges.length === 0) return [{ text, highlight: false }];

  const merged: { start: number; end: number }[] = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r.start <= last.end) {
      last.end = Math.max(last.end, r.end);
    } else {
      merged.push({ ...r });
    }
  }

  const segments: { text: string; highlight: boolean }[] = [];
  let cursor = 0;
  for (const r of merged) {
    if (r.start > cursor) {
      segments.push({ text: text.slice(cursor, r.start), highlight: false });
    }
    segments.push({ text: text.slice(r.start, r.end), highlight: true });
    cursor = r.end;
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), highlight: false });
  }
  return segments;
}

export default function Reader({
  projectId,
  forkedFromId,
  currentUserId,
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
  const [suggest, setSuggest] = useState<SuggestState>(null);
  const [suggestSaving, setSuggestSaving] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [suggestSuccess, setSuggestSuccess] = useState<string | null>(null);
  const [historyOpenId, setHistoryOpenId] = useState<string | null>(null);
  const [historyCache, setHistoryCache] = useState<Record<string, HistoryEntry[]>>({});
  const [commentsOpenId, setCommentsOpenId] = useState<string | null>(null);
  const [commentsCache, setCommentsCache] = useState<Record<string, CommentEntry[]>>({});
  const [commentDraft, setCommentDraft] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSaving, setCommentSaving] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeChapterTitle, setActiveChapterTitle] = useState<string | null>(
    initialLocation
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const lastReportedChapterRef = useRef<string | null>(initialLocation);

  useEffect(() => {
    const raw = window.localStorage.getItem("crossread_reader_settings");
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<ReaderSettings>;
        setSettings({
          fontSize:
            typeof parsed.fontSize === "number" &&
            parsed.fontSize >= 14 &&
            parsed.fontSize <= 28
              ? parsed.fontSize
              : DEFAULT_SETTINGS.fontSize,
          lineHeight:
            typeof parsed.lineHeight === "number" &&
            parsed.lineHeight >= 1.2 &&
            parsed.lineHeight <= 2.4
              ? parsed.lineHeight
              : DEFAULT_SETTINGS.lineHeight,
          width:
            parsed.width === "narrow" ||
            parsed.width === "medium" ||
            parsed.width === "wide"
              ? parsed.width
              : DEFAULT_SETTINGS.width,
        });
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (!settingsOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(e.target as Node)
      ) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [settingsOpen]);

  function updateSettings(next: ReaderSettings) {
    setSettings(next);
    window.localStorage.setItem(
      "crossread_reader_settings",
      JSON.stringify(next)
    );
  }

  useEffect(() => {
    function update() {
      setIsMobile(window.innerWidth < 900);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

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
          setActiveChapterTitle(title);

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
      if (!containerRef.current) return;
      const offsets = getSelectionOffsets(containerRef.current);
      if (!offsets) {
        setSelection(null);
        return;
      }
      setSelection({
        passageId: offsets.passageId,
        startOffset: offsets.startOffset,
        endOffset: offsets.endOffset,
        selectedText: offsets.selectedText,
      });
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
    setDraft({
      passageId: selection.passageId,
      type,
      content: "",
      startOffset: selection.startOffset,
      endOffset: selection.endOffset,
      selectedText: selection.selectedText,
    });
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  }

  async function submitDraft() {
    if (!draft) return;

    if (draft.type !== "highlight" && draft.content.trim().length === 0) {
      return;
    }

    const content =
      draft.type === "highlight" && draft.content.trim().length === 0
        ? draft.selectedText ?? "Highlight"
        : draft.content.trim();

    const res = await fetch(`/api/projects/${projectId}/annotations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        passageId: draft.passageId,
        type: draft.type,
        content,
        startOffset: draft.startOffset ?? undefined,
        endOffset: draft.endOffset ?? undefined,
        selectedText: draft.selectedText ?? undefined,
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
      setHistoryCache({});
      router.refresh();
    } catch {
      setSaveError("Could not save changes");
      setSaving(false);
    }
  }

  async function submitSuggestion() {
    if (!suggest) return;
    if (suggest.proposedContent.trim().length === 0) {
      setSuggestError("Write your proposed version");
      return;
    }
    setSuggestSaving(true);
    setSuggestError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetAnnotationId: suggest.annotationId,
          proposedContent: suggest.proposedContent.trim(),
          note: suggest.note.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSuggestError(data.error || "Could not send suggestion");
        setSuggestSaving(false);
        return;
      }
      setSuggest(null);
      setSuggestSaving(false);
      setSuggestSuccess("Suggestion sent");
      setTimeout(() => setSuggestSuccess(null), 3000);
    } catch {
      setSuggestError("Could not send suggestion");
      setSuggestSaving(false);
    }
  }

  async function toggleHistory(annotationId: string) {
    if (historyOpenId === annotationId) {
      setHistoryOpenId(null);
      return;
    }
    setHistoryOpenId(annotationId);
    setCommentsOpenId(null);

    if (historyCache[annotationId]) return;

    try {
      const res = await fetch(`/api/annotations/${annotationId}/history`);
      if (!res.ok) return;
      const data = await res.json();
      setHistoryCache((prev) => ({ ...prev, [annotationId]: data.history }));
    } catch {}
  }

  async function toggleComments(annotationId: string) {
    if (commentsOpenId === annotationId) {
      setCommentsOpenId(null);
      setCommentDraft("");
      setCommentError(null);
      return;
    }
    setCommentsOpenId(annotationId);
    setHistoryOpenId(null);
    setCommentDraft("");
    setCommentError(null);

    if (commentsCache[annotationId]) return;

    setCommentsLoading(true);
    try {
      const res = await fetch(`/api/annotations/${annotationId}/comments`);
      if (!res.ok) {
        setCommentsLoading(false);
        return;
      }
      const data = await res.json();
      setCommentsCache((prev) => ({
        ...prev,
        [annotationId]: data.comments,
      }));
      setCommentsLoading(false);
    } catch {
      setCommentsLoading(false);
    }
  }

  async function submitComment(annotationId: string) {
    if (commentDraft.trim().length === 0) return;
    setCommentSaving(true);
    setCommentError(null);

    try {
      const res = await fetch(`/api/annotations/${annotationId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentDraft.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCommentError(data.error || "Could not post comment");
        setCommentSaving(false);
        return;
      }
      setCommentsCache((prev) => ({
        ...prev,
        [annotationId]: [...(prev[annotationId] ?? []), data.comment],
      }));
      setCommentDraft("");
      setCommentSaving(false);
    } catch {
      setCommentError("Could not post comment");
      setCommentSaving(false);
    }
  }

  function jumpToChapter(title: string) {
    const el = document.querySelector(
      `[data-chapter-title="${CSS.escape(title)}"]`
    );
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  const canSuggest = forkedFromId !== null;
  const bottomOffset = isMobile ? "5rem" : "6rem";
  const readingWidth =
    settings.width === "narrow"
      ? "32rem"
      : settings.width === "wide"
      ? "56rem"
      : "44rem";

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        paddingBottom: isMobile ? "8rem" : "6rem",
      }}
    >
      {saveError && <div className="nr-error">{saveError}</div>}
      {suggestSuccess && (
        <div
          className="nr-inset"
          style={{
            padding: "0.75rem 1rem",
            fontSize: "0.9rem",
            color: "var(--nr-text)",
          }}
        >
          {suggestSuccess}
        </div>
      )}

      <div
        className="nr-surface"
        style={{
          padding: "1rem 1.25rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.75rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
          {chapters.map((c) => {
            const active = activeChapterTitle === c.title;
            return (
              <button
                key={c.id}
                onClick={() => jumpToChapter(c.title)}
                className="nr-button"
                style={{
                  width: "auto",
                  padding: "0.4rem 0.75rem",
                  fontSize: "0.8rem",
                  opacity: active ? 1 : 0.6,
                  fontWeight: active ? 700 : 500,
                }}
              >
                {c.title}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setSettingsOpen((v) => !v)}
          className="nr-surface-sm"
          style={{
            padding: "0.5rem 0.85rem",
            border: "none",
            cursor: "pointer",
            color: "var(--nr-text)",
            fontSize: "0.85rem",
            fontWeight: 700,
            borderRadius: "0.6rem",
          }}
          title="Reading settings"
        >
          Aa
        </button>
      </div>

      <div
        className="nr-surface"
        style={{ padding: isMobile ? "1.25rem" : "2rem" }}
      >
        {chapters.map((chapter) => {
          const chapterPassages = passages.filter(
            (p) => p.chapterId === chapter.id
          );
          return (
            <section
              key={chapter.id}
              data-chapter-title={chapter.title}
              data-chapter-position={chapter.position}
              style={{ marginBottom: "2rem", scrollMarginTop: "4rem" }}
            >
              <h2
                style={{
                  fontSize: "1.05rem",
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
                  const segments = buildHighlightSegments(p.text, list);
                  return (
                    <div key={p.id} data-passage-id={p.id}>
                      <p
                        data-passage-text
                        style={{
                          fontSize: `${settings.fontSize}px`,
                          lineHeight: settings.lineHeight,
                          color: "var(--nr-text)",
                          margin: 0,
                          cursor: "text",
                          userSelect: "text",
                          maxWidth: readingWidth,
                          marginLeft: "auto",
                          marginRight: "auto",
                        }}
                      >
                        {segments.map((seg, i) =>
                          seg.highlight ? (
                            <mark
                              key={i}
                              style={{
                                background: "rgba(122, 167, 232, 0.35)",
                                borderRadius: "0.2rem",
                                padding: "0 0.05rem",
                                color: "inherit",
                              }}
                            >
                              {seg.text}
                            </mark>
                          ) : (
                            <span key={i}>{seg.text}</span>
                          )
                        )}
                      </p>

                      {list.length > 0 && (
                        <div
                          style={{
                            marginTop: "0.75rem",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.5rem",
                            maxWidth: readingWidth,
                            marginLeft: "auto",
                            marginRight: "auto",
                          }}
                        >
                          {list.map((a) => {
                            const isOwn = a.authorId === currentUserId;
                            const isHistoryOpen = historyOpenId === a.id;
                            const isCommentsOpen = commentsOpenId === a.id;
                            const history = historyCache[a.id] ?? [];
                            const comments = commentsCache[a.id] ?? [];
                            return (
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
                                    alignItems: "center",
                                    gap: "0.75rem",
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <span>{a.type}</span>
                                  <span
                                    style={{
                                      display: "flex",
                                      gap: "0.75rem",
                                    }}
                                  >
                                    <button
                                      onClick={() => toggleHistory(a.id)}
                                      style={{
                                        background: "transparent",
                                        border: "none",
                                        padding: 0,
                                        fontSize: "0.7rem",
                                        fontWeight: 600,
                                        color: "var(--nr-text-soft)",
                                        cursor: "pointer",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.08em",
                                      }}
                                    >
                                      {isHistoryOpen ? "Hide history" : "History"}
                                    </button>
                                    <button
                                      onClick={() => toggleComments(a.id)}
                                      style={{
                                        background: "transparent",
                                        border: "none",
                                        padding: 0,
                                        fontSize: "0.7rem",
                                        fontWeight: 600,
                                        color: "var(--nr-text-soft)",
                                        cursor: "pointer",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.08em",
                                      }}
                                    >
                                      {isCommentsOpen
                                        ? "Hide comments"
                                        : `Comments${
                                            comments.length > 0
                                              ? ` (${comments.length})`
                                              : ""
                                          }`}
                                    </button>
                                  </span>
                                </div>
                                {a.selectedText && (
                                  <div
                                    style={{
                                      fontSize: "0.8rem",
                                      color: "var(--nr-text-soft)",
                                      fontStyle: "italic",
                                      marginBottom: "0.35rem",
                                    }}
                                  >
                                    &ldquo;{a.selectedText}&rdquo;
                                  </div>
                                )}
                                {a.type !== "highlight" && a.content}
                                {a.isDraft && (
                                  <div
                                    style={{
                                      fontSize: "0.7rem",
                                      color: "var(--nr-accent)",
                                      fontWeight: 700,
                                      marginTop: "0.35rem",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.08em",
                                    }}
                                  >
                                    Unsaved
                                  </div>
                                )}

                                {isHistoryOpen && (
                                  <div
                                    style={{
                                      marginTop: "0.75rem",
                                      borderTop:
                                        "1px solid var(--nr-shadow-dark)",
                                      paddingTop: "0.75rem",
                                    }}
                                  >
                                    {history.length === 0 ? (
                                      <div
                                        style={{
                                          fontSize: "0.8rem",
                                          color: "var(--nr-text-soft)",
                                          fontStyle: "italic",
                                        }}
                                      >
                                        No saved changes yet.
                                      </div>
                                    ) : (
                                      <ul
                                        style={{
                                          listStyle: "none",
                                          padding: 0,
                                          margin: 0,
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: "0.5rem",
                                        }}
                                      >
                                        {history.map((e) => {
                                          const author =
                                            e.authorDisplayName ??
                                            e.authorUsername;
                                          return (
                                            <li
                                              key={e.id}
                                              style={{
                                                fontSize: "0.8rem",
                                                color: "var(--nr-text)",
                                              }}
                                            >
                                              <div style={{ fontWeight: 600 }}>
                                                {author} · {e.action} ·{" "}
                                                {new Date(
                                                  e.createdAt
                                                ).toLocaleString()}
                                              </div>
                                              <div
                                                style={{
                                                  fontSize: "0.75rem",
                                                  color: "var(--nr-text-soft)",
                                                  marginTop: "0.15rem",
                                                }}
                                              >
                                                {e.versionMessage}
                                              </div>
                                              {e.beforeData?.content && (
                                                <div
                                                  style={{
                                                    fontSize: "0.8rem",
                                                    color:
                                                      "var(--nr-text-soft)",
                                                    textDecoration:
                                                      "line-through",
                                                    marginTop: "0.35rem",
                                                  }}
                                                >
                                                  {e.beforeData.content}
                                                </div>
                                              )}
                                              {e.afterData?.content && (
                                                <div
                                                  style={{
                                                    fontSize: "0.8rem",
                                                    color: "var(--nr-text)",
                                                    marginTop: "0.2rem",
                                                  }}
                                                >
                                                  {e.afterData.content}
                                                </div>
                                              )}
                                            </li>
                                          );
                                        })}
                                      </ul>
                                    )}
                                  </div>
                                )}

                                {isCommentsOpen && (
                                  <div
                                    style={{
                                      marginTop: "0.75rem",
                                      borderTop:
                                        "1px solid var(--nr-shadow-dark)",
                                      paddingTop: "0.75rem",
                                    }}
                                  >
                                    {commentsLoading && comments.length === 0 ? (
                                      <div
                                        style={{
                                          fontSize: "0.8rem",
                                          color: "var(--nr-text-soft)",
                                        }}
                                      >
                                        Loading comments
                                      </div>
                                    ) : comments.length === 0 ? (
                                      <div
                                        style={{
                                          fontSize: "0.8rem",
                                          color: "var(--nr-text-soft)",
                                          fontStyle: "italic",
                                          marginBottom: "0.5rem",
                                        }}
                                      >
                                        No comments yet. Be the first to reply.
                                      </div>
                                    ) : (
                                      <ul
                                        style={{
                                          listStyle: "none",
                                          padding: 0,
                                          margin: 0,
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: "0.5rem",
                                          marginBottom: "0.75rem",
                                        }}
                                      >
                                        {comments.map((c) => (
                                          <li
                                            key={c.id}
                                            style={{
                                              fontSize: "0.85rem",
                                              color: "var(--nr-text)",
                                              background: "var(--nr-bg)",
                                              padding: "0.5rem 0.75rem",
                                              borderRadius: "0.5rem",
                                            }}
                                          >
                                            <div
                                              style={{
                                                fontSize: "0.7rem",
                                                color:
                                                  "var(--nr-text-soft)",
                                                marginBottom: "0.15rem",
                                              }}
                                            >
                                              {c.authorDisplayName ??
                                                c.authorUsername}{" "}
                                              ·{" "}
                                              {new Date(
                                                c.createdAt
                                              ).toLocaleString()}
                                            </div>
                                            {c.content}
                                          </li>
                                        ))}
                                      </ul>
                                    )}

                                    {commentError && (
                                      <div
                                        className="nr-error"
                                        style={{ marginBottom: "0.5rem" }}
                                      >
                                        {commentError}
                                      </div>
                                    )}

                                    <textarea
                                      className="nr-input"
                                      rows={2}
                                      placeholder="Write a reply"
                                      value={commentDraft}
                                      onChange={(e) =>
                                        setCommentDraft(e.target.value)
                                      }
                                    />
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "flex-end",
                                        marginTop: "0.5rem",
                                      }}
                                    >
                                      <button
                                        onClick={() => submitComment(a.id)}
                                        className="nr-button"
                                        style={{ width: "auto" }}
                                        disabled={
                                          commentSaving ||
                                          commentDraft.trim().length === 0
                                        }
                                      >
                                        {commentSaving
                                          ? "Sending"
                                          : "Post reply"}
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {!isOwn && canSuggest && (
                                  <div style={{ marginTop: "0.5rem" }}>
                                    <button
                                      onClick={() =>
                                        setSuggest({
                                          annotationId: a.id,
                                          originalContent: a.content,
                                          proposedContent: a.content,
                                          note: "",
                                        })
                                      }
                                      className="nr-link"
                                      style={{
                                        background: "transparent",
                                        border: "none",
                                        padding: 0,
                                        fontSize: "0.8rem",
                                        cursor: "pointer",
                                      }}
                                    >
                                      Suggest an edit
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {draft && draft.passageId === p.id && (
                        <div
                          className="nr-surface"
                          style={{
                            padding: "1rem",
                            marginTop: "0.75rem",
                            maxWidth: readingWidth,
                            marginLeft: "auto",
                            marginRight: "auto",
                          }}
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
                            {draft.selectedText && (
                              <span
                                style={{
                                  textTransform: "none",
                                  letterSpacing: 0,
                                  fontStyle: "italic",
                                  marginLeft: "0.5rem",
                                }}
                              >
                                on &ldquo;{draft.selectedText.slice(0, 60)}
                                {draft.selectedText.length > 60 ? "..." : ""}
                                &rdquo;
                              </span>
                            )}
                          </div>
                          {draft.type !== "highlight" && (
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
                          )}
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
            bottom: bottomOffset,
            left: isMobile ? "1rem" : "50%",
            right: isMobile ? "1rem" : undefined,
            transform: isMobile ? "none" : "translateX(-50%)",
            padding: "0.5rem",
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "auto auto auto auto",
            gap: "0.35rem",
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
                  padding: isMobile ? "0.6rem 0.5rem" : "0.5rem 0.85rem",
                  fontSize: isMobile ? "0.75rem" : "0.85rem",
                  textTransform: "capitalize",
                }}
              >
                {t}
              </button>
            )
          )}
        </div>
      )}

      {settingsOpen && (
        <div
          ref={settingsRef}
          className="nr-surface"
          style={{
            position: "fixed",
            bottom: "1.5rem",
            right: isMobile ? "1rem" : "1.5rem",
            left: isMobile ? "1rem" : undefined,
            width: isMobile ? undefined : "18rem",
            padding: "1.25rem",
            zIndex: 45,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.9rem",
            }}
          >
            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "var(--nr-text)",
              }}
            >
              Reading settings
            </div>
            <button
              onClick={() => setSettingsOpen(false)}
              aria-label="Close reading settings"
              className="nr-surface-sm"
              style={{
                width: "1.75rem",
                height: "1.75rem",
                borderRadius: "0.5rem",
                border: "none",
                cursor: "pointer",
                color: "var(--nr-text)",
                fontWeight: 700,
                fontSize: "0.8rem",
              }}
            >
              ×
            </button>
          </div>

          <div style={{ marginBottom: "0.9rem" }}>
            <div
              style={{
                fontSize: "0.7rem",
                color: "var(--nr-text-soft)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "0.35rem",
              }}
            >
              Font size
            </div>
            <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
              {[16, 18, 20, 22, 24].map((size) => (
                <button
                  key={size}
                  onClick={() =>
                    updateSettings({ ...settings, fontSize: size })
                  }
                  className="nr-button"
                  style={{
                    width: "auto",
                    padding: "0.35rem 0.6rem",
                    fontSize: "0.8rem",
                    opacity: settings.fontSize === size ? 1 : 0.55,
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "0.9rem" }}>
            <div
              style={{
                fontSize: "0.7rem",
                color: "var(--nr-text-soft)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "0.35rem",
              }}
            >
              Line height
            </div>
            <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
              {[1.5, 1.75, 2, 2.25].map((h) => (
                <button
                  key={h}
                  onClick={() =>
                    updateSettings({ ...settings, lineHeight: h })
                  }
                  className="nr-button"
                  style={{
                    width: "auto",
                    padding: "0.35rem 0.6rem",
                    fontSize: "0.8rem",
                    opacity: settings.lineHeight === h ? 1 : 0.55,
                  }}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: "0.7rem",
                color: "var(--nr-text-soft)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "0.35rem",
              }}
            >
              Reading width
            </div>
            <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
              {(["narrow", "medium", "wide"] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => updateSettings({ ...settings, width: w })}
                  className="nr-button"
                  style={{
                    width: "auto",
                    padding: "0.35rem 0.6rem",
                    fontSize: "0.8rem",
                    textTransform: "capitalize",
                    opacity: settings.width === w ? 1 : 0.55,
                  }}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {suggest && (
        <div
          className="nr-surface"
          style={{
            position: "fixed",
            bottom: bottomOffset,
            left: isMobile ? "1rem" : "50%",
            right: isMobile ? "1rem" : undefined,
            transform: isMobile ? "none" : "translateX(-50%)",
            width: isMobile ? undefined : "30rem",
            maxWidth: "calc(100vw - 2rem)",
            padding: "1.25rem",
            zIndex: 60,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.75rem",
            }}
          >
            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "var(--nr-text)",
              }}
            >
              Suggest an edit
            </div>
            <button
              onClick={() => {
                setSuggest(null);
                setSuggestError(null);
              }}
              aria-label="Close suggestion"
              className="nr-surface-sm"
              style={{
                width: "1.75rem",
                height: "1.75rem",
                borderRadius: "0.5rem",
                border: "none",
                cursor: "pointer",
                color: "var(--nr-text)",
                fontWeight: 700,
                fontSize: "0.8rem",
              }}
            >
              ×
            </button>
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--nr-text-soft)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "0.3rem",
            }}
          >
            Their version
          </div>
          <div
            className="nr-inset"
            style={{
              padding: "0.75rem 1rem",
              fontSize: "0.85rem",
              color: "var(--nr-text-soft)",
              marginBottom: "0.9rem",
            }}
          >
            {suggest.originalContent}
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--nr-text-soft)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "0.3rem",
            }}
          >
            Your version
          </div>
          <textarea
            className="nr-input"
            rows={4}
            value={suggest.proposedContent}
            onChange={(e) =>
              setSuggest({ ...suggest, proposedContent: e.target.value })
            }
          />
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--nr-text-soft)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "0.3rem",
              marginTop: "0.75rem",
            }}
          >
            Why (optional)
          </div>
          <input
            type="text"
            className="nr-input"
            value={suggest.note}
            onChange={(e) => setSuggest({ ...suggest, note: e.target.value })}
            maxLength={1000}
          />
          {suggestError && (
            <div className="nr-error" style={{ marginTop: "0.75rem" }}>
              {suggestError}
            </div>
          )}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              marginTop: "0.9rem",
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={() => {
                setSuggest(null);
                setSuggestError(null);
              }}
              className="nr-button"
              style={{ width: "auto" }}
              disabled={suggestSaving}
            >
              Cancel
            </button>
            <button
              onClick={submitSuggestion}
              className="nr-button"
              style={{ width: "auto" }}
              disabled={suggestSaving}
            >
              {suggestSaving ? "Sending" : "Send suggestion"}
            </button>
          </div>
        </div>
      )}

      {saveBarOpen && (
        <div
          className="nr-surface"
          style={{
            position: "fixed",
            bottom: "1.5rem",
            right: isMobile ? "1rem" : "1.5rem",
            left: isMobile ? "1rem" : undefined,
            width: isMobile ? undefined : "22rem",
            padding: "1.25rem",
            zIndex: 40,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.75rem",
            }}
          >
            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "var(--nr-text)",
              }}
            >
              Save {draftCount} change{draftCount === 1 ? "" : "s"} as a version
            </div>
            <button
              onClick={() => setSaveBarOpen(false)}
              aria-label="Close save panel"
              className="nr-surface-sm"
              style={{
                width: "1.75rem",
                height: "1.75rem",
                borderRadius: "0.5rem",
                border: "none",
                cursor: "pointer",
                color: "var(--nr-text)",
                fontWeight: 700,
                fontSize: "0.8rem",
              }}
            >
              ×
            </button>
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
          left: isMobile ? "1rem" : "50%",
          right: isMobile ? "1rem" : undefined,
          transform: isMobile ? "none" : "translateX(-50%)",
          zIndex: 30,
        }}
      >
        <button
          onClick={() => setSaveBarOpen(true)}
          disabled={draftCount === 0 || saving}
          className="nr-button"
          style={{
            width: "100%",
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