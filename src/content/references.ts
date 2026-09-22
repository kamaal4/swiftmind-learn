import type { Content } from "./index.ts";

// Ported from SwiftMind/Content/ContentValidator.swift. Catches what the type system and Zod
// cannot: a typo'd id in relatedConceptIDs, a quiz naming a renamed concept, a diagram edge
// pointing at a deleted node. Shape rules (empty strings, option counts) live in schema.ts.

export type Issue = { location: string; problem: string };

const duplicates = (ids: readonly string[], kind: string): Issue[] => {
  const seen = new Map<string, number>();
  for (const id of ids) seen.set(id, (seen.get(id) ?? 0) + 1);
  return [...seen.entries()]
    .filter(([, count]) => count > 1)
    .map(([id]) => id)
    .sort()
    .map((id) => ({ location: `${kind} ${id}`, problem: "duplicate id" }));
};

export const validateReferences = (content: Content): Issue[] => {
  const issues: Issue[] = [];
  const has = <T>(map: ReadonlyMap<string, T>, id: string) => map.has(id);

  issues.push(
    ...duplicates(content.categories.map((c) => c.id), "category"),
    ...duplicates(content.concepts.map((c) => c.id), "concept"),
    ...duplicates(content.quizzes.map((q) => q.id), "quiz question"),
    ...duplicates(content.trivia.map((t) => t.id), "trivia item"),
    ...duplicates(content.interview.map((q) => q.id), "interview question"),
    ...duplicates(content.releases.map((r) => r.id), "release"),
    ...duplicates(
      content.concepts.flatMap((c) => c.sections.map((s) => s.id)),
      "concept section",
    ),
  );

  const missing = (ids: readonly string[], at: string, label: string, exists: (id: string) => boolean) =>
    ids
      .filter((id) => !exists(id))
      .map((id) => ({ location: at, problem: `${label} refers to unknown id "${id}"` }));

  for (const concept of content.concepts) {
    const at = `concept ${concept.id}`;
    if (!has(content.categoryByID, concept.categoryID)) {
      issues.push({ location: at, problem: `unknown categoryID "${concept.categoryID}"` });
    }
    issues.push(
      ...missing(concept.quizIDs, at, "quizIDs", (id) => has(content.quizByID, id)),
      ...missing(concept.triviaIDs, at, "triviaIDs", (id) => has(content.triviaByID, id)),
      ...missing(concept.interviewQuestionIDs, at, "interviewQuestionIDs", (id) =>
        has(content.interviewByID, id),
      ),
      ...missing(concept.relatedConceptIDs, at, "relatedConceptIDs", (id) => has(content.conceptByID, id)),
      ...missing(concept.prerequisiteIDs, at, "prerequisiteIDs", (id) => has(content.conceptByID, id)),
    );
    if (concept.relatedConceptIDs.includes(concept.id)) {
      issues.push({ location: at, problem: "lists itself as a related concept" });
    }
    if (concept.prerequisiteIDs.includes(concept.id)) {
      issues.push({ location: at, problem: "lists itself as a prerequisite" });
    }

    for (const section of concept.sections) {
      const sectionAt = `${at} section ${section.id}`;
      switch (section.type) {
        case "quickCheck":
          if (!has(content.quizByID, section.refID)) {
            issues.push({
              location: sectionAt,
              problem: `quickCheck refers to unknown quiz "${section.refID}"`,
            });
          }
          break;
        case "trivia":
          if (!has(content.triviaByID, section.refID)) {
            issues.push({
              location: sectionAt,
              problem: `trivia refers to unknown item "${section.refID}"`,
            });
          }
          break;
        case "interview":
          if (!has(content.interviewByID, section.refID)) {
            issues.push({
              location: sectionAt,
              problem: `interview refers to unknown question "${section.refID}"`,
            });
          }
          break;
        case "diagram": {
          const nodeIDs = new Set(section.nodes.map((n) => n.id));
          const edgeIDs = new Set(section.edges.map((e) => e.id));
          for (const edge of section.edges) {
            if (!nodeIDs.has(edge.from)) {
              issues.push({
                location: sectionAt,
                problem: `edge "${edge.id}" starts at unknown node "${edge.from}"`,
              });
            }
            if (!nodeIDs.has(edge.to)) {
              issues.push({
                location: sectionAt,
                problem: `edge "${edge.id}" ends at unknown node "${edge.to}"`,
              });
            }
          }
          for (const step of section.steps) {
            for (const id of step.nodeIDs) {
              if (!nodeIDs.has(id)) {
                issues.push({
                  location: sectionAt,
                  problem: `step "${step.id}" highlights unknown node "${id}"`,
                });
              }
            }
            for (const id of step.edgeIDs) {
              if (!edgeIDs.has(id)) {
                issues.push({
                  location: sectionAt,
                  problem: `step "${step.id}" highlights unknown edge "${id}"`,
                });
              }
            }
          }
          break;
        }
      }
    }
  }

  // A quiz/trivia/interview item must agree with its owning concept about which category it is in.
  const ownerIssues = (conceptID: string, categoryID: string, at: string): Issue[] => {
    const concept = content.conceptByID.get(conceptID);
    if (!concept) return [{ location: at, problem: `unknown conceptID "${conceptID}"` }];
    if (!has(content.categoryByID, categoryID)) {
      return [{ location: at, problem: `unknown categoryID "${categoryID}"` }];
    }
    if (concept.categoryID !== categoryID) {
      return [
        {
          location: at,
          problem: `categoryID "${categoryID}" disagrees with concept's "${concept.categoryID}"`,
        },
      ];
    }
    return [];
  };

  for (const q of content.quizzes) {
    const at = `quiz ${q.id}`;
    if (!q.options.some((o) => o.id === q.correctOptionID)) {
      issues.push({
        location: at,
        problem: `correctOptionID "${q.correctOptionID}" isn't one of the options`,
      });
    }
    issues.push(...duplicates(q.options.map((o) => o.id), `${at} option`));
    issues.push(...ownerIssues(q.conceptID, q.categoryID, at));
  }

  for (const t of content.trivia) {
    issues.push(...ownerIssues(t.conceptID, t.categoryID, `trivia ${t.id}`));
  }

  for (const q of content.interview) {
    const at = `interview ${q.id}`;
    issues.push(...duplicates(q.followUps.map((f) => f.id), `${at} follow-up`));
    issues.push(...ownerIssues(q.conceptID, q.categoryID, at));
  }

  for (const release of content.releases) {
    issues.push(...duplicates(release.changes.map((c) => c.id), `release ${release.id} change`));
    for (const change of release.changes) {
      issues.push(
        ...missing(change.conceptIDs, `release ${release.id} change ${change.id}`, "conceptIDs", (id) =>
          has(content.conceptByID, id),
        ),
      );
    }
  }

  for (const category of content.categories) {
    if (content.conceptsIn(category.id).length === 0) {
      issues.push({ location: `category ${category.id}`, problem: "has no concepts" });
    }
  }

  return issues;
};
