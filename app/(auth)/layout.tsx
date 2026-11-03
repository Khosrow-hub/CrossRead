import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
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
          maxWidth: "440px",
          padding: "2.75rem 2.25rem",
        }}
      >
        {children}
      </div>
    </div>
  );
}