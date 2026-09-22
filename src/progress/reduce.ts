import { dayKey } from "../learning/date.ts";
import type { QuizOutcome } from "../learning/quiz.ts";
import { advance, firstReview, intervals } from "../learning/scheduler.ts";
import type { ConceptProgress, ProgressState } from "./types.ts";
import { emptyConcept, emptyState } from "./types.ts";

// The write side of SwiftMind/Learning/LearningEngine.swift: a pure reducer, so every
// transition is testable without a store, a clock, or a browser.

export type Action =
  | { type: "open"; conceptID: string }
  | { type: "complete"; conceptID: string; now: Date }
  | { type: "toggleBookmark"; conceptID: string }
  | { type: "answer"; outcome: QuizOutcome; now: Date }
  | { type: "seeRelease"; releaseID: string }
  | { type: "replace"; state: ProgressState }
  | { type: "reset" };

const withConcept = (
  state: ProgressState,
  conceptID: string,
  change: (p: ConceptProgress) => ConceptProgress,
): ProgressState => ({
  ...state,
  concepts: { ...state.concepts, [conceptID]: change(state.concepts[conceptID] ?? emptyConcept) },
});

const bumpActivity = (
  state: ProgressState,
  now: Date,
  field: "concepts" | "questions",
): ProgressState => {
  const key = dayKey(now);
  const day = state.activity[key] ?? { concepts: 0, questions: 0 };
  return {
    ...state,
    activity: { ...state.activity, [key]: { ...day, [field]: day[field] + 1 } },
  };
};

export const reduce = (state: ProgressState, action: Action): ProgressState => {
  switch (action.type) {
    case "open": {
      if (state.concepts[action.conceptID]?.hasOpened) return state;
      return withConcept(state, action.conceptID, (p) => ({ ...p, hasOpened: true }));
    }

    case "complete": {
      if (state.concepts[action.conceptID]?.hasCompleted) return state;
      const completed = withConcept(state, action.conceptID, (p) => ({
        ...p,
        hasCompleted: true,
        hasOpened: true,
        lastReviewed: action.now.getTime(),
        // A concept that's been read but never quizzed still deserves to come back.
        ...(p.nextReview === undefined
          ? { nextReview: firstReview(action.now), intervalDays: intervals[0] }
          : {}),
        state: p.state === "new" ? "learning" : p.state,
      }));
      return bumpActivity(completed, action.now, "concepts");
    }

    case "toggleBookmark":
      return withConcept(state, action.conceptID, (p) => ({ ...p, isBookmarked: !p.isBookmarked }));

    case "answer": {
      const { outcome, now } = action;
      const answered = withConcept(state, outcome.conceptID, (p) => {
        const next = advance(p, outcome.wasCorrect, now);
        return {
          ...p,
          state: next.state,
          mastery: next.mastery,
          intervalDays: next.intervalDays,
          nextReview: next.nextReview,
          lastReviewed: now.getTime(),
          attemptCount: p.attemptCount + 1,
          correctCount: p.correctCount + (outcome.wasCorrect ? 1 : 0),
        };
      });
      return bumpActivity(answered, now, "questions");
    }

    case "seeRelease":
      return state.seenReleases.includes(action.releaseID)
        ? state
        : { ...state, seenReleases: [...state.seenReleases, action.releaseID] };

    case "replace":
      return action.state;

    // Content is untouched — it lives in the bundle, not in user state.
    case "reset":
      return emptyState;
  }
};
