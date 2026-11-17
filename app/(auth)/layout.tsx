"use client";

import type { ReactNode } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { theme } = useTheme();

  const imageSrc =
    theme === "dark" ? "/auth-image.png" : "/auth-image-light.png";

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
          maxWidth: "62rem",
          minHeight: "34rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <img
          src={imageSrc}
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
          viewBox="0 0 600 800"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: "35%",
            width: "25%",
            height: "100%",
            //filter: "drop-shadow(-6px 0 14px rgba(0,0,0,0.18))",
            pointerEvents: "none",
          }}
        >
          <path
            d="M 300 0 
               C 450 150, 150 300, 300 450 
               C 450 600, 150 700, 300 800 
               L 600 800 
               L 600 0 
               Z"
            fill="var(--nr-surface)"
          />
        </svg>

        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            right: 0,
            width: "55%",
            padding: "2.5rem 2.5rem 2.5rem 3rem",
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