"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="nr-button"
      disabled={loading}
      style={{ width: "auto", padding: "0.6rem 1.1rem", fontSize: "0.85rem" }}
    >
      {loading ? "Logging out" : "Log out"}
    </button>
  );
}