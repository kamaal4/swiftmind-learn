// The authored bodies use only inline backticks, **bold**, blank-line paragraphs and the
// occasional numbered list, so a Markdown dependency would be ~40 KB to render four
// constructs. Parsing lives here, apart from the JSX, so it is directly testable.

export type Inline =
  | { kind: "text"; text: string }
  | { kind: "code"; text: string }
  | { kind: "bold"; children: Inline[] };

export type Block =
  | { kind: "paragraph"; children: Inline[] }
  | { kind: "list"; ordered: boolean; items: Inline[][] };

const parseCode = (text: string): Inline[] =>
  text
    .split(/(`[^`]+`)/g)
    .filter((part) => part !== "")
    .map((part) =>
      part.length > 1 && part.startsWith("`") && part.endsWith("`")
        ? { kind: "code" as const, text: part.slice(1, -1) }
        : { kind: "text" as const, text: part },
    );

/** Bold is matched first, then code spans inside it — authored text nests them. */
export const parseInline = (text: string): Inline[] =>
  text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter((part) => part !== "")
    .flatMap((part) =>
      part.length > 3 && part.startsWith("**") && part.endsWith("**")
        ? [{ kind: "bold" as const, children: parseCode(part.slice(2, -2)) }]
        : parseCode(part),
    );

const LIST_ITEM = /^\s*(?:(\d+)\.|[-*])\s+(.*)$/;

export const parseBlocks = (body: string): Block[] =>
  body.split(/\n{2,}/).map((block) => {
    const lines = block.split("\n").filter((line) => line.trim() !== "");
    const matches = lines.length >= 2 ? lines.map((line) => line.match(LIST_ITEM)) : [];

    if (matches.length >= 2 && matches.every((match) => match !== null)) {
      return {
        kind: "list",
        ordered: matches[0]![1] !== undefined,
        items: matches.map((match) => parseInline(match![2])),
      };
    }
    return { kind: "paragraph", children: parseInline(block) };
  });
