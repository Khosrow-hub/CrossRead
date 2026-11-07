"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  badge?: number;
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/library") return pathname === "/library";
  if (href === "/projects") {
    return (
      pathname === "/projects" ||
      (pathname.startsWith("/projects/") &&
        !pathname.startsWith("/projects/versions") &&
        !pathname.includes("/versions") &&
        !pathname.endsWith("/read"))
    );
  }
  return pathname === href || pathname.startsWith(href + "/");
}

function isReaderPage(pathname: string): boolean {
  return /^\/projects\/[^/]+\/read(\/|$)/.test(pathname);
}

export function Rail({
  username,
  email,
  displayName,
  avatarUrl,
}: {
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [unread, setUnread] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function update() {
      setIsMobile(window.innerWidth < 1100);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/notifications/unread", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setUnread(data.count ?? 0);
      } catch {
        // ignore
      }
    }

    load();
    const id = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [pathname]);

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

  const items: NavItem[] = [
    { href: "/library", label: "Library", icon: "M" },
    { href: "/books", label: "Books", icon: "B" },
    { href: "/projects", label: "Projects", icon: "P" },
    { href: "/projects/versions", label: "Versions", icon: "V" },
    { href: "/notifications", label: "Alerts", icon: "N", badge: unread },
    { href: "/settings", label: "Settings", icon: "S" },
  ];

  const readerMode = isReaderPage(pathname);

  if (isMobile) {
    if (readerMode) {
      return null;
    }

    return (
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: "flex",
          justifyContent: "space-around",
          alignItems: "stretch",
          padding: "0.4rem 0.2rem calc(0.4rem + env(safe-area-inset-bottom))",
          background: "var(--nr-surface)",
          boxShadow:
            "0 -6px 20px rgba(0,0,0,0.08), 0 -1px 0 var(--nr-shadow-dark)",
        }}
      >
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.15rem",
                padding: "0.3rem 0",
                textDecoration: "none",
                color: active ? "var(--nr-accent)" : "var(--nr-text-soft)",
                fontSize: "0.6rem",
                fontWeight: active ? 700 : 500,
                position: "relative",
              }}
            >
              <div
                className={active ? "nr-inset" : ""}
                style={{
                  width: "1.9rem",
                  height: "1.9rem",
                  borderRadius: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  position: "relative",
                }}
              >
                {item.icon}
                {item.badge && item.badge > 0 ? (
                  <span
                    style={{
                      position: "absolute",
                      top: "-0.15rem",
                      right: "-0.15rem",
                      minWidth: "1rem",
                      height: "1rem",
                      borderRadius: "0.5rem",
                      background: "var(--nr-accent)",
                      color: "white",
                      fontSize: "0.6rem",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 0.25rem",
                    }}
                  >
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                ) : null}
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className="nr-surface"
      style={{
        width: "7.5rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        padding: "1rem 0.5rem",
        gap: "1rem",
        flexShrink: 0,
      }}
    >
      <Link
        href="/library"
        className="nr-inset"
        style={{
          height: "2.5rem",
          borderRadius: "0.75rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.4rem",
          fontSize: "0.9rem",
          fontWeight: 700,
          color: "var(--nr-text)",
          textDecoration: "none",
        }}
      >
        <span>C</span>
        <span style={{ fontSize: "0.85rem", letterSpacing: "-0.01em" }}>
          CrossRead
        </span>
      </Link>

      <div
        className="nr-inset"
        style={{
          flex: 1,
          borderRadius: "1rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          gap: "0.35rem",
          padding: "0.6rem 0.35rem",
        }}
      >
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.55rem 0.6rem",
                borderRadius: "0.6rem",
                textDecoration: "none",
                background: active ? "var(--nr-surface)" : "transparent",
                boxShadow: active
                  ? "-3px -3px 8px var(--nr-shadow-light), 3px 3px 8px var(--nr-shadow-dark)"
                  : "none",
                color: active ? "var(--nr-accent)" : "var(--nr-text-soft)",
                fontSize: "0.8rem",
                fontWeight: active ? 700 : 500,
                transition: "all 120ms ease",
                position: "relative",
              }}
            >
              <span
                style={{
                  width: "1.5rem",
                  height: "1.5rem",
                  borderRadius: "0.4rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  background: active ? "var(--nr-bg)" : "var(--nr-surface)",
                  color: active ? "var(--nr-accent)" : "var(--nr-text-soft)",
                  position: "relative",
                }}
              >
                {item.icon}
                {item.badge && item.badge > 0 ? (
                  <span
                    style={{
                      position: "absolute",
                      top: "-0.2rem",
                      right: "-0.2rem",
                      minWidth: "1rem",
                      height: "1rem",
                      borderRadius: "0.5rem",
                      background: "var(--nr-accent)",
                      color: "white",
                      fontSize: "0.6rem",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 0.25rem",
                    }}
                  >
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                ) : null}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>

      <div ref={menuRef} style={{ position: "relative" }}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="nr-surface-sm"
          style={{
            width: "100%",
            height: "2.75rem",
            borderRadius: "0.75rem",
            border: "none",
            cursor: "pointer",
            color: "var(--nr-text)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0 0.4rem",
            background: "var(--nr-surface)",
          }}
          title={displayName}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              style={{
                width: "1.9rem",
                height: "1.9rem",
                borderRadius: "50%",
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
          ) : (
            <span
              style={{
                width: "1.9rem",
                height: "1.9rem",
                borderRadius: "50%",
                background: "var(--nr-surface)",
                boxShadow:
                  "-2px -2px 4px var(--nr-shadow-light), 2px 2px 4px var(--nr-shadow-dark)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "0.8rem",
                flexShrink: 0,
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {displayName}
          </span>
        </button>

        {menuOpen && (
          <div
            className="nr-surface"
            style={{
              position: "absolute",
              bottom: "3.25rem",
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