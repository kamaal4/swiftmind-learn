import assert from "node:assert/strict";
import test from "node:test";
import { content } from "./index.ts";
import { isEmpty, search } from "./search.ts";

// Ported from SwiftMindTests/SearchTests.swift — run against the real bundled content.

test("matches concept titles case-insensitively", () => {
  assert.ok(search("ARC", content).concepts.some((c) => c.id === "arc"));
  assert.ok(search("arc", content).concepts.some((c) => c.id === "arc"));
});

test("matches tags", () => {
  assert.ok(search("retain cycle", content).concepts.length > 0);
});

test("a one-character query returns nothing", () => {
  // Otherwise every keystroke of a new search dumps the whole corpus on screen.
  assert.ok(isEmpty(search("a", content)));
  assert.ok(isEmpty(search("  ", content)));
});

test("nonsense matches nothing", () => {
  assert.ok(isEmpty(search("zzzzqqqq", content)));
});

test("searches interview questions and trivia", () => {
  const results = search("unowned", content);
  assert.ok(results.interviewQuestions.length > 0 || results.trivia.length > 0);
});
