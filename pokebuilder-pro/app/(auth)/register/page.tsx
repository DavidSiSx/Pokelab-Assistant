"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8 caracteres mínimo", pass: password.length >= 8 },
    { label: "Una letra mayúscula", pass: /[A-Z]/.test(password) },
    { label: "Un número", pass: /\d/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const colors = ["var(--danger)", "var(--warning)", "var(--warning)", "var(--success)"];
  const labels = ["", "Débil", "Media", "Fuerte"];

  if (!password) return null;

  return (
    <div className="flex flex-col gap-2 animate-fade-in">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{
              background: i < score ? colors[score] : "var(--border)",
            }}
          />
        ))}
      </div>
      <div className="flex flex-col gap-1">
        {checks.map(({ label, pass }) => (
          <div key={label} className="flex items-center gap-1.5">
            <CheckCircle2
              size={11}
              style={{ color: pass ? "var(--success)" : "var(--border)", flexShrink: 0 }}
            />
            <span
              className="text-xs"
              style={{ color: pass ? "var(--text-secondary)" : "var(--text-muted)" }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createBrowserClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordsMatch = password === confirm;
  const isStrong = password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password);
  const canSubmit = email && password && confirm && passwordsMatch && isStrong && !loading;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!passwordsMatch) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (!isStrong) {
      setError("La contraseña no cumple los requisitos mínimos.");
      return;
    }

    setLoading(true);

    const { error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (authError) {
      setError(
        authError.message.includes("already registered")
          ? "Ya existe una cuenta con ese correo."
          : authError.message
      );
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div
        className="min-h-dvh flex flex-col items-center justify-center px-4 py-12"
        style={{ background: "var(--bg-base)" }}
      >
        <div className="card w-full max-w-sm p-8 flex flex-col items-center gap-6 text-center animate-fade-in-scale">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center animate-float"
            style={{ background: "rgba(34,197,94,0.15)", border: "1px solid var(--success)" }}
          >
            <CheckCircle2 size={32} style={{ color: "var(--success)" }} />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="font-bold text-xl" style={{ color: "var(--text-primary)" }}>
              Confirma tu correo
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Te enviamos un enlace de confirmación a{" "}
              <strong style={{ color: "var(--accent)" }}>{email}</strong>.
              Revisa tu bandeja de entrada para activar tu cuenta.
            </p>
          </div>
          <Link href="/login" className="btn-primary w-full">
            Ir al login
          </Link>
        </div>
      </div>
    );
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
      <div className="card w-full max-w-sm p-8 flex flex-col gap-6 animate-fade-in-scale">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-xl" style={{ color: "var(--text-primary)" }}>
            Crear cuenta
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Empieza a guardar tus equipos competitivos.
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
                autoComplete="new-password"
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
            <PasswordStrength password={password} />
          </div>

          {/* Confirm */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="confirm"
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Confirmar contraseña
            </label>
            <input
              id="confirm"
              type={showPassword ? "text" : "password"}
              className="input"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
              disabled={loading}
              style={{
                borderColor: confirm && !passwordsMatch ? "var(--danger)" : undefined,
              }}
            />
            {confirm && !passwordsMatch && (
              <span className="text-xs animate-fade-in" style={{ color: "var(--danger)" }}>
                Las contraseñas no coinciden.
              </span>
            )}
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
            disabled={!canSubmit}
            style={{ marginTop: 4 }}
          >
            <UserPlus size={16} />
            {loading ? "Creando cuenta..." : "Crear cuenta"}
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

        {/* Login link */}
        <p className="text-sm text-center" style={{ color: "var(--text-secondary)" }}>
          {"¿Ya tienes cuenta? "}
          <Link
            href="/login"
            className="font-semibold"
            style={{ color: "var(--accent)", textDecoration: "none" }}
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
