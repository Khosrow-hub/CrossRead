import { describe, it, expect, beforeAll } from "vitest";
import { execSync } from "child_process";

const baseUrl = "http://localhost:3100";

function psql(sql: string): string {
  const result = execSync(
    `docker exec crossread-postgres psql -U crossread -d crossread_test -t -A -q -c "${sql.replace(/"/g, '\\"')}"`,
    { encoding: "utf-8" }
  );
  return result.trim();
}

function truncate() {
  execSync(
    `docker exec crossread-postgres psql -U crossread -d crossread_test -q -c "TRUNCATE TABLE notifications, annotation_comments, suggestions, version_edits, versions, reading_progress, annotations, passages, chapters, projects, books, users, sessions RESTART IDENTITY CASCADE"`,
    { stdio: "pipe" }
  );
}

beforeAll(() => {
  truncate();
});

describe("auth", () => {
  it("registers a new user and stores a hashed password", async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "alice",
        email: "alice@example.com",
        password: "secret12345",
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.user.username).toBe("alice");

    const hash = psql(
      `SELECT password_hash FROM users WHERE username = 'alice'`
    );
    expect(hash).not.toBe("secret12345");
    expect(hash.length).toBeGreaterThan(20);
  }, 20000);

  it("refuses to register a duplicate username", async () => {
    await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "bob",
        email: "bob@example.com",
        password: "secret12345",
      }),
    });

    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "bob",
        email: "different@example.com",
        password: "secret12345",
      }),
    });

    expect(res.status).toBe(409);
  }, 20000);

  it("refuses a login with the wrong password", async () => {
    await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "carol",
        email: "carol@example.com",
        password: "secret12345",
      }),
    });

    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: "carol",
        password: "wrongpassword",
      }),
    });

    expect(res.status).toBe(401);
  }, 20000);

  it("logs in with the correct password", async () => {
    await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "dave",
        email: "dave@example.com",
        password: "secret12345",
      }),
    });

    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: "dave",
        password: "secret12345",
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.username).toBe("dave");
  }, 20000);
});