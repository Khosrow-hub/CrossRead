"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }
      router.push("/library");
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="nr-auth-title">Log in</h1>

      <form onSubmit={handleSubmit}>
        {error && <div className="nr-error">{error}</div>}

        <div style={{ marginBottom: "1rem" }}>
          <label className="nr-auth-label" htmlFor="identifier">
            Username or email
          </label>
          <input
            id="identifier"
            type="text"
            className="nr-input"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
            required
          />
        </div>

        <div style={{ marginBottom: "0.5rem" }}>
          <label className="nr-auth-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="nr-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "1.25rem",
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--nr-text-soft)",
              opacity: 0.6,
              cursor: "not-allowed",
            }}
            title="Password reset is not built yet"
          >
            Forgot password?
          </span>
        </div>

        <button
          type="submit"
          className="nr-button nr-auth-button"
          disabled={loading}
        >
          {loading ? "Logging in" : "Log in"}
        </button>
      </form>

      <p
        style={{
          marginTop: "1.5rem",
          fontSize: "0.85rem",
          color: "var(--nr-text-soft)",
          textAlign: "center",
        }}
      >
        New to CrossRead?{" "}
        <Link href="/register" className="nr-link">
          Create an account
        </Link>
      </p>

      <p
        style={{
          marginTop: "1.75rem",
          fontSize: "0.7rem",
          color: "var(--nr-text-soft)",
          opacity: 0.6,
          textAlign: "center",
        }}
      >
        Terms and privacy are not published yet.
      </p>
    </div>
  );
}