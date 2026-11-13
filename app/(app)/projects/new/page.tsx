"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type SearchResult = {
  key: string;
  title: string;
  author: string;
  firstPublishYear: number | null;
  coverUrl: string | null;
  largeCoverUrl: string | null;
};

type PickedBook = {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
};

export default function NewProjectPage() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<PickedBook | null>(null);
  const [importing, setImporting] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const searchTimer = useRef<number | null>(null);

  useEffect(() => {
    if (searchTimer.current) window.clearTimeout(searchTimer.current);

    if (query.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimer.current = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/books/search?q=${encodeURIComponent(query.trim())}`
        );
        if (!res.ok) {
          setResults([]);
          setSearching(false);
          return;
        }
        const data = await res.json();
        setResults(data.results ?? []);
        setSearching(false);
      } catch {
        setResults([]);
        setSearching(false);
      }
    }, 350);

    return () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
    };
  }, [query]);

  async function pickBook(r: SearchResult) {
    setImporting(true);
    setError(null);

    try {
      const res = await fetch("/api/books/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          olKey: r.key,
          title: r.title,
          author: r.author,
          coverUrl: r.largeCoverUrl ?? r.coverUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not import book");
        setImporting(false);
        return;
      }
      setPicked({
        id: data.book.id,
        title: r.title,
        author: r.author,
        coverUrl: r.largeCoverUrl ?? r.coverUrl,
      });
      setImporting(false);
    } catch {
      setError("Could not import book");
      setImporting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!picked) {
      setError("Pick a book first");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: picked.id,
          name,
          description,
          visibility,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      router.push(`/projects/${data.project.id}/read`);
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div
      className="nr-surface"
      style={{ padding: "2rem", maxWidth: "40rem", margin: "0 auto" }}
    >
      <h1
        style={{
          fontSize: "1.4rem",
          fontWeight: 700,
          marginBottom: "0.4rem",
          color: "var(--nr-text)",
        }}
      >
        Start a reading project
      </h1>
      <p
        style={{
          fontSize: "0.9rem",
          color: "var(--nr-text-soft)",
          marginBottom: "1.5rem",
        }}
      >
        Find the book first. Then name the project.
      </p>

      {error && <div className="nr-error">{error}</div>}

      {!picked && (
        <div>
          <label className="nr-label" htmlFor="bookSearch">
            Book
          </label>
          <input
            id="bookSearch"
            type="text"
            className="nr-input"
            placeholder="Type a title or author"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />

          {searching && (
            <div
              style={{
                fontSize: "0.85rem",
                color: "var(--nr-text-soft)",
                marginTop: "0.75rem",
              }}
            >
              Searching
            </div>
          )}

          {!searching && query.trim().length >= 2 && results.length === 0 && (
            <div
              style={{
                fontSize: "0.85rem",
                color: "var(--nr-text-soft)",
                marginTop: "0.75rem",
                fontStyle: "italic",
              }}
            >
              No books match that search.
            </div>
          )}

          {results.length > 0 && (
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: "1rem 0 0",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {results.map((r) => (
                <li key={r.key}>
                  <button
                    onClick={() => pickBook(r)}
                    disabled={importing}
                    className="nr-surface-sm"
                    style={{
                      width: "100%",
                      textAlign: "left",
                      display: "flex",
                      gap: "1rem",
                      padding: "0.75rem",
                      border: "none",
                      cursor: importing ? "not-allowed" : "pointer",
                      opacity: importing ? 0.6 : 1,
                    }}
                  >
                    <div
                      className="nr-inset"
                      style={{
                        width: "3rem",
                        height: "4.5rem",
                        borderRadius: "0.4rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        overflow: "hidden",
                        color: "var(--nr-text-soft)",
                        fontWeight: 700,
                      }}
                    >
                      {r.coverUrl ? (
                        <img
                          src={r.coverUrl}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        r.title.charAt(0)
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "0.95rem",
                          fontWeight: 700,
                          color: "var(--nr-text)",
                        }}
                      >
                        {r.title}
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--nr-text-soft)",
                          marginTop: "0.15rem",
                        }}
                      >
                        {r.author}
                        {r.firstPublishYear ? ` · ${r.firstPublishYear}` : ""}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {picked && (
        <form onSubmit={handleSubmit} style={{ marginTop: "1.25rem" }}>
          <div
            className="nr-surface-sm"
            style={{
              display: "flex",
              gap: "1rem",
              padding: "0.75rem",
              marginBottom: "1.25rem",
            }}
          >
            <div
              className="nr-inset"
              style={{
                width: "4rem",
                height: "6rem",
                borderRadius: "0.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                flexShrink: 0,
                color: "var(--nr-text-soft)",
                fontWeight: 700,
                fontSize: "1.5rem",
              }}
            >
              {picked.coverUrl ? (
                <img
                  src={picked.coverUrl}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                picked.title.charAt(0)
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "var(--nr-text)",
                }}
              >
                {picked.title}
              </div>
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "var(--nr-text-soft)",
                  marginTop: "0.15rem",
                }}
              >
                {picked.author}
              </div>
              <button
                type="button"
                onClick={() => setPicked(null)}
                className="nr-link"
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  fontSize: "0.8rem",
                  marginTop: "0.5rem",
                  cursor: "pointer",
                }}
              >
                Choose a different book
              </button>
            </div>
          </div>

          <div style={{ marginBottom: "1.1rem" }}>
            <label className="nr-label" htmlFor="name">
              Project name
            </label>
            <input
              id="name"
              type="text"
              className="nr-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={80}
            />
          </div>

          <div style={{ marginBottom: "1.1rem" }}>
            <label className="nr-label" htmlFor="description">
              Description (optional)
            </label>
            <textarea
              id="description"
              className="nr-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={400}
            />
          </div>

          <div style={{ marginBottom: "1.75rem" }}>
            <label className="nr-label" htmlFor="visibility">
              Visibility
            </label>
            <select
              id="visibility"
              className="nr-input"
              value={visibility}
              onChange={(e) =>
                setVisibility(e.target.value as "private" | "public")
              }
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
          </div>

          <button type="submit" className="nr-button" disabled={loading}>
            {loading ? "Creating" : "Create project"}
          </button>
        </form>
      )}
    </div>
  );
}