import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

type OLResult = {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
};

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "10");
  url.searchParams.set("fields", "key,title,author_name,first_publish_year,cover_i");

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "CrossRead/0.1 (reading app)",
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Book search failed" },
        { status: 502 }
      );
    }

    const data = (await res.json()) as { docs?: OLResult[] };
    const docs = data.docs ?? [];

    const results = docs.map((d) => ({
      key: d.key,
      title: d.title,
      author: d.author_name?.[0] ?? "Unknown",
      firstPublishYear: d.first_publish_year ?? null,
      coverUrl: d.cover_i
        ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`
        : null,
      largeCoverUrl: d.cover_i
        ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`
        : null,
    }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { error: "Book search failed" },
      { status: 502 }
    );
  }
}