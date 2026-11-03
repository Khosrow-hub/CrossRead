"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
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
      <h1
        style={{
          fontSize: "1.6rem",
          fontWeight: 700,
          marginBottom: "1.75rem",
          color: "var(--nr-text)",
        }}
      >
        Create your account
      </h1>

      <form onSubmit={handleSubmit}>
        {error && <div className="nr-error">{error}</div>}

        <div style={{ marginBottom: "1.1rem" }}>
          <label htmlFor="username" className="nr-label">
            Username
          </label>
          <input
            id="username"
            type="text"
            className="nr-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </div>

        <div style={{ marginBottom: "1.1rem" }}>
          <label htmlFor="email" className="nr-label">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="nr-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div style={{ marginBottom: "1.75rem" }}>
          <label htmlFor="password" className="nr-label">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="nr-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
          />
        </div>

        <button type="submit" className="nr-button" disabled={loading}>
          {loading ? "Creating account" : "Create account"}
        </button>
      </form>

      <p
        style={{
          marginTop: "1.75rem",
          fontSize: "0.9rem",
          color: "var(--nr-text-soft)",
          textAlign: "center",
        }}
      >
        Already have an account?{" "}
        <Link href="/login" className="nr-link">
          Log in
        </Link>
      </p>
    </div>
  );
}