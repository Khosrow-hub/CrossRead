import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth/require-user";
import { Rail } from "@/components/layout/Rail";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--nr-bg)",
        padding: "2rem",
        display: "flex",
        alignItems: "stretch",
        justifyContent: "center",
      }}
    >
      <div
        className="nr-surface-lg"
        style={{
          width: "100%",
          maxWidth: "1400px",
          padding: "1.25rem",
          display: "flex",
          gap: "1.25rem",
        }}
      >
        <Rail
          username={user.username}
          email={user.email}
          displayName={user.displayName ?? user.username}
        />
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            minWidth: 0,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}