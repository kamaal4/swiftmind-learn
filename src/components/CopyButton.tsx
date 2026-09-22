"use client";

import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard permission denied — the code is selectable, so this is not fatal.
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="caption rounded-lg bg-white/12 px-2.5 py-1.5 text-white transition-colors hover:bg-white/20"
      aria-label={copied ? "Copied" : "Copy code"}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
