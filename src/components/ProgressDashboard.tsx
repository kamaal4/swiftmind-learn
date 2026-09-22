"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { content } from "@/content";
import {
  bookmarks,
  categoryMastery,
  completedCount,
  overallMastery,
  reviewQueue,
  streak,
  weakConcepts,
} from "@/learning/derive";
import { dispatch, exportProgress, useHydrated, useProgress } from "@/progress/store";
import { emptyState, type ProgressState } from "@/progress/types";
import { EmptyState, ProgressBar, SectionHeader, Stat } from "./ui";

const ConceptList = ({ concepts, empty }: { concepts: { id: string; title: string; categoryID: string }[]; empty: string }) =>
  concepts.length === 0 ? (
    <p className="text-text-2">{empty}</p>
  ) : (
    <ul className="space-y-2">
      {concepts.map((concept) => (
        <li key={concept.id}>
          <Link
            href={`/learn/${concept.categoryID}/${concept.id}`}
            className="card block px-4 py-3 hover:border-accent"
          >
            {concept.title}
          </Link>
        </li>
      ))}
    </ul>
  );

export function ProgressDashboard() {
  const state = useProgress();
  const hydrated = useHydrated();
  const now = new Date();
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");

  const completed = content.categories.reduce(
    (n, c) => n + completedCount(content, state, c.id),
    0,
  );
  const due = reviewQueue(content, state, now);

  const download = () => {
    const url = URL.createObjectURL(new Blob([exportProgress()], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `swiftmind-progress-${now.toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Imported files are untrusted input, so the shape is checked before it replaces state.
  const importFile = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as Partial<ProgressState>;
      if (parsed?.v !== 1 || typeof parsed.concepts !== "object" || parsed.concepts === null) {
        setMessage("That file isn't a SwiftMind progress export.");
        return;
      }
      dispatch({ type: "replace", state: { ...emptyState, ...parsed } as ProgressState });
      setMessage("Progress restored.");
    } catch {
      setMessage("That file couldn't be read.");
    }
  };

  if (!hydrated) {
    return <p className="text-text-2">Reading your progress…</p>;
  }

  return (
    <>
      <div className="card grid grid-cols-2 gap-6 p-6 sm:grid-cols-4">
        <Stat value={streak(state, now)} label="day streak" />
        <Stat value={completed} label={`of ${content.concepts.length} concepts`} />
        <Stat value={`${Math.round(overallMastery(content, state) * 100)}%`} label="overall mastery" />
        <Stat value={due.length} label="due for review" />
      </div>

      <section className="mt-12">
        <SectionHeader title="Mastery by category" />
        <ul className="space-y-4">
          {content.categories.map((category) => (
            <li
              key={category.id}
              style={{ "--cat": `#${category.accentHex}` } as React.CSSProperties}
            >
              <div className="flex items-baseline justify-between gap-4">
                <Link href={`/learn/${category.id}`} className="font-medium hover:text-accent">
                  {category.name}
                </Link>
                <span className="caption text-text-2">
                  {completedCount(content, state, category.id)} of{" "}
                  {content.conceptsIn(category.id).length} read
                </span>
              </div>
              <div className="mt-2">
                <ProgressBar
                  value={categoryMastery(content, state, category.id)}
                  label={`${category.name} mastery`}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-12 grid gap-10 md:grid-cols-2">
        <section>
          <SectionHeader title="Ready for review" />
          <ConceptList
            concepts={due}
            empty="Nothing is due yet. Answer some questions and they'll show up here on schedule."
          />
        </section>

        <section>
          <SectionHeader title="Weak areas" />
          <ConceptList
            concepts={weakConcepts(content, state)}
            empty="No weak spots recorded — that's only measured once you've answered questions."
          />
        </section>
      </div>

      <section className="mt-12">
        <SectionHeader title="Bookmarks" />
        <ConceptList concepts={bookmarks(content, state)} empty="No bookmarks yet." />
      </section>

      <section className="mt-16">
        <SectionHeader title="Your data" />
        <div className="card p-6">
          <p className="text-text-2">
            Progress is stored only in this browser — there is no account and no server. Clearing
            site data erases it, so export a copy if it matters to you.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={download}
              className="rounded-xl bg-accent px-5 py-2.5 font-medium text-white transition-opacity hover:opacity-90"
            >
              Export progress
            </button>

            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="rounded-xl border border-separator px-5 py-2.5 font-medium hover:border-accent"
            >
              Import a backup
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importFile(file);
                e.target.value = "";
              }}
            />

            <button
              type="button"
              onClick={() => {
                if (confirm("Erase all progress in this browser? This cannot be undone.")) {
                  dispatch({ type: "reset" });
                  setMessage("Progress cleared.");
                }
              }}
              className="rounded-xl border border-danger/40 px-5 py-2.5 font-medium text-danger hover:border-danger"
            >
              Reset everything
            </button>
          </div>

          {message && (
            <p className="caption mt-3 text-text-2" role="status">
              {message}
            </p>
          )}
        </div>
      </section>

      {Object.keys(state.concepts).length === 0 && (
        <div className="mt-12">
          <EmptyState
            title="Nothing tracked yet"
            body="Read a concept or take the daily quiz and your progress will start building here."
          />
        </div>
      )}
    </>
  );
}
