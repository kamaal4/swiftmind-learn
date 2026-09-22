import assert from "node:assert/strict";
import test from "node:test";
import {
  category,
  concept,
  emptyContent,
  progressWith,
  question,
  testContent,
} from "../content/fixtures.ts";
import { makeContent } from "../content/index.ts";
import { emptyState } from "../progress/types.ts";
import { grade, makeSession, questionLimits, weakConceptIDs } from "./quiz.ts";

// Ported from SwiftMindTests/QuizEngineTests.swift.

const now = new Date(1_800_000_000 * 1000);
const ids = (questions: { id: string }[]) => questions.map((q) => q.id);

const manyQuestions = (n: number) =>
  makeContent({
    categories: [category],
    concepts: [concept],
    quizzes: Array.from({ length: n }, (_, i) => question(`q${i + 1}`, "a")),
    trivia: [],
    interview: [],
  });

test("grading compares against the correct option", () => {
  const q = question("q1", "b");
  assert.equal(grade(q, "b").wasCorrect, true);
  assert.equal(grade(q, "a").wasCorrect, false);
});

test("grading carries the concept and category through", () => {
  const outcome = grade(question("q1", "a"), "a");
  assert.equal(outcome.questionID, "q1");
  assert.equal(outcome.conceptID, "c1");
  assert.equal(outcome.categoryID, "cat");
});

test("an all-wrong session grades every answer false", () => {
  const session = makeSession({ kind: "random" }, testContent(), emptyState, now);
  const outcomes = session.questions.map((q) => grade(q, "definitely-not-an-option"));
  assert.ok(outcomes.length > 0);
  assert.ok(outcomes.every((o) => !o.wasCorrect));
});

test("empty content produces an empty session rather than crashing", () => {
  const session = makeSession({ kind: "random" }, emptyContent, emptyState, now);
  assert.equal(session.questions.length, 0);
});

test("concept mode keeps the authored order", () => {
  const session = makeSession({ kind: "concept", id: "c1" }, testContent(), emptyState, now);
  assert.deepEqual(ids(session.questions), ["q1", "q2"]);
});

test("category mode only returns that category", () => {
  const session = makeSession({ kind: "category", id: "other" }, testContent(), emptyState, now);
  assert.ok(session.questions.length > 0);
  assert.ok(session.questions.every((q) => q.categoryID === "other"));
});

test("interview mode only returns advanced or harder", () => {
  const session = makeSession({ kind: "interview" }, testContent(), emptyState, now);
  assert.ok(session.questions.length > 0);
  assert.ok(session.questions.every((q) => q.difficulty === "advanced" || q.difficulty === "senior"));
});

test("sessions respect the mode question limit", () => {
  const session = makeSession({ kind: "daily" }, manyQuestions(30), emptyState, now);
  assert.equal(session.questions.length, questionLimits.daily);
});

test("the daily quiz is the same set all day", () => {
  const content = testContent();
  const evening = new Date(now.getTime() + 8 * 3600 * 1000);
  const a = makeSession({ kind: "daily" }, content, emptyState, now);
  const b = makeSession({ kind: "daily" }, content, emptyState, evening);
  assert.deepEqual(ids(a.questions), ids(b.questions));
});

test("the daily quiz changes the next day", () => {
  const content = manyQuestions(30);
  const tomorrow = new Date(now.getTime() + 86_400 * 1000);
  const today = makeSession({ kind: "daily" }, content, emptyState, now);
  const next = makeSession({ kind: "daily" }, content, emptyState, tomorrow);
  assert.notDeepEqual(ids(today.questions), ids(next.questions));
});

test("weak areas selects low-mastery concepts with attempts", () => {
  const progress = progressWith({
    c1: { mastery: 0.2, attemptCount: 4 },
    c2: { mastery: 0.95, attemptCount: 4 },
  });
  assert.deepEqual(weakConceptIDs(progress), ["c1"]);
});

test("a concept never attempted is not weak", () => {
  const progress = progressWith({ c1: { mastery: 0, attemptCount: 0 } });
  assert.deepEqual(weakConceptIDs(progress), []);
});

test("weak concepts come back weakest first", () => {
  const progress = progressWith({
    a: { mastery: 0.5, attemptCount: 2 },
    b: { mastery: 0.1, attemptCount: 2 },
    c: { mastery: 0.3, attemptCount: 2 },
  });
  assert.deepEqual(weakConceptIDs(progress), ["b", "c", "a"]);
});

test("weak areas mode falls back to a mix when nothing is weak yet", () => {
  // An empty screen would be a worse answer than a random set.
  const session = makeSession({ kind: "weakAreas" }, testContent(), emptyState, now);
  assert.ok(session.questions.length > 0);
});

test("weak areas includes concepts that are due for review", () => {
  const progress = progressWith({
    c1: { mastery: 0.99, attemptCount: 5, intervalDays: 3, nextReview: now.getTime() - 60_000 },
  });
  const session = makeSession({ kind: "weakAreas" }, testContent(), progress, now);
  assert.ok(session.questions.length > 0);
  assert.ok(session.questions.every((q) => q.conceptID === "c1"));
});
