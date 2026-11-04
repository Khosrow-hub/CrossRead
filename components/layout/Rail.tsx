"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const items = [
  { href: "/library", label: "Library" },
  { href: "/books", label: "Books" },
  { href: "/projects", label: "Projects" },
  { href: "/projects/versions", label: "Versions" },
  { href: "/settings", label: "Settings" },
];

export function Rail({
  username,
  email,
  displayName,
}: {
  username: string;
  email: string;
  displayName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div
      className="nr-surface"
      style={{
        width: "5rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "1rem 0.5rem",
        gap: "1rem",
        flexShrink: 0,
      }}
    >
      <Link
        href="/library"
        className="nr-inset"
        style={{
          width: "2.25rem",
          height: "2.25rem",
          borderRadius: "0.75rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1rem",
          fontWeight: 700,
          color: "var(--nr-text)",
          textDecoration: "none",
        }}
      >
        C
      </Link>

      <div
        className="nr-inset"
        style={{
          flex: 1,
          width: "2.5rem",
          borderRadius: "1.25rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.75rem",
          padding: "1rem 0",
        }}
      >
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/library" && pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              style={{
                width: "0.85rem",
                height: "0.85rem",
                borderRadius: "0.3rem",
                background: active ? "var(--nr-accent)" : "var(--nr-surface)",
                boxShadow: active
                  ? "inset 2px 2px 4px var(--nr-shadow-dark), inset -2px -2px 4px var(--nr-shadow-light)"
                  : "-2px -2px 4px var(--nr-shadow-light), 2px 2px 4px var(--nr-shadow-dark)",
                transition: "all 120ms ease",
              }}
            />
          );
        })}
      </div>

      <div ref={menuRef} style={{ position: "relative" }}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="nr-surface-sm"
          style={{
            width: "2.25rem",
            height: "2.25rem",
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
            color: "var(--nr-text)",
            fontWeight: 700,
            fontSize: "0.9rem",
          }}
          title={displayName}
        >
          {displayName.charAt(0).toUpperCase()}
        </button>

        {menuOpen && (
          <div
            className="nr-surface"
            style={{
              position: "absolute",
              bottom: "2.75rem",
              left: "0",
              padding: "0.9rem 1rem",
              width: "15rem",
              zIndex: 100,
            }}
          >
            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "var(--nr-text)",
                marginBottom: "0.2rem",
              }}
            >
              {displayName}
            </div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--nr-text-soft)",
                marginBottom: "0.75rem",
              }}
            >
              @{username}
            </div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--nr-text-soft)",
                marginBottom: "0.9rem",
                wordBreak: "break-all",
              }}
            >
              {email}
            </div>
            <button
              onClick={handleLogout}
              className="nr-button"
              style={{ width: "100%", padding: "0.5rem" }}
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}