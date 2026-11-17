import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--nr-bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
      }}
    >
      <div
        className="nr-surface-lg"
        style={{
          width: "100%",
          maxWidth: "60rem",
          minHeight: "30rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <img
          src="/auth-image.png"
          alt=""
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: "55%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />

        <svg
          aria-hidden
          viewBox="0 0 320 1440"
          preserveAspectRatio="none"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: "38%",
            width: "20%",
            height: "100%",
            filter: "drop-shadow(-6px 0 12px rgba(0,0,0,0.2))",
          }}
        >
          <path
            d="M 96 0 L 96 48 C 96 96, 96 192, 90.7 288 C 85 384, 75 480, 85.3 576 C 96 672, 128 768, 122.7 864 C 117 960, 75 1056, 58.7 1152 C 43 1248, 53 1344, 58.7 1392 L 64 1440 L 320 1440 L 320 0 Z"
            fill="var(--nr-surface)"
          />
        </svg>

        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            right: 0,
            width: "60%",
            padding: "2.5rem 2.5rem 2.5rem 5rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}