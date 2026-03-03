"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { LogIn, Eye, EyeOff } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createBrowserClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError(
        authError.message === "Invalid login credentials"
          ? "Correo o contraseña incorrectos."
          : authError.message
      );
      setLoading(false);
      return;
    }

    router.push("/builder");
    router.refresh();
  }

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2 font-bold text-lg mb-8 select-none"
        style={{ color: "var(--text-primary)", textDecoration: "none" }}
      >
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          P
        </span>
        <span>Pokelab</span>
        <span style={{ color: "var(--accent)" }}>AI</span>
      </Link>

      {/* Card */}
      <div
        className="card w-full max-w-sm p-8 flex flex-col gap-6 animate-fade-in-scale"
      >
        <div className="flex flex-col gap-1">
          <h1
            className="font-bold text-xl"
            style={{ color: "var(--text-primary)" }}
          >
            Inicia sesión
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Accede a tus equipos guardados y más.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="trainer@pokemon.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="input pr-10"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="rounded-lg px-3 py-2 text-sm animate-fade-in"
              style={{
                background: "rgba(239,68,68,0.1)",
                color: "var(--danger)",
                border: "1px solid rgba(239,68,68,0.25)",
              }}
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="btn-primary w-full animate-pulse-glow"
            disabled={loading || !email || !password}
            style={{ marginTop: 4 }}
          >
            <LogIn size={16} />
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="divider flex-1" />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            o
          </span>
          <div className="divider flex-1" />
        </div>

        {/* Register link */}
        <p className="text-sm text-center" style={{ color: "var(--text-secondary)" }}>
          {"¿No tienes cuenta? "}
          <Link
            href="/register"
            className="font-semibold"
            style={{ color: "var(--accent)", textDecoration: "none" }}
          >
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  );
}
