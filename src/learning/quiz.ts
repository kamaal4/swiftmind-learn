import type { Content } from "../content/index.ts";
import { difficultyRank } from "../content/index.ts";
import type { QuizQuestion } from "../content/schema.ts";
import type { ProgressState } from "../progress/types.ts";
import { isDue } from "../progress/types.ts";
import { startOfDay } from "./date.ts";
import { mulberry32, shuffled } from "./rng.ts";

// Ported from SwiftMind/Learning/QuizEngine.swift. Every quiz is this engine with a
// different question filter — adding a mode means adding a `pool` case, nothing else.

export type QuizMode =
  | { kind: "concept"; id: string }
  | { kind: "category"; id: string }
  | { kind: "daily" }
  | { kind: "weakAreas" }
  | { kind: "random" }
  | { kind: "interview" };

export type QuizModeKind = QuizMode["kind"];

export const questionLimits: Record<QuizModeKind, number> = {
  concept: 10,
  category: 10,
  daily: 5,
  weakAreas: 8,
  random: 10,
  interview: 8,
};

export const modeCopy: Record<QuizModeKind, { title: string; subtitle: string }> = {
  concept: { title: "Concept Quiz", subtitle: "Questions from this concept" },
  category: { title: "Category Quiz", subtitle: "Everything in one category" },
  daily: { title: "Daily Quiz", subtitle: "A short set, the same for the whole day" },
  weakAreas: { title: "Weak Areas", subtitle: "Concepts you've been getting wrong" },
  random: { title: "Random Mix", subtitle: "A mix from everything you've unlocked" },
  interview: { title: "Interview Level", subtitle: "Advanced and senior-level questions only" },
};

/** Concepts at or below this mastery, with at least one attempt, count as weak. */
export const weakMasteryThreshold = 0.6;

export type QuizOutcome = {
  questionID: string;
  conceptID: string;
  categoryID: string;
  chosenOptionID: string;
  wasCorrect: boolean;
};

export const grade = (question: QuizQuestion, chosenOptionID: string): QuizOutcome => ({
  questionID: question.id,
  conceptID: question.conceptID,
  categoryID: question.categoryID,
  chosenOptionID,
  wasCorrect: chosenOptionID === question.correctOptionID,
});

/**
 * Concepts the user is measurably struggling with, weakest first. Only concepts with
 * attempts count — never having tried something isn't the same as being bad at it, and
 * mixing the two would bury the real weak spots.
 */
export const weakConceptIDs = (progress: ProgressState): string[] =>
  Object.entries(progress.concepts)
    .filter(([, p]) => p.attemptCount > 0 && p.mastery <= weakMasteryThreshold)
    .sort(([aID, a], [bID, b]) => a.mastery - b.mastery || aID.localeCompare(bID))
    .map(([id]) => id);

const pool = (
  mode: QuizMode,
  content: Content,
  progress: ProgressState,
  now: Date,
): readonly QuizQuestion[] => {
  switch (mode.kind) {
    case "concept":
      return content.quizzesFor(mode.id);
    case "category":
      return content.quizzes.filter((q) => q.categoryID === mode.id);
    case "daily":
    case "random":
      return content.quizzes;
    case "interview":
      return content.quizzes.filter((q) => difficultyRank(q.difficulty) >= difficultyRank("advanced"));
    case "weakAreas": {
      const targets = new Set(weakConceptIDs(progress));
      for (const [id, p] of Object.entries(progress.concepts)) {
        if (isDue(p, now.getTime())) targets.add(id);
      }
      const filtered = content.quizzes.filter((q) => targets.has(q.conceptID));
      // Nothing weak yet is a good problem to have — fall back to a random mix rather
      // than showing an empty screen.
      return filtered.length > 0 ? filtered : content.quizzes;
    }
  }
};

// The daily quiz must be stable for the whole day; every other mode varies per session so
// repeat attempts aren't identical.
const seedFor = (mode: QuizMode, now: Date): number =>
  mode.kind === "daily"
    ? Math.max(0, Math.floor(startOfDay(now).getTime() / 86_400_000))
    : Math.floor(Math.random() * 0xffffffff);

export type QuizSession = { mode: QuizMode; questions: QuizQuestion[] };

export const makeSession = (
  mode: QuizMode,
  content: Content,
  progress: ProgressState,
  now: Date = new Date(),
): QuizSession => {
  const available = pool(mode, content, progress, now);
  if (available.length === 0) return { mode, questions: [] };

  // A concept quiz keeps the authored order — the questions build on each other.
  const ordered =
    mode.kind === "concept" ? available.slice() : shuffled(available, mulberry32(seedFor(mode, now)));

  return { mode, questions: ordered.slice(0, questionLimits[mode.kind]) };
};
