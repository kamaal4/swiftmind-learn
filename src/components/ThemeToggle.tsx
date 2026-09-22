"use client";

import { useSyncExternalStore } from "react";

type Theme = "system" | "light" | "dark";
const order: Theme[] = ["system", "light", "dark"];

const label: Record<Theme, string> = {
  system: "Theme: follow system",
  light: "Theme: light",
  dark: "Theme: dark",
};

// A tiny external store rather than state-in-an-effect: the theme genuinely lives in
// localStorage and on <html>, not in React.
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
};

const getSnapshot = (): Theme => {
  try {
    const stored = localStorage.getItem("theme");
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
};

const apply = (theme: Theme) => {
  const root = document.documentElement;
  try {
    if (theme === "system") {
      delete root.dataset.theme;
      localStorage.removeItem("theme");
    } else {
      root.dataset.theme = theme;
      localStorage.setItem("theme", theme);
    }
  } catch {
    // Storage blocked: the theme still applies for this page view.
  }
  listeners.forEach((l) => l());
};

const icons: Record<Theme, React.ReactNode> = {
  system: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8" />
    </>
  ),
  light: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
    </>
  ),
  dark: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />,
};

export function ThemeToggle() {
  // Server and hydration both render the "system" icon, so the markup matches.
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => "system" as Theme);

  return (
    <button
      type="button"
      onClick={() => apply(order[(order.indexOf(theme) + 1) % order.length])}
      aria-label={label[theme]}
      title={label[theme]}
      className="grid size-11 place-items-center rounded-xl text-text-2 transition-colors hover:text-text"
    >
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {icons[theme]}
      </svg>
    </button>
  );
}
