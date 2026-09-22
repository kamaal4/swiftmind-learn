import assert from "node:assert/strict";
import test from "node:test";
import { emptyConcept, type ConceptProgress } from "../progress/types.ts";
import { addDays } from "./date.ts";
import { advance, nextInterval, nextMastery, stateFor } from "./scheduler.ts";

// Ported from SwiftMindTests/ReviewSchedulerTests.swift.

const now = new Date(1_800_000_000 * 1000);
const snapshot = (mastery = 0, intervalDays = 0, attemptCount = 0): ConceptProgress => ({
  ...emptyConcept,
  mastery,
  intervalDays,
  attemptCount,
  hasOpened: true,
});

test("a correct answer promotes to the next interval", () => {
  assert.equal(nextInterval(0, true), 1);
  assert.equal(nextInterval(1, true), 3);
  assert.equal(nextInterval(3, true), 7);
  assert.equal(nextInterval(16, true), 35);
});

test("the longest interval does not overflow past the end", () => {
  assert.equal(nextInterval(35, true), 35);
});

test("a wrong answer sends the concept back to the start, not one box back", () => {
  assert.equal(nextInterval(35, false), 1);
  assert.equal(nextInterval(0, false), 1);
});

test("an unrecognised interval restarts rather than crashing", () => {
  assert.equal(nextInterval(999, true), 1);
});

test("mastery moves toward one on correct and zero on wrong", () => {
  assert.ok(Math.abs(nextMastery(0, true) - 0.3) < 0.0001);
  assert.ok(Math.abs(nextMastery(1, false) - 0.7) < 0.0001);
});

test("mastery stays within zero to one", () => {
  let mastery = 0;
  for (let i = 0; i < 200; i++) mastery = nextMastery(mastery, true);
  assert.ok(mastery <= 1);
  for (let i = 0; i < 200; i++) mastery = nextMastery(mastery, false);
  assert.ok(mastery >= 0);
});

test("one wrong answer dents mastery without erasing it", () => {
  const after = nextMastery(0.9, false);
  assert.ok(after > 0.5 && after < 0.9);
});

test("state is new until something has been attempted", () => {
  assert.equal(stateFor(0.9, 35, 0), "new");
});

test("state progresses with mastery and interval", () => {
  assert.equal(stateFor(0.2, 1, 1), "learning");
  assert.equal(stateFor(0.6, 3, 3), "review");
  assert.equal(stateFor(0.9, 35, 9), "mastered");
});

test("high mastery at a short interval is not yet mastered", () => {
  assert.equal(stateFor(0.95, 1, 1), "review");
});

test("advance schedules the next review that many days out", () => {
  const outcome = advance(snapshot(0, 3, 2), true, now);
  assert.equal(outcome.intervalDays, 7);
  assert.equal(outcome.nextReview, addDays(now, 7).getTime());
});

test("advance from an untouched concept works", () => {
  const outcome = advance(snapshot(), false, now);
  assert.equal(outcome.intervalDays, 1);
  assert.equal(outcome.state, "learning");
  assert.equal(outcome.mastery, 0);
});

test("a run of correct answers reaches mastered", () => {
  let current = snapshot();
  for (let i = 0; i < 12; i++) {
    const outcome = advance(current, true, now);
    current = {
      ...current,
      state: outcome.state,
      mastery: outcome.mastery,
      intervalDays: outcome.intervalDays,
      nextReview: outcome.nextReview,
      lastReviewed: now.getTime(),
      attemptCount: current.attemptCount + 1,
      correctCount: current.correctCount + 1,
    };
  }
  assert.equal(current.state, "mastered");
});
