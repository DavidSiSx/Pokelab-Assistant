"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Wand2, ShieldCheck, RefreshCw, Bookmark, LogIn, LogOut, User,
} from "lucide-react";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import { PokeballMini } from "@/components/ui/PokeballBg";
import { useAuth } from "@/providers/AuthProvider";

const NAV_ITEMS = [
  { href: "/builder", label: "Builder",  Icon: Wand2 },
  { href: "/review",  label: "Review",   Icon: ShieldCheck },
  { href: "/swap",    label: "Swap",     Icon: RefreshCw },
  { href: "/teams",   label: "Mis Teams",Icon: Bookmark },
];

function PokeballLogo() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="transition-transform duration-300 group-hover:rotate-[20deg]"
    >
      <circle cx="50" cy="50" r="46" fill="var(--bg-card)" stroke="var(--accent)" strokeWidth="4" />
      <path d="M50 4C25.147 4 4.5 24.2 4 48h92C95.5 24.2 74.853 4 50 4z" fill="var(--accent)" />
      <rect x="4" y="46" width="92" height="8" fill="var(--border)" />
      <circle cx="50" cy="50" r="14" fill="var(--bg-surface)" stroke="var(--accent)" strokeWidth="3" />
      <circle cx="50" cy="50" r="7" fill="var(--accent)" />
      <circle cx="50" cy="47" r="2.5" fill="var(--accent-light)" opacity="0.7" />
    </svg>
  );
}

export function AppNav() {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();

  return (
    <>
      {/* Desktop Top Nav */}
      <header
        className="hidden md:flex items-center justify-between px-6 h-16 sticky top-0 z-30"
        style={{
          background: "color-mix(in srgb, var(--bg-surface) 85%, transparent)",
          borderBottom: "1px solid var(--border)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 font-bold text-sm select-none"
          style={{ color: "var(--text-primary)", textDecoration: "none" }}
        >
          <PokeballLogo />
          <span className="flex items-center gap-1.5">
            <span style={{ color: "var(--text-primary)" }} className="font-bold tracking-tight text-base">Pokelab</span>
            <span
              className="text-[0.65rem] font-black uppercase tracking-widest px-2 py-0.5 rounded-md"
              style={{
                background: "var(--accent)",
                color: "#fff",
                letterSpacing: "0.1em",
              }}
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
                className="relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-[0.8rem] font-medium transition-all duration-200"
                style={{
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                  background: active ? "var(--accent-glow)" : "transparent",
                  textDecoration: "none",
                }}
              >
                <Icon size={15} strokeWidth={active ? 2.5 : 2} />
                {label}
                {active && (
                  <span
                    className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                    style={{
                      background: "var(--accent)",
                    }}
                  />
                )}
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
              <div className="relative">
                <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                {active && (
                  <span
                    className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full animate-pulse-glow"
                    style={{ background: "var(--accent)" }}
                  />
                )}
              </div>
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
