import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { books } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rows = await db
    .select({
      id: books.id,
      slug: books.slug,
      title: books.title,
      author: books.author,
      description: books.description,
      coverUrl: books.coverUrl,
    })
    .from(books)
    .orderBy(asc(books.title));

  return NextResponse.json({ books: rows });
}