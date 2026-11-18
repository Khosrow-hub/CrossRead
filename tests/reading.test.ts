import { describe, it, expect, beforeAll } from "vitest";
import { execSync } from "child_process";

const baseUrl = "http://localhost:3100";

let cookie = "";

function psql(sql: string): string {
  const result = execSync(
    `docker exec crossread-postgres psql -U crossread -d crossread_test -t -A -q -F "|" -c "${sql.replace(/"/g, '\\"')}"`,
    { encoding: "utf-8" }
  );
  return result.trim();
}

function truncate() {
  execSync(
    `docker exec crossread-postgres psql -U crossread -d crossread_test -q -c "TRUNCATE TABLE notifications, annotation_comments, suggestions, version_edits, versions, reading_progress, annotations, passages, chapters, projects, books, users, sessions RESTART IDENTITY CASCADE"`,
    { stdio: "pipe" }
  );
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  attempts = 3
): Promise<Response> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fetch(url, init);
    } catch (err) {
      const code = (err as { cause?: { code?: string } })?.cause?.code;
      if (
        (code === "ECONNRESET" || code === "ECONNREFUSED") &&
        i < attempts - 1
      ) {
        await new Promise((r) => setTimeout(r, 200));
        continue;
      }
      throw err;
    }
  }
  throw new Error("fetch failed");
}

async function registerAndLogin(username: string): Promise<string> {
  const registerRes = await fetchWithRetry(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      email: `${username}@example.com`,
      password: "secret12345",
    }),
  });
  const setCookie = registerRes.headers.get("set-cookie");
  if (!setCookie) throw new Error("no session cookie from register");
  return setCookie.split(";")[0];
}

function seedBook(): { bookId: string; passageId: string } {
  const slug = `test-book-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const sql = `WITH new_book AS (INSERT INTO books (slug, title, author, license) VALUES ('${slug}', 'Test Book', 'Test Author', 'public-domain') RETURNING id), new_chapter AS (INSERT INTO chapters (book_id, title, position) SELECT id, 'Chapter One', 1 FROM new_book RETURNING id), new_passage AS (INSERT INTO passages (chapter_id, text, position) SELECT id, 'This is a test passage with enough words to select from.', 1 FROM new_chapter RETURNING id) SELECT (SELECT id FROM new_book) AS book_id, (SELECT id FROM new_passage) AS passage_id`;
  const result = psql(sql).trim();
  const [bookId, passageId] = result.split("|");
  return { bookId, passageId };
}

beforeAll(async () => {
  truncate();
  cookie = await registerAndLogin("reader");
}, 20000);

describe("reading loop", () => {
  it("creates a project, adds a note, saves a version, reads it back", async () => {
    const { bookId, passageId } = seedBook();

    const projectRes = await fetchWithRetry(`${baseUrl}/api/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        bookId,
        name: "My Test Reading",
        visibility: "private",
      }),
    });
    expect(projectRes.status).toBe(201);
    const projectData = await projectRes.json();
    const projectId = projectData.project.id;

    const noteRes = await fetchWithRetry(
      `${baseUrl}/api/projects/${projectId}/annotations`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({
          passageId,
          type: "note",
          content: "A first thought about this passage.",
          startOffset: 10,
          endOffset: 30,
          selectedText: "test passage with",
        }),
      }
    );
    expect(noteRes.status).toBe(201);
    const noteData = await noteRes.json();
    expect(noteData.annotation.content).toBe(
      "A first thought about this passage."
    );
    expect(noteData.annotation.isDraft).toBe(true);

    const saveRes = await fetchWithRetry(
      `${baseUrl}/api/projects/${projectId}/save`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ message: "First version" }),
      }
    );
    expect(saveRes.status).toBe(201);
    const saveData = await saveRes.json();
    expect(saveData.version.message).toBe("First version");

    const versionsRes = await fetchWithRetry(
      `${baseUrl}/api/projects/${projectId}/versions`,
      { headers: { Cookie: cookie } }
    );
    expect(versionsRes.status).toBe(200);
    const versionsData = await versionsRes.json();
    expect(versionsData.versions.length).toBe(1);
    expect(versionsData.versions[0].message).toBe("First version");
  }, 20000);

  it("records an update in the version history when a note is edited", async () => {
    const { bookId, passageId } = seedBook();

    const projectRes = await fetchWithRetry(`${baseUrl}/api/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        bookId,
        name: "Edit Test",
        visibility: "private",
      }),
    });
    const projectId = (await projectRes.json()).project.id;

    const noteRes = await fetchWithRetry(
      `${baseUrl}/api/projects/${projectId}/annotations`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({
          passageId,
          type: "note",
          content: "First version of the note.",
        }),
      }
    );
    const noteId = (await noteRes.json()).annotation.id;

    const firstSave = await fetchWithRetry(
      `${baseUrl}/api/projects/${projectId}/save`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ message: "Initial" }),
      }
    );
    expect(firstSave.status).toBe(201);

    const editRes = await fetchWithRetry(
      `${baseUrl}/api/annotations/${noteId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ content: "Revised version of the note." }),
      }
    );
    expect(editRes.status).toBe(200);

    const saveRes = await fetchWithRetry(
      `${baseUrl}/api/projects/${projectId}/save`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ message: "Revised" }),
      }
    );
    if (saveRes.status !== 201) {
      console.log("second save failed:", await saveRes.clone().text());
    }
    expect(saveRes.status).toBe(201);

    const versionsRes = await fetchWithRetry(
      `${baseUrl}/api/projects/${projectId}/versions`,
      { headers: { Cookie: cookie } }
    );
    const versionsData = await versionsRes.json();
    expect(versionsData.versions.length).toBe(2);

    const secondVersionId = versionsData.versions[0].id;
    const detailRes = await fetchWithRetry(
      `${baseUrl}/api/projects/${projectId}/versions/${secondVersionId}`,
      { headers: { Cookie: cookie } }
    );
    const detailData = await detailRes.json();
    expect(detailData.edits.length).toBe(1);
    expect(detailData.edits[0].action).toBe("update");
    expect(detailData.edits[0].beforeData.content).toBe(
      "First version of the note."
    );
    expect(detailData.edits[0].afterData.content).toBe(
      "Revised version of the note."
    );
  }, 20000);
});