import { AppNav } from "@/components/layout/AppNav";


export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-col min-h-dvh">

      <AppNav />
      {/* pb-20 on mobile to clear the bottom nav bar */}
      <main className="relative flex-1 pb-20 md:pb-0 z-10">
        {children}
      </main>
    </div>
  );
}
