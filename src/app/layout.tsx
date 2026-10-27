import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Suspense } from "react";
import Link from "next/link";
import { UserNav } from "@/components/UserNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "SOC Daily: one blue-team challenge a day",
  description:
    "A daily security analyst challenge. Read the logs, triage the alert, make the call. New scenario every day.",
};

export const viewport: Viewport = {
  themeColor: "#0a0d12",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="border-b border-line/80 bg-bg/80 backdrop-blur sticky top-0 z-10">
          <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
            <Link href="/" className="group flex items-center gap-2 font-mono text-sm tracking-tight">
              <span className="inline-block h-2 w-2 rounded-full bg-signal shadow-[0_0_10px_var(--signal)]" />
              <span className="font-semibold text-text">SOC</span>
              <span className="text-signal">_DAILY</span>
              <span className="cursor-blink text-signal">▌</span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link href="/" className="rounded-md px-2.5 py-1.5 text-muted hover:bg-panel-2 hover:text-text">
                Today
              </Link>
              <Link href="/about" className="rounded-md px-2.5 py-1.5 text-muted hover:bg-panel-2 hover:text-text">
                About
              </Link>
              <Suspense fallback={<span className="w-16" />}>
                <UserNav />
              </Suspense>
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-10">{children}</main>

        <footer className="border-t border-line/80">
          <div className="mx-auto flex max-w-3xl flex-col gap-1 px-4 py-6 text-xs text-faint sm:flex-row sm:justify-between">
            <span>All logs, emails, and IPs are synthetic and for training only.</span>
            <span>
              Mapped to{" "}
              <a href="https://attack.mitre.org/" className="underline decoration-line-strong underline-offset-2 hover:text-muted">
                MITRE ATT&amp;CK®
              </a>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
