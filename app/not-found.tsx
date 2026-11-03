import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "var(--nr-bg)",
      }}
    >
      <div
        className="nr-surface-lg"
        style={{
          width: "100%",
          maxWidth: "480px",
          padding: "2.5rem 2rem",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "1.4rem",
            fontWeight: 700,
            marginBottom: "0.75rem",
            color: "var(--nr-text)",
          }}
        >
          Page not found
        </h1>
        <p
          style={{
            fontSize: "0.95rem",
            color: "var(--nr-highlight)",
            marginBottom: "1.75rem",
          }}
        >
          The page you are looking for does not exist.
        </p>
        <Link href="/library" className="nr-button" style={{ textDecoration: "none" }}>
          Go to library
        </Link>
      </div>
    </div>
  );
}