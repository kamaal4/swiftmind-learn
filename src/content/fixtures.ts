import type { Concept, ContentCategory, Difficulty, QuizQuestion } from "./schema.ts";
import { makeContent, type ContentInput } from "./index.ts";
import type { ConceptProgress, ProgressState } from "../progress/types.ts";
import { emptyConcept, emptyState } from "../progress/types.ts";

// Test fixtures, ported from the helpers in SwiftMindTests. Not imported by app code.

export const category: ContentCategory = {
  id: "cat",
  name: "Cat",
  summary: "s",
  systemImage: "swift",
  accentHex: "FF0000",
  order: 1,
};

export const concept: Concept = {
  id: "c1",
  title: "One",
  subtitle: "s",
  categoryID: "cat",
  difficulty: "beginner",
  estimatedMinutes: 5,
  tags: [],
  sections: [{ type: "explanation", id: "c1-s1", body: "b" }],
  quizIDs: ["q1", "q2"],
  triviaIDs: [],
  interviewQuestionIDs: [],
  relatedConceptIDs: [],
  prerequisiteIDs: [],
};

export const makeConcept = (
  id: string,
  overrides: Partial<Concept> = {},
): Concept => ({
  ...concept,
  id,
  title: id,
  sections: [{ type: "explanation", id: `${id}-s1`, body: "b" }],
  quizIDs: [],
  ...overrides,
});

export const question = (
  id: string,
  correct: string,
  conceptID = "c1",
  categoryID = "cat",
  difficulty: Difficulty = "beginner",
): QuizQuestion => ({
  id,
  conceptID,
  categoryID,
  kind: "multipleChoice",
  prompt: "P",
  options: [
    { id: "a", text: "A" },
    { id: "b", text: "B" },
  ],
  correctOptionID: correct,
  explanation: "e",
  difficulty,
});

export const emptyContent = makeContent({
  categories: [],
  concepts: [],
  quizzes: [],
  trivia: [],
  interview: [],
});

export const testContent = (overrides: Partial<ContentInput> = {}) => {
  const other: ContentCategory = {
    id: "other",
    name: "Other",
    summary: "s",
    systemImage: "swift",
    accentHex: "00FF00",
    order: 2,
  };
  const otherConcept: Concept = {
    ...concept,
    id: "c2",
    title: "Two",
    categoryID: "other",
    difficulty: "advanced",
    sections: [{ type: "explanation", id: "c2-s1", body: "b" }],
    quizIDs: ["q3"],
  };
  return makeContent({
    categories: [category, other],
    concepts: [concept, otherConcept],
    quizzes: [
      question("q1", "a"),
      question("q2", "b"),
      question("q3", "a", "c2", "other", "senior"),
    ],
    trivia: [],
    interview: [],
    ...overrides,
  });
};

export const progressWith = (concepts: Record<string, Partial<ConceptProgress>>): ProgressState => ({
  ...emptyState,
  concepts: Object.fromEntries(
    Object.entries(concepts).map(([id, p]) => [id, { ...emptyConcept, ...p }]),
  ),
});
