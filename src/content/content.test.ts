import assert from "node:assert/strict";
import test from "node:test";
import { category, concept, makeConcept, question } from "./fixtures.ts";
import { content, makeContent, type ContentInput } from "./index.ts";
import { validateReferences } from "./references.ts";
import { conceptSchema, sectionSchema, unknownSectionSchema } from "./schema.ts";

// Ported from SwiftMindTests/ContentValidationTests.swift and ContentTests.swift.

const base: ContentInput = {
  categories: [category],
  concepts: [concept],
  quizzes: [question("q1", "a"), question("q2", "b")],
  trivia: [],
  interview: [],
};

const problems = (input: Partial<ContentInput>) =>
  validateReferences(makeContent({ ...base, ...input })).map((i) => i.problem);

test("the real bundled content has no reference problems", () => {
  assert.deepEqual(validateReferences(content), []);
});

test("every concept in the real content has at least one quiz", () => {
  const without = content.concepts.filter((c) => c.quizIDs.length === 0).map((c) => c.id);
  assert.deepEqual(without, []);
});

test("every category in the real content has at least one interview question", () => {
  const without = content.categories.filter((c) => content.interviewIn(c.id).length === 0);
  assert.deepEqual(without, []);
});

test("an unknown categoryID is reported", () => {
  const issues = problems({ concepts: [{ ...concept, categoryID: "nope" }] });
  assert.ok(issues.some((p) => p.includes('unknown categoryID "nope"')));
});

test("a dangling quiz reference is reported", () => {
  const issues = problems({ concepts: [{ ...concept, quizIDs: ["ghost"] }] });
  assert.ok(issues.some((p) => p.includes('quizIDs refers to unknown id "ghost"')));
});

test("a concept listing itself as a prerequisite is reported", () => {
  const issues = problems({ concepts: [{ ...concept, prerequisiteIDs: ["c1"] }] });
  assert.ok(issues.some((p) => p === "lists itself as a prerequisite"));
});

test("a correctOptionID that is not one of the options is reported", () => {
  const issues = problems({ quizzes: [question("q1", "zzz"), question("q2", "b")] });
  assert.ok(issues.some((p) => p.includes("isn't one of the options")));
});

test("a quiz whose category disagrees with its concept is reported", () => {
  const stray = { ...question("q1", "a"), categoryID: "other" };
  const issues = problems({
    categories: [category, { ...category, id: "other", order: 2 }],
    concepts: [concept, makeConcept("c2", { categoryID: "other" })],
    quizzes: [stray, question("q2", "b")],
  });
  assert.ok(issues.some((p) => p.includes("disagrees with concept's")));
});

test("a category with no concepts is reported", () => {
  const issues = problems({ categories: [category, { ...category, id: "empty", order: 9 }] });
  assert.ok(issues.some((p) => p === "has no concepts"));
});

test("a diagram edge pointing at a missing node is reported", () => {
  const withDiagram = {
    ...concept,
    sections: [
      {
        type: "diagram" as const,
        id: "d1",
        title: "T",
        altText: "A",
        nodes: [{ id: "n1", label: "N", x: 0.5, y: 0.5, style: "object" as const }],
        edges: [{ id: "e1", from: "n1", to: "ghost", style: "strong" as const }],
        steps: [{ id: "s1", caption: "c", nodeIDs: ["n1"], edgeIDs: ["nope"] }],
      },
    ],
  };
  const issues = problems({ concepts: [withDiagram] });
  assert.ok(issues.some((p) => p.includes('ends at unknown node "ghost"')));
  assert.ok(issues.some((p) => p.includes('highlights unknown edge "nope"')));
});

test("duplicate ids are reported", () => {
  const issues = problems({ concepts: [concept, { ...concept, title: "Clone" }] });
  assert.ok(issues.some((p) => p === "duplicate id"));
});

test("an unknown section type fails the schema but still parses as a skippable section", () => {
  const alien = { type: "hologram", id: "x1" };
  assert.equal(sectionSchema.safeParse(alien).success, false);
  assert.equal(unknownSectionSchema.safeParse(alien).success, true);
});

test("a concept with no sections fails the schema", () => {
  assert.equal(conceptSchema.safeParse({ ...concept, sections: [] }).success, false);
});

test("the store indexes concepts by category, sorted by difficulty then title", () => {
  const graph = makeContent({
    ...base,
    concepts: [
      makeConcept("z-easy", { difficulty: "beginner", title: "Z" }),
      makeConcept("a-hard", { difficulty: "advanced", title: "A" }),
      makeConcept("a-easy", { difficulty: "beginner", title: "A" }),
    ],
  });
  assert.deepEqual(
    graph.conceptsIn("cat").map((c) => c.id),
    ["a-easy", "z-easy", "a-hard"],
  );
});

test("neighbours walk the whole course in reading order", () => {
  const first = content.ordered[0];
  const second = content.ordered[1];
  assert.equal(content.neighbours(first.id).prev, undefined);
  assert.equal(content.neighbours(first.id).next?.id, second.id);
  assert.equal(content.neighbours(second.id).prev?.id, first.id);
});
