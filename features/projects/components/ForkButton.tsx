"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ForkButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFork() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/fork`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not fork project");
        setLoading(false);
        return;
      }

      router.push(`/projects/${data.project.id}`);
      router.refresh();
    } catch {
      setError("Could not fork project");
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <button
        onClick={handleFork}
        disabled={loading}
        className="nr-button"
        style={{ width: "auto" }}
      >
        {loading ? "Forking" : "Start my own version"}
      </button>
      {error && (
        <div
          style={{
            fontSize: "0.8rem",
            color: "var(--nr-text-soft)",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}