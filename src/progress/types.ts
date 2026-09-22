// Ported from SwiftMind/Learning/ProgressModels.swift. The iOS app's QuizAttempt log is
// deliberately dropped — nothing reads individual attempts, only the counts kept here.

export type MasteryState = "new" | "learning" | "review" | "mastered";

export type ConceptProgress = {
  state: MasteryState;
  /** 0...1, an exponential moving average of recent answer correctness. */
  mastery: number;
  /** Current spacing interval in days; grows on correct answers. */
  intervalDays: number;
  attemptCount: number;
  correctCount: number;
  hasOpened: boolean;
  hasCompleted: boolean;
  isBookmarked: boolean;
  /** Epoch milliseconds. */
  lastReviewed?: number;
  nextReview?: number;
};

export type DayActivity = { concepts: number; questions: number };

export type ProgressState = {
  v: 1;
  concepts: Record<string, ConceptProgress>;
  /** Keyed by local "YYYY-MM-DD". */
  activity: Record<string, DayActivity>;
  seenReleases: string[];
};

export const emptyConcept: ConceptProgress = Object.freeze({
  state: "new",
  mastery: 0,
  intervalDays: 0,
  attemptCount: 0,
  correctCount: 0,
  hasOpened: false,
  hasCompleted: false,
  isBookmarked: false,
});

export const emptyState: ProgressState = Object.freeze({
  v: 1,
  concepts: {},
  activity: {},
  seenReleases: [],
});

export const progressFor = (state: ProgressState, conceptID: string): ConceptProgress =>
  state.concepts[conceptID] ?? emptyConcept;

export const accuracy = (p: ConceptProgress): number | undefined =>
  p.attemptCount === 0 ? undefined : p.correctCount / p.attemptCount;

export const isDue = (p: ConceptProgress, now: number): boolean =>
  p.nextReview !== undefined && p.nextReview <= now;
