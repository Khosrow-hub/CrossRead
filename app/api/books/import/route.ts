import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { books } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

const importSchema = z.object({
  olKey: z.string().min(1),
  title: z.string().min(1).max(300),
  author: z.string().min(1).max(200),
  coverUrl: z.string().url().max(500).nullable(),
});

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = importSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { olKey, title, author, coverUrl } = parsed.data;

    const existing = await db
      .select({ id: books.id, slug: books.slug })
      .from(books)
      .where(eq(books.olKey, olKey))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ book: existing[0] });
    }

    const baseSlug = slugify(title) || "book";
    let slug = baseSlug;
    let attempt = 1;

    while (true) {
      const taken = await db
        .select({ id: books.id })
        .from(books)
        .where(eq(books.slug, slug))
        .limit(1);
      if (taken.length === 0) break;
      attempt += 1;
      slug = `${baseSlug}-${attempt}`;
    }

    const [created] = await db
      .insert(books)
      .values({
        slug,
        title,
        author,
        coverUrl,
        olKey,
        license: "unknown",
        sourceUrl: `https://openlibrary.org${olKey}`,
      })
      .returning({ id: books.id, slug: books.slug, title: books.title });

    return NextResponse.json({ book: created }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}