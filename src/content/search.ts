import type { Content } from "./index.ts";
import type { Concept, InterviewQuestion, TriviaItem } from "./schema.ts";

// Ported from LocalSearch in SwiftMind/Features/Search/SearchResultsView.swift.

export type SearchResults = {
  concepts: Concept[];
  interviewQuestions: InterviewQuestion[];
  trivia: TriviaItem[];
};

export const emptyResults: SearchResults = { concepts: [], interviewQuestions: [], trivia: [] };

export const isEmpty = (r: SearchResults): boolean =>
  r.concepts.length === 0 && r.interviewQuestions.length === 0 && r.trivia.length === 0;

export const search = (query: string, content: Content): SearchResults => {
  const needle = query.trim().toLowerCase();
  // One character matches too much to be useful; it would return most of the course.
  if (needle.length < 2) return emptyResults;

  const matches = (...haystack: (string | undefined)[]) =>
    haystack.some((s) => (s ?? "").toLowerCase().includes(needle));

  return {
    concepts: content.concepts.filter((c) => matches(c.title, c.subtitle, c.tags.join(" "))),
    interviewQuestions: content.interview.filter((q) => matches(q.question, q.answer)),
    trivia: content.trivia.filter((t) => matches(t.text, t.detail)),
  };
};
