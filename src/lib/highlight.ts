// Ported from SwiftHighlighter in SwiftMind/DesignSystem/DSCodeBlock.swift. A small
// hand-written scanner rather than a dependency — it only has to be right about comments,
// strings, keywords, types, numbers and attributes, which is all a teaching snippet holds.
// Runs at build time inside a server component, so no tokeniser ships to the browser.

const keywords = new Set([
  "actor", "any", "as", "associatedtype", "async", "await", "break", "case", "catch",
  "class", "continue", "default", "defer", "deinit", "do", "else", "enum", "extension",
  "fallthrough", "false", "final", "for", "func", "guard", "if", "import", "in", "init",
  "inout", "internal", "is", "let", "mutating", "nil", "nonisolated", "open", "operator",
  "private", "protocol", "public", "repeat", "return", "self", "Self", "some", "static",
  "struct", "subscript", "super", "switch", "throw", "throws", "true", "try", "typealias",
  "unowned", "var", "weak", "where", "while", "lazy", "override", "required", "convenience",
]);

export type TokenKind = "comment" | "keyword" | "type" | "string" | "number" | "plain" | "attribute";
export type Token = { text: string; kind: TokenKind };

const isLetter = (c: string) => /\p{L}/u.test(c);
const isDigit = (c: string) => /\p{Nd}/u.test(c);

const kindFor = (token: string): TokenKind => {
  if (token.startsWith("@")) return "attribute";
  if (keywords.has(token)) return "keyword";
  const first = token[0];
  if (!first) return "plain";
  if (isDigit(first)) return "number";
  if (first !== first.toLowerCase() && isLetter(first)) return "type";
  return "plain";
};

const tokenise = (text: string): Token[] => {
  const out: Token[] = [];
  let buffer = "";
  let inString = false;

  const flush = () => {
    if (buffer) out.push({ text: buffer, kind: kindFor(buffer) });
    buffer = "";
  };

  for (const character of text) {
    if (inString) {
      buffer += character;
      if (character === '"') {
        out.push({ text: buffer, kind: "string" });
        buffer = "";
        inString = false;
      }
    } else if (character === '"') {
      flush();
      buffer += character;
      inString = true;
    } else if (isLetter(character) || isDigit(character) || character === "_" || character === "@") {
      buffer += character;
    } else {
      flush();
      out.push({ text: character, kind: "plain" });
    }
  }

  if (inString) out.push({ text: buffer, kind: "string" });
  else flush();

  return out;
};

const highlightLine = (line: string): Token[] => {
  // A line comment swallows the rest of the line, so handle it before tokenising.
  const at = line.indexOf("//");
  if (at >= 0) {
    return [...tokenise(line.slice(0, at)), { text: line.slice(at), kind: "comment" }];
  }
  return tokenise(line);
};

/** One token array per line, so the renderer keeps line structure without a parser. */
export const highlight = (source: string): Token[][] => source.split("\n").map(highlightLine);

export const tokenClass: Record<TokenKind, string> = {
  comment: "text-[#6E7681]",
  keyword: "text-[#FF7B9C]",
  type: "text-[#7EE0C8]",
  string: "text-[#FFD580]",
  number: "text-[#C4A6FF]",
  attribute: "text-[#9DC4FF]",
  plain: "text-[#E6E6EF]",
};
