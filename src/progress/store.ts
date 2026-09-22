"use client";

import { useSyncExternalStore } from "react";
import { reduce, type Action } from "./reduce.ts";
import { emptyState, type ProgressState } from "./types.ts";

// The only module in the app that talks to storage. Feature code sees useProgress() and
// dispatch(), so adding a sync backend later changes this file and nothing else.

const KEY = "swiftmind:progress";

const parse = (raw: string | null): ProgressState => {
  if (!raw) return emptyState;
  try {
    const value = JSON.parse(raw) as ProgressState;
    // The version lives inside the body so a migration keys off the field, not the key name.
    return value && value.v === 1 ? { ...emptyState, ...value } : emptyState;
  } catch {
    return emptyState;
  }
};

const read = (): ProgressState =>
  typeof window === "undefined" ? emptyState : parse(window.localStorage.getItem(KEY));

let state: ProgressState = read();
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  // Free cross-tab sync: another tab's write fires this.
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      state = parse(e.newValue);
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
};

const getSnapshot = () => state;
// Static HTML is always rendered with empty progress, so the hydration render matches;
// React swaps in the real state immediately afterwards.
const getServerSnapshot = () => emptyState;

export const dispatch = (action: Action) => {
  const next = reduce(state, action);
  if (next === state) return;
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Private mode or a full quota: the session still works, it just won't persist.
  }
  emit();
};

export const useProgress = (): ProgressState =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

/** True once the real stored state is in play, so the UI can avoid flashing empty numbers. */
export const useHydrated = (): boolean =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

export const exportProgress = () =>
  JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2);
