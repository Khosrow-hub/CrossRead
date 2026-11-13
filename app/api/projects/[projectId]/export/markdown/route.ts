import { NextResponse } from "next/server";
import { eq, and, asc, inArray } from "drizzle-orm";
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
      bookId: projects.bookId,
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

  const passageIds = passageRows.map((p) => p.id);
  let annotationRows: {
    id: string;
    passageId: string;
    type: string;
    content: string;
    selectedText: string | null;
    authorDisplayName: string | null;
    authorUsername: string;
  }[] = [];

  if (passageIds.length > 0) {
    annotationRows = await db
      .select({
        id: annotations.id,
        passageId: annotations.passageId,
        type: annotations.type,
        content: annotations.content,
        selectedText: annotations.selectedText,
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
  }

  const annotationsByPassage = new Map<string, typeof annotationRows>();
  for (const a of annotationRows) {
    const list = annotationsByPassage.get(a.passageId) ?? [];
    list.push(a);
    annotationsByPassage.set(a.passageId, list);
  }

  const lines: string[] = [];
  lines.push(`# ${project.name}`);
  lines.push("");
  lines.push(`By ${project.ownerDisplayName ?? project.ownerUsername}`);
  lines.push("");
  lines.push(`**Book:** ${project.bookTitle} by ${project.bookAuthor}`);
  lines.push("");
  if (project.description) {
    lines.push(project.description);
    lines.push("");
  }
  lines.push(`Exported from CrossRead`);
  lines.push("");
  lines.push("---");
  lines.push("");

  for (const chapter of chapterRows) {
    const chapterPassages = passageRows.filter(
      (p) => p.chapterId === chapter.id
    );
    if (chapterPassages.length === 0) continue;

    lines.push(`## ${chapter.title}`);
    lines.push("");

    for (const passage of chapterPassages) {
      lines.push(`> ${passage.text}`);
      lines.push("");

      const notes = annotationsByPassage.get(passage.id) ?? [];
      for (const note of notes) {
        const author = note.authorDisplayName ?? note.authorUsername;
        lines.push(`**${note.type}** by ${author}`);
        if (note.selectedText) {
          lines.push(`*On: ${note.selectedText}*`);
        }
        if (note.type !== "highlight") {
          lines.push(note.content);
        }
        lines.push("");
      }
    }
  }

  const body = lines.join("\n");
  const filename = `${project.name.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase()}.md`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}