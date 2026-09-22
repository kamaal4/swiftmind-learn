"use client";

import Link from "next/link";
import { content } from "@/content";
import { continueLearning, recommended, reviewQueue, streak } from "@/learning/derive";
import { useHydrated, useProgress } from "@/progress/store";
import { progressFor } from "@/progress/types";
import { ProgressBar } from "./ui";

/** Continue where you left off, or — for a first-time visitor — where to start. */
export function ContinuePanel() {
  const state = useProgress();
  const hydrated = useHydrated();

  const inProgress = continueLearning(content, state);
  const concept = inProgress ?? recommended(content, state, 1)[0];
  if (!concept) return null;

  const category = content.categoryByID.get(concept.categoryID);
  const progress = progressFor(state, concept.id);

  return (
    <section
      className="card p-6"
      style={{ "--cat": `#${category?.accentHex ?? "4B3BEB"}` } as React.CSSProperties}
    >
      <p className="caption font-semibold tracking-wide text-text-2 uppercase">
        {hydrated && inProgress ? "Continue learning" : "Start here"}
      </p>
      <h2 className="title-m mt-2">{concept.title}</h2>
      <p className="mt-1 text-text-2">{concept.subtitle}</p>

      {progress.attemptCount > 0 && (
        <div className="mt-4 max-w-xs">
          <ProgressBar value={progress.mastery} label="Mastery" />
        </div>
      )}

      <Link
        href={`/learn/${concept.categoryID}/${concept.id}`}
        className="mt-5 inline-block rounded-xl bg-accent px-5 py-2.5 font-medium text-white transition-opacity hover:opacity-90"
      >
        {hydrated && inProgress ? "Resume" : "Read it"}
      </Link>
    </section>
  );
}

export function ReviewPanel() {
  const state = useProgress();
  const due = reviewQueue(content, state, new Date());
  if (due.length === 0) return null;

  return (
    <section className="card p-6">
      <p className="caption font-semibold tracking-wide text-text-2 uppercase">Ready for review</p>
      <p className="mt-2 text-text-2">
        {due.length} {due.length === 1 ? "concept has" : "concepts have"} come back around.
      </p>
      <ul className="mt-4 space-y-2">
        {due.slice(0, 4).map((concept) => (
          <li key={concept.id}>
            <Link
              href={`/learn/${concept.categoryID}/${concept.id}`}
              className="text-accent underline underline-offset-4"
            >
              {concept.title}
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/quiz/weakAreas"
        className="mt-5 inline-block rounded-xl border border-separator px-5 py-2.5 font-medium hover:border-accent"
      >
        Review with a quiz
      </Link>
    </section>
  );
}

export function StreakPanel() {
  const state = useProgress();
  const hydrated = useHydrated();
  const days = streak(state, new Date());

  return (
    <section className="card p-6">
      <p className="caption font-semibold tracking-wide text-text-2 uppercase">Streak</p>
      <p className="stat mt-2 tabular-nums">{hydrated ? days : 0}</p>
      <p className="text-text-2">{days === 1 ? "day" : "days"} in a row</p>
      <p className="caption mt-3 text-text-2">
        Answer a question or finish a concept to keep it going.
      </p>
    </section>
  );
}
