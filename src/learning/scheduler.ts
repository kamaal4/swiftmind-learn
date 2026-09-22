import type { ConceptProgress, MasteryState } from "../progress/types.ts";
import { addDays } from "./date.ts";

// Ported verbatim from SwiftMind/Learning/ReviewScheduler.swift. Leitner boxes, not SM-2.

export const intervals = [1, 3, 7, 16, 35] as const;
export const learningRate = 0.3;
export const masteredThreshold = 0.85;
export const reviewThreshold = 0.5;

export type Outcome = {
  state: MasteryState;
  mastery: number;
  intervalDays: number;
  /** Epoch milliseconds. */
  nextReview: number;
};

export const nextMastery = (current: number, correct: boolean): number => {
  const target = correct ? 1 : 0;
  return Math.min(1, Math.max(0, current + (target - current) * learningRate));
};

export const nextInterval = (current: number, correct: boolean): number => {
  // Any wrong answer drops all the way back to the first box, not one box back.
  if (!correct) return intervals[0];
  const index = intervals.indexOf(current as (typeof intervals)[number]);
  // An unrecognised interval (including the 0 of a concept never quizzed) starts over at 1.
  if (index < 0) return intervals[0];
  return intervals[Math.min(index + 1, intervals.length - 1)];
};

export const stateFor = (mastery: number, intervalDays: number, attempts: number): MasteryState => {
  if (attempts <= 0) return "new";
  if (mastery >= masteredThreshold && intervalDays >= intervals[intervals.length - 2]) {
    return "mastered";
  }
  return mastery >= reviewThreshold ? "review" : "learning";
};

export const advance = (progress: ConceptProgress, correct: boolean, now: Date): Outcome => {
  const mastery = nextMastery(progress.mastery, correct);
  const intervalDays = nextInterval(progress.intervalDays, correct);
  return {
    mastery,
    intervalDays,
    state: stateFor(mastery, intervalDays, progress.attemptCount + 1),
    nextReview: addDays(now, intervalDays).getTime(),
  };
};

export const firstReview = (now: Date): number => addDays(now, intervals[0]).getTime();
