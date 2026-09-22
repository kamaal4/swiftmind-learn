import assert from "node:assert/strict";
import test from "node:test";
import { category, makeConcept, question, testContent } from "../content/fixtures.ts";
import { makeContent } from "../content/index.ts";
import { reduce } from "../progress/reduce.ts";
import { accuracy, emptyState, progressFor, type ProgressState } from "../progress/types.ts";
import { addDays, dayKey } from "./date.ts";
import {
  bookmarks,
  categoryMastery,
  completedCount,
  completion,
  continueLearning,
  recommended,
  reviewQueue,
  streak,
} from "./derive.ts";
import { grade } from "./quiz.ts";

// Ported from SwiftMindTests/LearningEngineTests.swift, retargeted at the reducer and the
// pure derivations that replaced the SwiftData-backed engine.

const now = new Date(1_800_000_000 * 1000);
const content = testContent();
const ids = (concepts: { id: string }[]) => concepts.map((c) => c.id);

const activityOn = (offsets: number[]): ProgressState => ({
  ...emptyState,
  activity: Object.fromEntries(
    offsets.map((o) => [dayKey(addDays(now, -o)), { concepts: 1, questions: 0 }]),
  ),
});

test("an untouched concept reports empty progress", () => {
  const p = progressFor(emptyState, "c1");
  assert.equal(p.state, "new");
  assert.equal(p.mastery, 0);
  assert.equal(p.hasOpened, false);
  assert.equal(accuracy(p), undefined);
});

test("marking complete schedules a first review", () => {
  const state = reduce(emptyState, { type: "complete", conceptID: "c1", now });
  const p = progressFor(state, "c1");
  assert.equal(p.hasCompleted, true);
  assert.equal(p.hasOpened, true);
  assert.notEqual(p.nextReview, undefined);
  assert.equal(p.state, "learning");
});

test("recording an answer updates mastery and accuracy", () => {
  const q = question("q1", "a");
  let state = reduce(emptyState, { type: "answer", outcome: grade(q, "a"), now });
  state = reduce(state, { type: "answer", outcome: grade(q, "b"), now });

  const p = progressFor(state, "c1");
  assert.equal(p.attemptCount, 2);
  assert.equal(p.correctCount, 1);
  assert.equal(accuracy(p), 0.5);
  assert.ok(p.mastery > 0);
});

test("bookmarks toggle both ways", () => {
  let state = reduce(emptyState, { type: "toggleBookmark", conceptID: "c1" });
  assert.deepEqual(ids(bookmarks(content, state)), ["c1"]);

  state = reduce(state, { type: "toggleBookmark", conceptID: "c1" });
  assert.deepEqual(bookmarks(content, state), []);
});

test("completion counts only finished concepts", () => {
  assert.equal(completion(content, emptyState, "cat"), 0);
  const state = reduce(emptyState, { type: "complete", conceptID: "c1", now });
  assert.equal(completion(content, state, "cat"), 1);
});

test("an empty category reports zero rather than dividing by zero", () => {
  assert.equal(completion(content, emptyState, "no-such-category"), 0);
  assert.equal(categoryMastery(content, emptyState, "no-such-category"), 0);
  assert.equal(completedCount(content, emptyState, "no-such-category"), 0);
});

test("category mastery counts untouched concepts as zero", () => {
  const state = reduce(emptyState, { type: "answer", outcome: grade(question("q1", "a"), "a"), now });
  assert.ok(categoryMastery(content, state, "cat") > 0);
  assert.equal(categoryMastery(content, state, "other"), 0);
});

test("the review queue only contains concepts that are actually due", () => {
  const state = reduce(emptyState, { type: "complete", conceptID: "c1", now });
  assert.deepEqual(reviewQueue(content, state, now), []);
  // The first review is a day out.
  assert.deepEqual(ids(reviewQueue(content, state, addDays(now, 2))), ["c1"]);
});

test("recommendations prefer concepts whose prerequisites are done", () => {
  const graph = makeContent({
    categories: [category],
    concepts: [makeConcept("basics"), makeConcept("advanced", { prerequisiteIDs: ["basics"] })],
    quizzes: [],
    trivia: [],
    interview: [],
  });

  assert.deepEqual(ids(recommended(graph, emptyState, 5)), ["basics"]);

  const state = reduce(emptyState, { type: "complete", conceptID: "basics", now });
  assert.deepEqual(ids(recommended(graph, state, 5)), ["advanced"]);
});

test("recommendations fall back rather than returning nothing", () => {
  // Every remaining concept is blocked, but "nothing to do" would be a worse answer.
  const graph = makeContent({
    categories: [category],
    concepts: [makeConcept("blocked", { prerequisiteIDs: ["never-done"] }), makeConcept("never-done")],
    quizzes: [],
    trivia: [],
    interview: [],
  });
  const state = reduce(emptyState, { type: "complete", conceptID: "never-done", now });
  assert.ok(recommended(graph, state, 5).length > 0);
});

test("continue learning picks the most recent unfinished concept", () => {
  let state = reduce(emptyState, { type: "open", conceptID: "c1" });
  assert.equal(continueLearning(content, state)?.id, "c1");

  state = reduce(state, { type: "complete", conceptID: "c1", now });
  assert.equal(continueLearning(content, state), undefined);
});

test("consecutive days count", () => {
  assert.equal(streak(activityOn([0, 1, 2, 3]), now), 4);
});

test("a gap breaks the streak", () => {
  assert.equal(streak(activityOn([0, 1, 3, 4]), now), 2);
});

test("yesterday still counts before today's first session", () => {
  // Otherwise the streak would look broken every morning until the user opens the site.
  assert.equal(streak(activityOn([1, 2]), now), 2);
});

test("a stale streak is zero", () => {
  assert.equal(streak(activityOn([7]), now), 0);
});

test("no activity is zero", () => {
  assert.equal(streak(emptyState, now), 0);
});

test("answering a question starts a streak", () => {
  const state = reduce(emptyState, { type: "answer", outcome: grade(question("q1", "a"), "a"), now });
  assert.equal(streak(state, now), 1);
});

test("resetting clears progress but not content", () => {
  let state = reduce(emptyState, { type: "complete", conceptID: "c1", now });
  state = reduce(state, { type: "toggleBookmark", conceptID: "c1" });
  state = reduce(state, { type: "reset" });

  assert.equal(progressFor(state, "c1").state, "new");
  assert.deepEqual(bookmarks(content, state), []);
  assert.equal(streak(state, now), 0);
  assert.equal(content.concepts.length, 2);
});

test("marking the same concept complete twice does not double-count activity", () => {
  let state = reduce(emptyState, { type: "complete", conceptID: "c1", now });
  state = reduce(state, { type: "complete", conceptID: "c1", now });
  assert.equal(state.activity[dayKey(now)].concepts, 1);
});
