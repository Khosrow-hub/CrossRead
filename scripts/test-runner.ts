import { spawn } from "child_process";
import { setTimeout as sleep } from "timers/promises";

const TEST_PORT = 3100;

async function waitForServer(url: string, timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status === 200 || res.status === 401) return;
    } catch {}
    await sleep(500);
  }
  throw new Error(`Server did not start at ${url} in ${timeoutMs}ms`);
}

async function main() {
  console.log("Starting test server on port", TEST_PORT);

  const server = spawn(
    "npx",
    ["next", "dev", "-p", String(TEST_PORT)],
    {
      env: {
        ...process.env,
        NODE_ENV: "test",
        DATABASE_URL:
          process.env.DATABASE_URL ??
          "postgresql://crossread:crossread_dev@127.0.0.1:5434/crossread_test",
      },
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  let serverOutput = "";
  server.stdout?.on("data", (d) => {
    serverOutput += d.toString();
    process.stdout.write(d);
  });
  server.stderr?.on("data", (d) => {
    serverOutput += d.toString();
    process.stderr.write(d);
  });

  server.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.error("Server exited with code", code);
      console.error(serverOutput);
    }
  });

  try {
    await waitForServer(`http://localhost:${TEST_PORT}/api/books`, 60000);
    console.log("Server ready. Running tests.");

    const vitest = spawn("npx", ["vitest", "run"], {
      env: process.env,
      shell: true,
      stdio: "inherit",
    });

    const exitCode = await new Promise<number>((resolve) => {
      vitest.on("exit", (code) => resolve(code ?? 1));
    });

    server.kill();
    process.exit(exitCode);
  } catch (err) {
    console.error("Test runner failed:", err);
    server.kill();
    process.exit(1);
  }
}

main();