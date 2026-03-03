import { AppNav } from "@/components/layout/AppNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-dvh">
      <AppNav />
      {/* pb-20 on mobile to clear the bottom nav bar */}
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>
    </div>
  );
}
