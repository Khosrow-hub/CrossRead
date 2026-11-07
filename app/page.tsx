import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/library");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--nr-bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "3rem 1.5rem 4rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: "72rem" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "4rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <div
              className="nr-inset"
              style={{
                width: "2.5rem",
                height: "2.5rem",
                borderRadius: "0.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.1rem",
                fontWeight: 700,
                color: "var(--nr-text)",
              }}
            >
              C
            </div>
            <div
              style={{
                fontSize: "1.15rem",
                fontWeight: 700,
                color: "var(--nr-text)",
                letterSpacing: "-0.01em",
              }}
            >
              CrossRead
            </div>
          </div>

          <nav style={{ display: "flex", gap: "0.75rem" }}>
            <Link
              href="/login"
              className="nr-button"
              style={{ width: "auto", textDecoration: "none" }}
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="nr-button"
              style={{
                width: "auto",
                textDecoration: "none",
                color: "var(--nr-accent)",
              }}
            >
              Create an account
            </Link>
          </nav>
        </header>

        <section
          style={{
            textAlign: "center",
            marginBottom: "5rem",
            maxWidth: "46rem",
            margin: "0 auto 5rem",
          }}
        >
          <div
            className="nr-inset"
            style={{
              display: "inline-block",
              padding: "0.4rem 0.9rem",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "var(--nr-text-soft)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              borderRadius: "0.5rem",
              marginBottom: "1.5rem",
            }}
          >
            Collaborative reading
          </div>
          <h1
            style={{
              fontSize: "clamp(2.25rem, 5vw, 3.5rem)",
              fontWeight: 800,
              color: "var(--nr-text)",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              marginBottom: "1.25rem",
            }}
          >
            Read together. Think independently. Build on each other&apos;s ideas.
          </h1>
          <p
            style={{
              fontSize: "1.1rem",
              color: "var(--nr-text-soft)",
              lineHeight: 1.6,
              marginBottom: "2rem",
            }}
          >
            CrossRead turns a book into a reading project: your notes, your
            highlights, your interpretations, and a saved history you can share.
            When another reader builds on your work, you see their reasoning and
            decide whether to accept it.
          </p>
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/register"
              className="nr-button"
              style={{
                width: "auto",
                padding: "0.95rem 1.75rem",
                fontSize: "1rem",
                textDecoration: "none",
              }}
            >
              Start reading
            </Link>
            <Link
              href="/login"
              className="nr-link"
              style={{ alignSelf: "center", fontSize: "0.95rem" }}
            >
              I already have an account
            </Link>
          </div>
        </section>

        <section style={{ marginBottom: "5rem" }}>
          <h2
            style={{
              fontSize: "1.6rem",
              fontWeight: 700,
              color: "var(--nr-text)",
              textAlign: "center",
              marginBottom: "0.5rem",
            }}
          >
            How it works
          </h2>
          <p
            style={{
              fontSize: "0.95rem",
              color: "var(--nr-text-soft)",
              textAlign: "center",
              marginBottom: "2.5rem",
            }}
          >
            Three steps. No terminal. No Git vocabulary. Just buttons.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))",
              gap: "1.25rem",
            }}
          >
            <StepCard
              number="1"
              title="Start a reading"
              body="Pick a book, open it in the reader, and annotate. Highlights, notes, questions, interpretations. All attached to the passage they belong to."
            />
            <StepCard
              number="2"
              title="Save a version"
              body="When your reading reaches a place worth keeping, save your changes. Every saved version records what changed, when, and in which passage."
            />
            <StepCard
              number="3"
              title="Build on each other"
              body="Start your own version of someone else's reading. Suggest edits to their notes. They review, and either accept or decline. Their history records the contribution."
            />
          </div>
        </section>

        <section style={{ marginBottom: "5rem" }}>
          <div
            className="nr-surface"
            style={{ padding: "2.5rem 2rem", textAlign: "center" }}
          >
            <h2
              style={{
                fontSize: "1.4rem",
                fontWeight: 700,
                color: "var(--nr-text)",
                marginBottom: "0.75rem",
              }}
            >
              Who it is for
            </h2>
            <p
              style={{
                fontSize: "0.95rem",
                color: "var(--nr-text)",
                maxWidth: "40rem",
                margin: "0 auto 1.5rem",
                lineHeight: 1.7,
              }}
            >
              Readers of philosophy, psychology, literature, and history.
              Students, researchers, book clubs, and anyone who has ever
              scribbled in a margin and wished they could talk to the previous
              reader.
            </p>
            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--nr-text-soft)",
                maxWidth: "40rem",
                margin: "0 auto",
                lineHeight: 1.7,
              }}
            >
              Start with a public domain book from our catalog. Your reading is
              private by default. Share it when you are ready.
            </p>
          </div>
        </section>

        <section style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2
            style={{
              fontSize: "1.6rem",
              fontWeight: 700,
              color: "var(--nr-text)",
              marginBottom: "0.5rem",
            }}
          >
            A book is no longer something you finish.
          </h2>
          <p
            style={{
              fontSize: "1rem",
              color: "var(--nr-text-soft)",
              maxWidth: "36rem",
              margin: "0 auto 2rem",
              lineHeight: 1.6,
            }}
          >
            It becomes an evolving project that grows with every reader who
            touches it.
          </p>
          <Link
            href="/register"
            className="nr-button"
            style={{
              width: "auto",
              padding: "0.95rem 1.75rem",
              fontSize: "1rem",
              textDecoration: "none",
            }}
          >
            Create your account
          </Link>
        </section>

        <footer
          style={{
            textAlign: "center",
            fontSize: "0.8rem",
            color: "var(--nr-text-soft)",
            paddingTop: "2rem",
            borderTop: "1px solid var(--nr-shadow-dark)",
          }}
        >
          CrossRead. Read together. Think independently.
        </footer>
      </div>
    </div>
  );
}

function StepCard({
  number,
  title,
  body,
}: {
  number: string;
  title: string;
  body: string;
}) {
  return (
    <div className="nr-surface" style={{ padding: "1.75rem 1.5rem" }}>
      <div
        className="nr-inset"
        style={{
          width: "2rem",
          height: "2rem",
          borderRadius: "0.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.9rem",
          fontWeight: 700,
          color: "var(--nr-text)",
          marginBottom: "1rem",
        }}
      >
        {number}
      </div>
      <h3
        style={{
          fontSize: "1.1rem",
          fontWeight: 700,
          color: "var(--nr-text)",
          marginBottom: "0.5rem",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: "0.9rem",
          color: "var(--nr-text-soft)",
          lineHeight: 1.65,
          margin: 0,
        }}
      >
        {body}
      </p>
    </div>
  );
}