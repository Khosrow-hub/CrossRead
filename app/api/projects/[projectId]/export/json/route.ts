import { NextResponse } from "next/server";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  projects,
  books,
  users,
  chapters,
  passages,
  annotations,
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { isUuid } from "@/lib/validators/uuid";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { projectId } = await params;
  if (!isUuid(projectId)) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const projectRows = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      ownerId: projects.ownerId,
      visibility: projects.visibility,
      createdAt: projects.createdAt,
      bookId: books.id,
      bookTitle: books.title,
      bookAuthor: books.author,
      ownerDisplayName: users.displayName,
      ownerUsername: users.username,
    })
    .from(projects)
    .innerJoin(books, eq(projects.bookId, books.id))
    .innerJoin(users, eq(projects.ownerId, users.id))
    .where(eq(projects.id, projectId))
    .limit(1);

  if (projectRows.length === 0) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const project = projectRows[0];

  const canView =
    project.visibility === "public" || project.ownerId === user.id;
  if (!canView) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const chapterRows = await db
    .select({
      id: chapters.id,
      title: chapters.title,
      position: chapters.position,
    })
    .from(chapters)
    .where(eq(chapters.bookId, project.bookId))
    .orderBy(asc(chapters.position));

  const passageRows = await db
    .select({
      id: passages.id,
      chapterId: passages.chapterId,
      text: passages.text,
      position: passages.position,
    })
    .from(passages)
    .innerJoin(chapters, eq(passages.chapterId, chapters.id))
    .where(eq(chapters.bookId, project.bookId))
    .orderBy(asc(chapters.position), asc(passages.position));

  const annotationRows = await db
    .select({
      id: annotations.id,
      passageId: annotations.passageId,
      type: annotations.type,
      content: annotations.content,
      selectedText: annotations.selectedText,
      startOffset: annotations.startOffset,
      endOffset: annotations.endOffset,
      createdAt: annotations.createdAt,
      authorDisplayName: users.displayName,
      authorUsername: users.username,
    })
    .from(annotations)
    .innerJoin(users, eq(annotations.authorId, users.id))
    .where(
      and(
        eq(annotations.projectId, projectId),
        eq(annotations.isDeleted, false),
        eq(annotations.isDraft, false)
      )
    )
    .orderBy(asc(annotations.createdAt));

  const annotationsByPassage = new Map<string, typeof annotationRows>();
  for (const a of annotationRows) {
    const list = annotationsByPassage.get(a.passageId) ?? [];
    list.push(a);
    annotationsByPassage.set(a.passageId, list);
  }

  const chaptersOut = chapterRows.map((chapter) => {
    const chapterPassages = passageRows.filter(
      (p) => p.chapterId === chapter.id
    );
    return {
      title: chapter.title,
      position: chapter.position,
      passages: chapterPassages.map((passage) => ({
        text: passage.text,
        position: passage.position,
        annotations: (annotationsByPassage.get(passage.id) ?? []).map((a) => ({
          type: a.type,
          content: a.content,
          selectedText: a.selectedText,
          startOffset: a.startOffset,
          endOffset: a.endOffset,
          createdAt: a.createdAt.toISOString(),
          author: a.authorDisplayName ?? a.authorUsername,
        })),
      })),
    };
  });

  const payload = {
    exportedAt: new Date().toISOString(),
    app: "CrossRead",
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      visibility: project.visibility,
      createdAt: project.createdAt.toISOString(),
      owner: project.ownerDisplayName ?? project.ownerUsername,
    },
    book: {
      title: project.bookTitle,
      author: project.bookAuthor,
    },
    chapters: chaptersOut,
  };

  const filename = `${project.name.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase()}.json`;

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}