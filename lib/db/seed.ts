import { config } from "dotenv";
config({ path: ".env.local" });

/* eslint-disable @typescript-eslint/no-require-imports */
const { db, pool } = require("./index") as typeof import("./index");
const schema = require("./schema") as typeof import("./schema");
const { hashPassword } = require("../auth/password") as typeof import("../auth/password");
const { eq } = require("drizzle-orm") as typeof import("drizzle-orm");
/* eslint-enable @typescript-eslint/no-require-imports */

const {
  books,
  chapters,
  passages,
  users,
  projects,
  annotations,
  readingProgress,
} = schema;

async function seed() {
  console.log("Seeding started");

  const [meditations] = await db
    .insert(books)
    .values({
      slug: "meditations",
      title: "Meditations",
      author: "Marcus Aurelius",
      description:
        "Private reflections of a Roman emperor on duty, discipline, and the nature of the mind.",
      license: "public-domain",
      sourceUrl: "https://www.gutenberg.org/ebooks/2680",
    })
    .returning();

  const [republic] = await db
    .insert(books)
    .values({
      slug: "the-republic",
      title: "The Republic",
      author: "Plato",
      description:
        "A dialogue on justice, the ideal city, and the nature of knowledge.",
      license: "public-domain",
      sourceUrl: "https://www.gutenberg.org/ebooks/1497",
    })
    .returning();

  console.log("Books inserted");

  const meditationsContent = [
    {
      title: "Book I",
      passages: [
        "From my grandfather Verus I learned good morals and the government of my temper.",
        "From the reputation and remembrance of my father, modesty and a manly character.",
        "From my mother, piety and beneficence, and abstinence, not only from evil deeds, but even from evil thoughts.",
        "From my great grandfather, to have a good opinion of my teachers.",
        "From my governor, to be neither of the green nor of the blue party at the games in the Circus.",
      ],
    },
    {
      title: "Book II",
      passages: [
        "Begin the morning by saying to thyself, I shall meet with the busy body, the ungrateful, arrogant, deceitful, envious, unsocial.",
        "You have power over your mind, not outside events. Realize this, and you will find strength.",
        "The happiness of your life depends upon the quality of your thoughts.",
        "If you are distressed by anything external, the pain is not due to the thing itself, but to your estimate of it.",
        "Very little is needed to make a happy life. It is all within yourself, in your way of thinking.",
      ],
    },
    {
      title: "Book III",
      passages: [
        "Do not act as if you were going to live ten thousand years. Death hangs over you. While you live, while it is in your power, be good.",
        "Look well into thyself. There is a source of strength which will always spring up if thou wilt always look there.",
        "Nothing happens to any man that he is not formed by nature to bear.",
        "The universe is change. Our life is what our thoughts make it.",
        "Accept the things to which fate binds you, and love the people with whom fate brings you together, but do so with all your heart.",
      ],
    },
  ];

  for (let i = 0; i < meditationsContent.length; i++) {
    const chapterData = meditationsContent[i];
    const [chapter] = await db
      .insert(chapters)
      .values({
        bookId: meditations.id,
        title: chapterData.title,
        position: i + 1,
      })
      .returning();

    for (let j = 0; j < chapterData.passages.length; j++) {
      await db.insert(passages).values({
        chapterId: chapter.id,
        text: chapterData.passages[j],
        position: j + 1,
      });
    }
  }

  console.log("Meditations seeded");

  const republicContent = [
    {
      title: "Book I",
      passages: [
        "I went down yesterday to the Piraeus with Glaucon the son of Ariston, that I might offer up my prayers to the goddess.",
        "What is justice. Is it merely the interest of the stronger.",
        "Justice is the advantage of the stronger, said Thrasymachus.",
        "Socrates, you are the sort of man who thinks that justice is something other than what the laws command.",
        "The just man is wise and good, and the unjust man is ignorant and bad.",
      ],
    },
    {
      title: "Book II",
      passages: [
        "Glaucon asks, is justice good in itself, or only for its consequences.",
        "The ring of Gyges makes its wearer invisible. Would a just man remain just if he could do wrong unseen.",
        "They say that justice is a compromise between the best, to do wrong, and the worst, to suffer wrong.",
        "We must consider justice in the city before we consider it in the individual.",
        "A city comes into being because no one is self sufficient, and each has many needs.",
      ],
    },
    {
      title: "Book III",
      passages: [
        "The guardians of the city must be gentle to their own, and fierce to their enemies.",
        "The education of the guardians must include music and gymnastics.",
        "The stories told to children must be purified of the falsehoods about the gods.",
        "A good judge must have a good memory, and be slow to believe in the wickedness of others.",
        "The rulers of the city must be those who love the city most, and who are best fitted to govern.",
      ],
    },
  ];

  for (let i = 0; i < republicContent.length; i++) {
    const chapterData = republicContent[i];
    const [chapter] = await db
      .insert(chapters)
      .values({
        bookId: republic.id,
        title: chapterData.title,
        position: i + 1,
      })
      .returning();

    for (let j = 0; j < chapterData.passages.length; j++) {
      await db.insert(passages).values({
        chapterId: chapter.id,
        text: chapterData.passages[j],
        position: j + 1,
      });
    }
  }

  console.log("The Republic seeded");

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.username, "testreader"))
    .limit(1);

  let testUser;
  if (existingUser.length > 0) {
    testUser = existingUser[0];
    console.log("Test user already exists");
  } else {
    const [created] = await db
      .insert(users)
      .values({
        username: "testreader",
        email: "test@crossread.app",
        passwordHash: await hashPassword("testtest"),
        displayName: "Test Reader",
      })
      .returning();
    testUser = created;
    console.log("Test user created");
  }

  const existingProject = await db
    .select()
    .from(projects)
    .where(eq(projects.ownerId, testUser.id))
    .limit(1);

  let testProject;
  if (existingProject.length > 0) {
    testProject = existingProject[0];
    console.log("Test project already exists");
  } else {
    const [created] = await db
      .insert(projects)
      .values({
        slug: "my-meditations",
        ownerId: testUser.id,
        bookId: meditations.id,
        name: "My Meditations",
        description: "A first reading of Marcus Aurelius.",
        visibility: "public",
      })
      .returning();
    testProject = created;
    console.log("Test project created");

    const firstChapter = await db
      .select()
      .from(chapters)
      .where(eq(chapters.bookId, meditations.id))
      .limit(1);

    if (firstChapter.length > 0) {
      const chapterPassages = await db
        .select()
        .from(passages)
        .where(eq(passages.chapterId, firstChapter[0].id));

      if (chapterPassages.length > 0) {
        await db.insert(annotations).values([
          {
            projectId: testProject.id,
            passageId: chapterPassages[0].id,
            authorId: testUser.id,
            type: "note",
            content:
              "The Stoic idea of duty begins with the family. Marcus traces his own virtues back to specific people.",
          },
          {
            projectId: testProject.id,
            passageId: chapterPassages[1].id,
            authorId: testUser.id,
            type: "note",
            content:
              "Modesty is not weakness. It is the refusal to inflate your own importance.",
          },
          {
            projectId: testProject.id,
            passageId: chapterPassages[2].id,
            authorId: testUser.id,
            type: "interpretation",
            content:
              "Abstaining from evil thoughts, not just actions, is the harder discipline. It is where philosophy actually does its work.",
          },
        ]);
        console.log("Notes created on test project");
      }
    }
  }

  // --- reading progress for the test user on the test project ---

  const existingProgress = await db
    .select()
    .from(readingProgress)
    .where(eq(readingProgress.userId, testUser.id))
    .limit(1);

  if (existingProgress.length > 0) {
    console.log("Reading progress already exists");
  } else {
    await db.insert(readingProgress).values({
      userId: testUser.id,
      projectId: testProject.id,
      currentLocation: "Book II, passage 2",
      progressPercentage: 40,
      lastReadAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    });
    console.log("Reading progress created");
  }

  console.log("Seeding complete");
  await pool.end();
}

seed().catch((error) => {
  console.error("Seed failed", error);
  process.exit(1);
});