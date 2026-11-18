import Link from "next/link";

export default function PrivacyPage() {
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
          Privacy Policy
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
              What we collect
            </h2>
            <p>
              When you create an account we store your username, email address,
              a hashed password, and anything you choose to add to your profile.
              When you use CrossRead we store the reading projects you create,
              the annotations you write, the versions you save, and your reading
              progress.
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
              Why we collect it
            </h2>
            <p>
              We collect this data so that the product works. Your notes need a
              home. Your sessions need to know who you are. Your project history
              needs to remember what changed and when.
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
              What we do not do
            </h2>
            <p>
              We do not sell your data. We do not share it with advertisers. We
              do not use it to train AI models. We do not track you across other
              websites.
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
              Cookies and storage
            </h2>
            <p>
              We store one cookie, which holds a session token that keeps you
              logged in. We also store your reading preferences (font size, line
              height, theme) in your browser&apos;s local storage. No other
              cookies are set.
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
              Your rights
            </h2>
            <p>
              You can download everything you have written at any time from any
              project, using the export buttons. You can delete your account at
              any time from Settings. When you delete your account, your
              projects, notes, and versions are removed from the database.
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
              Data retention
            </h2>
            <p>
              We keep your data for as long as your account exists. When you
              delete your account, your personal data is removed within a few
              seconds. Database backups may still contain older copies for a
              short time, but they are never used to restore deleted accounts.
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
              Contact
            </h2>
            <p>
              Questions about your data can be sent to the email address listed
              on the profile of the site administrator.
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