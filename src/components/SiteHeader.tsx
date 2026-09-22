import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { SearchButton } from "./CommandPalette";

const nav = [
  { href: "/learn", label: "Learn" },
  { href: "/quiz", label: "Quiz" },
  { href: "/interview", label: "Interview" },
  { href: "/whats-new", label: "What's New" },
  { href: "/progress", label: "Progress" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-separator bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4">
        <Link href="/" className="title-s mr-2 shrink-0 tracking-tight">
          SwiftMind
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded-lg px-3 py-2 text-[0.9375rem] text-text-2 transition-colors hover:bg-surface hover:text-text"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <SearchButton />
          <ThemeToggle />
        </div>
      </div>

      <nav aria-label="Main" className="md:hidden">
        <ul className="flex gap-1 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
          {nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded-lg px-3 py-1.5 text-[0.9375rem] whitespace-nowrap text-text-2"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
