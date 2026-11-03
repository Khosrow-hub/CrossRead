import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth/require-user";

export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireUser();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--nr-bg)",
        padding: "2rem",
      }}
    >
      {children}
    </div>
  );
}