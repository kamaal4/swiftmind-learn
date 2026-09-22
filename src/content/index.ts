import type {
  Concept,
  ContentCategory,
  Difficulty,
  InterviewQuestion,
  QuizQuestion,
  Release,
  TriviaItem,
} from "./schema.ts";
import { difficulties } from "./schema.ts";

import categoriesJson from "./data/categories.json" with { type: "json" };
import conceptsSwift from "./data/concepts-swift.json" with { type: "json" };
import conceptsMemory from "./data/concepts-memory.json" with { type: "json" };
import conceptsConcurrency from "./data/concepts-concurrency.json" with { type: "json" };
import conceptsUikit from "./data/concepts-uikit.json" with { type: "json" };
import conceptsSwiftui from "./data/concepts-swiftui.json" with { type: "json" };
import quizzesJson from "./data/quizzes.json" with { type: "json" };
import triviaJson from "./data/trivia.json" with { type: "json" };
import interviewJson from "./data/interview.json" with { type: "json" };
import releasesJson from "./data/releases.json" with { type: "json" };

export const difficultyRank = (d: Difficulty): number => difficulties.indexOf(d);

const byID = <T extends { id: string }>(items: readonly T[]): ReadonlyMap<string, T> =>
  new Map(items.map((item) => [item.id, item]));

export type ContentInput = {
  categories: readonly ContentCategory[];
  concepts: readonly Concept[];
  quizzes: readonly QuizQuestion[];
  trivia: readonly TriviaItem[];
  interview: readonly InterviewQuestion[];
  releases?: readonly Release[];
};

// The ContentStore port from SwiftMind/Content/ContentStore.swift, as a factory so tests can
// build a store from fixtures instead of the real bundle.
export const makeContent = (input: ContentInput) => {
  const categories = input.categories.slice().sort((a, b) => a.order - b.order);
  const concepts = input.concepts.slice();
  const quizzes = input.quizzes.slice();
  const trivia = input.trivia.slice();
  const interview = input.interview.slice();
  const releases = (input.releases ?? [])
    .slice()
    .sort((a, b) => b.releasedOn.localeCompare(a.releasedOn));

  const conceptByID = byID(concepts);
  const quizByID = byID(quizzes);

  const conceptsByCategory = new Map<string, Concept[]>(
    categories.map((category) => [
      category.id,
      concepts
        .filter((concept) => concept.categoryID === category.id)
        .sort(
          (a, b) =>
            difficultyRank(a.difficulty) - difficultyRank(b.difficulty) ||
            a.title.localeCompare(b.title),
        ),
    ]),
  );

  const conceptsIn = (categoryID: string): readonly Concept[] =>
    conceptsByCategory.get(categoryID) ?? [];

  /** Reading order across the whole course: category order, then difficulty, then title. */
  const ordered: readonly Concept[] = categories.flatMap((c) => conceptsIn(c.id));

  return {
    categories,
    concepts,
    quizzes,
    trivia,
    interview,
    releases,
    ordered,
    categoryByID: byID(categories),
    conceptByID,
    quizByID,
    triviaByID: byID(trivia),
    interviewByID: byID(interview),
    releaseByID: byID(releases),
    conceptsIn,
    interviewIn: (categoryID: string): readonly InterviewQuestion[] =>
      interview.filter((q) => q.categoryID === categoryID),
    /** Quiz questions for a concept, in the order the author listed them. */
    quizzesFor: (conceptID: string): readonly QuizQuestion[] =>
      (conceptByID.get(conceptID)?.quizIDs ?? [])
        .map((id) => quizByID.get(id))
        .filter((q): q is QuizQuestion => q !== undefined),
    neighbours: (conceptID: string): { prev?: Concept; next?: Concept } => {
      const i = ordered.findIndex((c) => c.id === conceptID);
      if (i < 0) return {};
      return { prev: ordered[i - 1], next: ordered[i + 1] };
    },
  } as const;
};

export type Content = ReturnType<typeof makeContent>;

// TypeScript widens JSON literals (`difficulty: string`), so the shape is asserted here and
// enforced for real by `npm run content:check`.
export const content: Content = makeContent({
  categories: categoriesJson as ContentCategory[],
  concepts: [
    ...conceptsSwift,
    ...conceptsMemory,
    ...conceptsConcurrency,
    ...conceptsUikit,
    ...conceptsSwiftui,
  ] as unknown as Concept[],
  quizzes: quizzesJson as unknown as QuizQuestion[],
  trivia: triviaJson as unknown as TriviaItem[],
  interview: interviewJson as unknown as InterviewQuestion[],
  releases: releasesJson as unknown as Release[],
});
