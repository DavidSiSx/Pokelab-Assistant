import { PokeballPattern } from "@/components/ui/PokeballBg";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh" style={{ background: "var(--bg-base)" }}>
      <PokeballPattern />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
