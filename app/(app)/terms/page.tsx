import Link from "next/link";

export default function TermsPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="nr-surface" style={{ padding: "2rem" }}>
        <h1
          style={{
            fontSize: "1.6rem",
            fontWeight: 700,
            color: "var(--nr-text)",
            marginBottom: "0.5rem",
          }}
        >
          Terms of Service
        </h1>
        <p style={{ fontSize: "0.85rem", color: "var(--nr-text-soft)" }}>
          Last updated: today
        </p>
      </div>

      <div className="nr-surface" style={{ padding: "2rem" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
            fontSize: "0.95rem",
            color: "var(--nr-text)",
            lineHeight: 1.7,
          }}
        >
          <section>
            <h2
              style={{
                fontSize: "1.05rem",
                fontWeight: 700,
                marginBottom: "0.5rem",
              }}
            >
              What CrossRead is
            </h2>
            <p>
              CrossRead is a reading platform where you can create reading
              projects, annotate passages, save versions of your reading, and
              build on other readers&apos; interpretations.
            </p>
          </section>

          <section>
            <h2
              style={{
                fontSize: "1.05rem",
                fontWeight: 700,
                marginBottom: "0.5rem",
              }}
            >
              Your account
            </h2>
            <p>
              You need an account to use CrossRead. You are responsible for
              keeping your password safe. You are responsible for what you post
              with your account. Do not share your account with others.
            </p>
          </section>

          <section>
            <h2
              style={{
                fontSize: "1.05rem",
                fontWeight: 700,
                marginBottom: "0.5rem",
              }}
            >
              Your content
            </h2>
            <p>
              Your notes, highlights, projects, and versions belong to you. By
              making a project public, you allow other readers to read it, fork
              it, and suggest edits. You can make any project private again at
              any time.
            </p>
          </section>

          <section>
            <h2
              style={{
                fontSize: "1.05rem",
                fontWeight: 700,
                marginBottom: "0.5rem",
              }}
            >
              What you must not do
            </h2>
            <p>
              Do not post content that is illegal, hateful, or harassing. Do not
              upload copyrighted text that you do not have the right to share.
              Do not try to break into other accounts or overload the service.
            </p>
          </section>

          <section>
            <h2
              style={{
                fontSize: "1.05rem",
                fontWeight: 700,
                marginBottom: "0.5rem",
              }}
            >
              Ending your account
            </h2>
            <p>
              You can delete your account at any time from Settings. When you
              delete your account, your projects, notes, and versions are
              deleted. Public work you contributed to other readers&apos;
              projects through accepted suggestions will be recorded in their
              history as a contribution, but your account will not be visible.
            </p>
          </section>

          <section>
            <h2
              style={{
                fontSize: "1.05rem",
                fontWeight: 700,
                marginBottom: "0.5rem",
              }}
            >
              No warranty
            </h2>
            <p>
              CrossRead is provided as is, without any warranty. We try to keep
              it running and your data safe, but we cannot promise the service
              will never be interrupted or that data will never be lost. Keep
              your own copy of anything important.
            </p>
          </section>

          <section>
            <h2
              style={{
                fontSize: "1.05rem",
                fontWeight: 700,
                marginBottom: "0.5rem",
              }}
            >
              Changes
            </h2>
            <p>
              These terms may change as the product grows. If they change in a
              way that matters, you will be told when you next log in.
            </p>
          </section>
        </div>
      </div>

      <Link
        href="/settings"
        className="nr-link"
        style={{ fontSize: "0.9rem" }}
      >
        Back to settings
      </Link>
    </div>
  );
}