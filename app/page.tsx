import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/library");
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--nr-bg)" }}>
      <div
        style={{
          position: "relative",
          minHeight: "100vh",
          width: "100%",
          overflow: "hidden",
        }}
      >
        <div
          className="landing-background"
          style={{
            position: "absolute",
            inset: 0,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />

        <div
          aria-hidden
          className="landing-overlay"
          style={{ position: "absolute", inset: 0 }}
        />

        <header
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "2rem 3rem",
            maxWidth: "90rem",
            margin: "0 auto",
          }}
        >
          <Link
            href="/"
            style={{
              display: "block",
              width: "13rem",
              height: "4.5rem",
              textDecoration: "none",
            }}
            aria-label="CrossRead home"
          >
            <div
              className="brand-logo"
              style={{ width: "100%", height: "100%" }}
            />
          </Link>

          <nav style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <Link
              href="/login"
              className="landing-button-secondary"
              style={{ padding: "0.5rem 1rem" }}
            >
              Log in
            </Link>
            <Link href="/register" className="landing-button-primary">
              Create account
            </Link>
          </nav>
        </header>

        <div
          style={{
            position: "relative",
            zIndex: 2,
            minHeight: "calc(100vh - 6rem)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "2rem 1.5rem 6rem",
          }}
        >
          <h1
            className="landing-text-primary"
            style={{
              fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              maxWidth: "48rem",
              marginBottom: "1.25rem",
            }}
          >
            Read together. Think independently.
          </h1>

          <p
            className="landing-text-secondary"
            style={{
              fontSize: "clamp(1rem, 1.3vw, 1.15rem)",
              lineHeight: 1.6,
              maxWidth: "32rem",
              marginBottom: "2.5rem",
            }}
          >
            CrossRead turns a book into a shared reading project, with notes,
            versions, and interpretations that grow with every reader.
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1.25rem",
            }}
          >
            <Link href="/register" className="landing-button-primary">
              Start reading
            </Link>
            <Link href="/login" className="landing-button-secondary">
              I already have an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}