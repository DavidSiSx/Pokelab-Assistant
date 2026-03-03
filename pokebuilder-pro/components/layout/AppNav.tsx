"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Wand2, ShieldCheck, RefreshCw, Bookmark, LogIn, LogOut, User,
} from "lucide-react";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import { useAuth } from "@/providers/AuthProvider";

const NAV_ITEMS = [
  { href: "/builder", label: "Builder",  Icon: Wand2 },
  { href: "/review",  label: "Review",   Icon: ShieldCheck },
  { href: "/swap",    label: "Swap",     Icon: RefreshCw },
  { href: "/teams",   label: "Mis Teams",Icon: Bookmark },
];

export function AppNav() {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();

  return (
    <>
      {/* ── Desktop Sidebar / Top Nav ───────────────────────── */}
      <header
        className="hidden md:flex items-center justify-between px-6 py-3 sticky top-0 z-30"
        style={{
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-base select-none"
          style={{ color: "var(--text-primary)", textDecoration: "none" }}
        >
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-black"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            P
          </span>
          <span style={{ color: "var(--text-primary)" }}>Pokelab</span>
          <span style={{ color: "var(--accent)" }}>AI</span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1" aria-label="Navegación principal">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150"
                style={{
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                  background: active ? "var(--accent-glow)" : "transparent",
                  textDecoration: "none",
                }}
              >
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <ThemeSwitcher compact />
          {!loading && (
            user ? (
              <div className="flex items-center gap-2">
                <span
                  className="text-xs hidden lg:flex items-center gap-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  <User size={12} />
                  {user.email?.split("@")[0]}
                </span>
                <button
                  onClick={signOut}
                  className="btn-ghost flex items-center gap-1.5 text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  <LogOut size={14} />
                  <span className="hidden lg:inline">Salir</span>
                </button>
              </div>
            ) : (
              <Link href="/login" className="btn-primary py-2 px-3 text-xs flex items-center gap-1.5">
                <LogIn size={13} />
                Ingresar
              </Link>
            )
          )}
        </div>
      </header>

      {/* ── Mobile Bottom Tab Bar ────────────────────────────── */}
      <nav
        className="bottom-nav md:hidden"
        aria-label="Navegación móvil"
      >
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`bottom-nav-item ${active ? "active" : ""}`}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
        {!loading && (
          user ? (
            <button
              onClick={signOut}
              className="bottom-nav-item"
              aria-label="Cerrar sesión"
            >
              <LogOut size={20} />
              Salir
            </button>
          ) : (
            <Link href="/login" className="bottom-nav-item">
              <LogIn size={20} />
              Login
            </Link>
          )
        )}
      </nav>
    </>
  );
}
