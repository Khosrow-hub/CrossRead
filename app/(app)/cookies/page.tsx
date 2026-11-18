import Link from "next/link";

export default function CookiesPage() {
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
          Cookies
        </h1>
      </div>

      <div className="nr-surface" style={{ padding: "2rem" }}>
        <div
          style={{
            fontSize: "0.95rem",
            color: "var(--nr-text)",
            lineHeight: 1.7,
          }}
        >
          <p style={{ marginBottom: "1.25rem" }}>
            CrossRead uses exactly one cookie. It is called
            <code
              style={{
                background: "var(--nr-bg)",
                padding: "0.15rem 0.4rem",
                borderRadius: "0.3rem",
                fontSize: "0.85rem",
                margin: "0 0.25rem",
              }}
            >
              crossread_session
            </code>
            and its only job is to keep you logged in.
          </p>

          <p style={{ marginBottom: "1.25rem" }}>
            The cookie is HTTP only, which means JavaScript in the browser
            cannot read it. That is a security measure. It expires after seven
            days of inactivity, and you can remove it at any time by logging out
            or by clearing cookies for this site in your browser settings.
          </p>

          <p style={{ marginBottom: "1.25rem" }}>
            We do not use advertising cookies. We do not use analytics cookies.
            We do not use cookies from other companies. There is no third party
            tracker on any page of CrossRead.
          </p>

          <p>
            Your reading preferences (font size, line height, and light or dark
            mode) are stored in your browser&apos;s local storage, which is not
            a cookie. Clearing your browser data removes them, but does not log
            you out.
          </p>
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