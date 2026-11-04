import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, books } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

const createProjectSchema = z.object({
  bookId: z.string().uuid("Pick a book"),
  name: z.string().min(2, "Project name is too short").max(80),
  description: z.string().max(400).optional(),
  visibility: z.enum(["private", "public"]),
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

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rows = await db
    .select({
      id: projects.id,
      slug: projects.slug,
      name: projects.name,
      visibility: projects.visibility,
      bookId: projects.bookId,
    })
    .from(projects)
    .where(eq(projects.ownerId, user.id));

  return NextResponse.json({ projects: rows });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { bookId, name, description, visibility } = parsed.data;

    const bookRows = await db
      .select({ id: books.id })
      .from(books)
      .where(eq(books.id, bookId))
      .limit(1);

    if (bookRows.length === 0) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const baseSlug = slugify(name) || "reading";
    let slug = baseSlug;
    let attempt = 1;

    while (true) {
      const existing = await db
        .select({ id: projects.id })
        .from(projects)
        .where(and(eq(projects.ownerId, user.id), eq(projects.slug, slug)))
        .limit(1);

      if (existing.length === 0) break;

      attempt += 1;
      slug = `${baseSlug}-${attempt}`;
    }

    const [created] = await db
      .insert(projects)
      .values({
        slug,
        ownerId: user.id,
        bookId,
        name,
        description: description || null,
        visibility,
      })
      .returning({ id: projects.id, slug: projects.slug });

    return NextResponse.json({ project: created }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}