import { config } from "dotenv";
config({ path: ".env.local" });

/* eslint-disable @typescript-eslint/no-require-imports */
const { db, pool } = require("../lib/db/index") as typeof import("../lib/db/index");
const schema = require("../lib/db/schema") as typeof import("../lib/db/schema");
const { hashPassword } = require("../lib/auth/password") as typeof import("../lib/auth/password");
const { eq, and } = require("drizzle-orm") as typeof import("drizzle-orm");
/* eslint-enable @typescript-eslint/no-require-imports */

const { users, books, projects, chapters, passages, annotations } = schema;

async function main() {
  console.log("Adding second test reader");

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.username, "sarah"))
    .limit(1);

  let sarah;
  if (existing.length > 0) {
    sarah = existing[0];
    console.log("Sarah already exists");
  } else {
    const [created] = await db
      .insert(users)
      .values({
        username: "sarah",
        email: "sarah@crossread.app",
        passwordHash: await hashPassword("sarahtest"),
        displayName: "Sarah Reader",
      })
      .returning();
    sarah = created;
    console.log("Sarah created");
  }

  const republicRows = await db
    .select()
    .from(books)
    .where(eq(books.slug, "the-republic"))
    .limit(1);

  if (republicRows.length === 0) {
    console.log("The Republic is missing, cannot create project");
    await pool.end();
    return;
  }

  const republic = republicRows[0];

  const existingProject = await db
    .select()
    .from(projects)
    .where(and(eq(projects.ownerId, sarah.id), eq(projects.slug, "sarahs-republic")))
    .limit(1);

  let project;
  if (existingProject.length > 0) {
    project = existingProject[0];
    console.log("Sarah's project already exists");
  } else {
    const [created] = await db
      .insert(projects)
      .values({
        slug: "sarahs-republic",
        ownerId: sarah.id,
        bookId: republic.id,
        name: "Sarah's Republic",
        description: "A public reading of Plato with two notes to fork from.",
        visibility: "public",
      })
      .returning();
    project = created;
    console.log("Sarah's project created");
  }

  const chapterRows = await db
    .select()
    .from(chapters)
    .where(eq(chapters.bookId, republic.id))
    .limit(1);

  if (chapterRows.length > 0) {
    const passageRows = await db
      .select()
      .from(passages)
      .where(eq(passages.chapterId, chapterRows[0].id))
      .limit(2);

    if (passageRows.length > 0) {
      const existingAnnotations = await db
        .select()
        .from(annotations)
        .where(eq(annotations.projectId, project.id))
        .limit(1);

      if (existingAnnotations.length === 0) {
        await db.insert(annotations).values([
          {
            projectId: project.id,
            passageId: passageRows[0].id,
            authorId: sarah.id,
            type: "note",
            content:
              "Socrates opens by descending to the harbor. The descent is literal and symbolic.",
            isDraft: false,
          },
          {
            projectId: project.id,
            passageId: passageRows[1].id,
            authorId: sarah.id,
            type: "interpretation",
            content:
              "Justice as the advantage of the stronger is not refuted here, it is set up as a position to test.",
            isDraft: false,
          },
        ]);
        console.log("Sarah's notes added");
      }
    }
  }

  console.log("Done");
  await pool.end();
}

main().catch((error) => {
  console.error("Failed", error);
  process.exit(1);
});