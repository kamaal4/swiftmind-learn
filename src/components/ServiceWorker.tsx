"use client";

import { useEffect } from "react";

export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    // Registering under the base path also scopes the worker to it, so a project site never
    // claims control of anything else on the same github.io domain.
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    navigator.serviceWorker.register(`${base}/sw.js`, { scope: `${base}/` }).catch(() => {
      // An unavailable service worker costs offline support, nothing else.
    });
  }, []);

  return null;
}
