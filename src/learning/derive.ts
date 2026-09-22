import type { Content } from "../content/index.ts";
import { difficultyRank } from "../content/index.ts";
import type { Concept, QuizQuestion } from "../content/schema.ts";
import type { ProgressState } from "../progress/types.ts";
import { isDue, progressFor } from "../progress/types.ts";
import { addDays, dayKey } from "./date.ts";
import { makeSession, weakConceptIDs } from "./quiz.ts";

// The read side of SwiftMind/Learning/LearningEngine.swift, as pure functions. Nothing here
// touches React or storage, so all of it is directly testable.

/**
 * Consecutive days of activity ending today or yesterday. Yesterday still counts so the
 * streak doesn't look broken before the user has opened the site today.
 */
export const streak = (state: ProgressState, now: Date = new Date()): number => {
  const active = new Set(Object.keys(state.activity));
  if (active.size === 0) return 0;

  let cursor = active.has(dayKey(now)) ? now : addDays(now, -1);
  let count = 0;
  while (active.has(dayKey(cursor))) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
};

/** Fraction of a category's concepts marked complete, 0...1. */
export const completion = (content: Content, state: ProgressState, categoryID: string): number => {
  const concepts = content.conceptsIn(categoryID);
  if (concepts.length === 0) return 0;
  return completedCount(content, state, categoryID) / concepts.length;
};

export const completedCount = (content: Content, state: ProgressState, categoryID: string): number =>
  content.conceptsIn(categoryID).filter((c) => progressFor(state, c.id).hasCompleted).length;

/**
 * Average mastery across a category, counting untouched concepts as zero — so the number
 * answers "how much of this category do I know", not "how well did I do on the two I tried".
 */
export const categoryMastery = (content: Content, state: ProgressState, categoryID: string): number => {
  const concepts = content.conceptsIn(categoryID);
  if (concepts.length === 0) return 0;
  return concepts.reduce((sum, c) => sum + progressFor(state, c.id).mastery, 0) / concepts.length;
};

export const overallMastery = (content: Content, state: ProgressState): number => {
  if (content.concepts.length === 0) return 0;
  return (
    content.concepts.reduce((sum, c) => sum + progressFor(state, c.id).mastery, 0) /
    content.concepts.length
  );
};

/** Concepts whose review date has arrived, soonest first. */
export const reviewQueue = (content: Content, state: ProgressState, now: Date = new Date()): Concept[] =>
  Object.entries(state.concepts)
    .filter(([, p]) => isDue(p, now.getTime()))
    .sort(([, a], [, b]) => (a.nextReview ?? Infinity) - (b.nextReview ?? Infinity))
    .map(([id]) => content.conceptByID.get(id))
    .filter((c): c is Concept => c !== undefined);

export const weakConcepts = (content: Content, state: ProgressState, limit = 5): Concept[] =>
  weakConceptIDs(state)
    .slice(0, limit)
    .map((id) => content.conceptByID.get(id))
    .filter((c): c is Concept => c !== undefined);

export const bookmarks = (content: Content, state: ProgressState): Concept[] =>
  Object.entries(state.concepts)
    .filter(([, p]) => p.isBookmarked)
    .map(([id]) => id)
    .sort()
    .map((id) => content.conceptByID.get(id))
    .filter((c): c is Concept => c !== undefined);

/** What the user was last in the middle of — opened but not finished. */
export const continueLearning = (content: Content, state: ProgressState): Concept | undefined =>
  Object.entries(state.concepts)
    .filter(([, p]) => p.hasOpened && !p.hasCompleted)
    .sort(([, a], [, b]) => (b.lastReviewed ?? 0) - (a.lastReviewed ?? 0))
    .map(([id]) => content.conceptByID.get(id))
    .find((c): c is Concept => c !== undefined);

const byDifficultyThenTitle = (a: Concept, b: Concept) =>
  difficultyRank(a.difficulty) - difficultyRank(b.difficulty) || a.title.localeCompare(b.title);

/**
 * The next thing worth starting: unfinished, prerequisites met, easiest first. Falls back to
 * ignoring prerequisites so this never comes back empty while unfinished concepts remain —
 * an empty "up next" is worse than an imperfect one.
 */
export const recommended = (content: Content, state: ProgressState, limit = 3): Concept[] => {
  const unfinished = content.concepts.filter((c) => !progressFor(state, c.id).hasCompleted);
  const ready = unfinished.filter((c) =>
    c.prerequisiteIDs.every((id) => progressFor(state, id).hasCompleted),
  );
  const pool = ready.length > 0 ? ready : unfinished;
  return pool.slice().sort(byDifficultyThenTitle).slice(0, limit);
};

/** A single question for the home screen's daily challenge. */
export const dailyChallenge = (
  content: Content,
  state: ProgressState,
  now: Date = new Date(),
): QuizQuestion | undefined => makeSession({ kind: "daily" }, content, state, now).questions[0];
