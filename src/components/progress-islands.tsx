"use client";

import Link from "next/link";
import { useEffect } from "react";
import { content } from "@/content";
import { categoryMastery, completedCount } from "@/learning/derive";
import { dispatch, useProgress } from "@/progress/store";
import { progressFor } from "@/progress/types";
import { MasteryBadge, ProgressBar } from "./ui";

// The small client islands that read local progress. Everything else on these pages stays a
// server component, so only these re-render after hydration.

export function CategoryProgress({ categoryID }: { categoryID: string }) {
  const state = useProgress();
  const done = completedCount(content, state, categoryID);
  const total = content.conceptsIn(categoryID).length;

  return (
    <div>
      <ProgressBar
        value={categoryMastery(content, state, categoryID)}
        label={`Mastery of this category`}
      />
      <p className="caption mt-1 text-text-2">
        {done} of {total} complete
      </p>
    </div>
  );
}

export function ConceptMastery({ conceptID }: { conceptID: string }) {
  const state = useProgress();
  return <MasteryBadge state={progressFor(state, conceptID).state} />;
}

export function ConceptActions({ conceptID }: { conceptID: string }) {
  const state = useProgress();
  const progress = progressFor(state, conceptID);

  return (
    <div className="space-y-2">
      <ProgressBar value={progress.mastery} label="Your mastery of this concept" />

      <button
        type="button"
        onClick={() => dispatch({ type: "complete", conceptID, now: new Date() })}
        disabled={progress.hasCompleted}
        className="w-full rounded-xl bg-accent px-4 py-2.5 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {progress.hasCompleted ? "✓ Marked as read" : "Mark as read"}
      </button>

      <button
        type="button"
        onClick={() => dispatch({ type: "toggleBookmark", conceptID })}
        className="w-full rounded-xl border border-separator px-4 py-2.5 font-medium transition-colors hover:border-accent"
      >
        {progress.isBookmarked ? "★ Bookmarked" : "☆ Bookmark"}
      </button>

      <Link
        href={`/quiz/concept?id=${conceptID}`}
        className="block w-full rounded-xl border border-separator px-4 py-2.5 text-center font-medium transition-colors hover:border-accent"
      >
        Quiz this concept
      </Link>
    </div>
  );
}

/** Records that the concept was opened. Renders nothing. */
export function MarkOpened({ conceptID }: { conceptID: string }) {
  useEffect(() => {
    dispatch({ type: "open", conceptID });
  }, [conceptID]);
  return null;
}
