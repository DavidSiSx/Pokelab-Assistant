import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AuthProvider } from "@/providers/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pokelab Assistant — Competitive Team Builder",
  description:
    "Build, analyze and optimize your competitive Pokemon teams with AI-powered suggestions. Import from Showdown, get full movesets, EV spreads and team synergy analysis.",
  keywords: ["Pokemon", "competitive", "team builder", "Showdown", "AI", "Cobblemon"],
  openGraph: {
    title: "Pokelab Assistant",
    description: "AI-powered competitive Pokemon team builder",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#e53e3e",
  width: "device-width",
  initialScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" data-theme="pokeball" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
