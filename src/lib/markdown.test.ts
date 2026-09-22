import assert from "node:assert/strict";
import test from "node:test";
import { content } from "../content/index.ts";
import { parseBlocks, parseInline } from "./markdown.ts";

test("plain text is one paragraph", () => {
  const blocks = parseBlocks("Just a sentence.");
  assert.equal(blocks.length, 1);
  assert.deepEqual(blocks[0], {
    kind: "paragraph",
    children: [{ kind: "text", text: "Just a sentence." }],
  });
});

test("blank lines separate paragraphs", () => {
  assert.equal(parseBlocks("One.\n\nTwo.\n\nThree.").length, 3);
});

test("inline code becomes a code token", () => {
  assert.deepEqual(parseInline("use `weak` here"), [
    { kind: "text", text: "use " },
    { kind: "code", text: "weak" },
    { kind: "text", text: " here" },
  ]);
});

test("code spans inside bold are parsed, not left as literal backticks", () => {
  // The bug this guards: bold matched first swallowed the backticks whole.
  const tokens = parseInline("**A closure capturing `self`**");
  assert.equal(tokens.length, 1);
  assert.equal(tokens[0].kind, "bold");
  assert.deepEqual(tokens[0].kind === "bold" ? tokens[0].children : [], [
    { kind: "text", text: "A closure capturing " },
    { kind: "code", text: "self" },
  ]);
});

test("a numbered list on consecutive lines becomes an ordered list", () => {
  const blocks = parseBlocks("Shapes:\n\n1. First one\n2. Second one\n3. Third one");
  assert.equal(blocks.length, 2);
  const list = blocks[1];
  assert.equal(list.kind, "list");
  if (list.kind !== "list") return;
  assert.equal(list.ordered, true);
  assert.equal(list.items.length, 3);
  assert.deepEqual(list.items[0], [{ kind: "text", text: "First one" }]);
});

test("a dashed list becomes an unordered list", () => {
  const blocks = parseBlocks("- alpha\n- beta");
  assert.equal(blocks[0].kind, "list");
  assert.equal(blocks[0].kind === "list" ? blocks[0].ordered : true, false);
});

test("a single line starting with a number is not a list", () => {
  // "1998. A good year." is prose, not a one-item list.
  assert.equal(parseBlocks("1998. A good year.")[0].kind, "paragraph");
});

test("a paragraph where only some lines look like items stays a paragraph", () => {
  assert.equal(parseBlocks("Intro line\n2. not really a list").length, 1);
  assert.equal(parseBlocks("Intro line\n2. not really a list")[0].kind, "paragraph");
});

test("every authored body parses without throwing and keeps its text", () => {
  const flatten = (tokens: ReturnType<typeof parseInline>): string =>
    tokens
      .map((t) => (t.kind === "bold" ? flatten(t.children) : t.text))
      .join("");

  for (const concept of content.concepts) {
    for (const section of concept.sections) {
      if (!("body" in section)) continue;
      const rendered = parseBlocks(section.body)
        .map((b) => (b.kind === "paragraph" ? flatten(b.children) : b.items.map(flatten).join(" ")))
        .join(" ");
      // Markers are consumed, but the words must survive.
      const words = section.body.replace(/[`*\-\d.]/g, " ").split(/\s+/).filter(Boolean);
      const longest = words.sort((a, b) => b.length - a.length)[0];
      if (longest) assert.ok(rendered.includes(longest), `${concept.id}/${section.id} lost text`);
    }
  }
});
