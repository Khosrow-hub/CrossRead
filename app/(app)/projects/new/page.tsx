"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Book = {
  id: string;
  title: string;
  author: string;
  slug: string;
};

export default function NewProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedBookId = searchParams.get("bookId");

  const [books, setBooks] = useState<Book[]>([]);
  const [bookId, setBookId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/books")
      .then((res) => res.json())
      .then((data) => {
        const list: Book[] = data.books ?? [];
        setBooks(list);
        if (preselectedBookId && list.some((b) => b.id === preselectedBookId)) {
          setBookId(preselectedBookId);
        } else if (list.length > 0) {
          setBookId(list[0].id);
        }
      })
      .catch(() => setError("Could not load books"));
  }, [preselectedBookId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, name, description, visibility }),
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
      style={{ padding: "2rem", maxWidth: "36rem", margin: "0 auto" }}
    >
      <h1
        style={{
          fontSize: "1.4rem",
          fontWeight: 700,
          marginBottom: "1.5rem",
          color: "var(--nr-text)",
        }}
      >
        Start a reading project
      </h1>

      <form onSubmit={handleSubmit}>
        {error && <div className="nr-error">{error}</div>}

        <div style={{ marginBottom: "1.1rem" }}>
          <label className="nr-label" htmlFor="book">
            Book
          </label>
          <select
            id="book"
            className="nr-input"
            value={bookId}
            onChange={(e) => setBookId(e.target.value)}
            required
          >
            {books.length === 0 && <option value="">Loading books</option>}
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title} by {b.author}
              </option>
            ))}
          </select>
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
    </div>
  );
}