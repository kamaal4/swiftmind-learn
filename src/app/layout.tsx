import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { ServiceWorker } from "@/components/ServiceWorker";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SwiftMind — Understand iOS, don't just memorise it",
    template: "%s · SwiftMind",
  },
  description:
    "Learn Swift, SwiftUI, UIKit, concurrency and memory management through structured interactive concepts, quizzes, interview prep and spaced repetition.",
  applicationName: "SwiftMind",
  appleWebApp: { capable: true, title: "SwiftMind", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0e11" },
  ],
};

// Runs before first paint so an explicit light/dark choice never flashes the wrong theme.
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2"
        >
          Skip to content
        </a>
        <ServiceWorker />
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <footer className="mt-16 border-t border-separator">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-8 text-text-2">
            <p className="caption">
              SwiftMind — understand iOS, don&apos;t just memorise it. Progress is stored in this
              browser only.
            </p>
            <Link href="/progress" className="caption ml-auto underline underline-offset-4">
              Export your progress
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
