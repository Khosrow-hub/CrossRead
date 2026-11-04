import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth/require-user";
import { LogoutButton } from "@/components/layout/LogoutButton";

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
        {/* LEFT RAIL */}
        <div
          className="nr-surface"
          style={{
            width: "4.5rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "1rem 0.5rem",
            gap: "1rem",
            flexShrink: 0,
          }}
        >
          {/* top star */}
          <div
            className="nr-inset"
            style={{
              width: "2.25rem",
              height: "2.25rem",
              borderRadius: "0.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.1rem",
              color: "var(--nr-accent)",
            }}
          >
            ✦
          </div>

          {/* track with 5 small squares */}
          <div
            className="nr-inset"
            style={{
              flex: 1,
              width: "2.25rem",
              borderRadius: "1.1rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.9rem",
              padding: "1rem 0",
            }}
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="nr-surface-sm"
                style={{
                  width: "0.6rem",
                  height: "0.6rem",
                  borderRadius: "0.2rem",
                }}
              />
            ))}
          </div>

          {/* avatar */}
          <div
            className="nr-surface-sm"
            style={{
              width: "2.25rem",
              height: "2.25rem",
              borderRadius: "50%",
            }}
            title={user.username}
          />
        </div>

        {/* RIGHT SIDE: everything else */}
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