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
      {/* Desktop Top Nav */}
      <header
        className="hidden md:flex items-center justify-between px-6 h-14 sticky top-0 z-30"
        style={{
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-bold text-sm select-none"
          style={{ color: "var(--text-primary)", textDecoration: "none" }}
        >
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            P
          </span>
          <span>
            <span style={{ color: "var(--text-primary)" }}>Pokelab</span>
            {" "}
            <span
              className="text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ background: "var(--accent-glow)", color: "var(--accent)" }}
            >
              AI
            </span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1" aria-label="Navegacion principal">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-[0.8rem] font-medium transition-all duration-150"
                style={{
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                  background: active ? "var(--accent-glow)" : "transparent",
                  textDecoration: "none",
                }}
              >
                <Icon size={15} strokeWidth={active ? 2.5 : 2} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <ThemeSwitcher compact />
          {!loading && (
            user ? (
              <div className="flex items-center gap-3">
                <span
                  className="text-xs hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                  style={{
                    color: "var(--text-secondary)",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                  }}
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
              <Link
                href="/login"
                className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5"
              >
                <LogIn size={13} />
                Ingresar
              </Link>
            )
          )}
        </div>
      </header>

      {/* Mobile Bottom Tab Bar */}
      <nav
        className="bottom-nav md:hidden"
        aria-label="Navegacion movil"
      >
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`bottom-nav-item ${active ? "active" : ""}`}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              <span>{label}</span>
            </Link>
          );
        })}
        {!loading && (
          user ? (
            <button
              onClick={signOut}
              className="bottom-nav-item"
              aria-label="Cerrar sesion"
            >
              <LogOut size={18} />
              <span>Salir</span>
            </button>
          ) : (
            <Link href="/login" className="bottom-nav-item">
              <LogIn size={18} />
              <span>Login</span>
            </Link>
          )
        )}
      </nav>
    </>
  );
}
