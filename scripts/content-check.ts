import { z } from "zod";
import { content } from "../src/content/index.ts";
import { validateReferences, type Issue } from "../src/content/references.ts";
import {
  categorySchema,
  conceptSchema,
  interviewQuestionSchema,
  quizQuestionSchema,
  releaseSchema,
  triviaSchema,
} from "../src/content/schema.ts";

const shapeIssues = <T>(label: string, schema: z.ZodType<T>, items: readonly unknown[]): Issue[] =>
  items.flatMap((item, i) => {
    const result = schema.safeParse(item);
    if (result.success) return [];
    const id = (item as { id?: string })?.id ?? `#${i}`;
    return result.error.issues.map((issue) => ({
      location: `${label} ${id}${issue.path.length ? ` → ${issue.path.join(".")}` : ""}`,
      problem: issue.message,
    }));
  });

const issues = [
  ...shapeIssues("category", categorySchema, content.categories),
  ...shapeIssues("concept", conceptSchema, content.concepts),
  ...shapeIssues("quiz", quizQuestionSchema, content.quizzes),
  ...shapeIssues("trivia", triviaSchema, content.trivia),
  ...shapeIssues("interview", interviewQuestionSchema, content.interview),
  ...shapeIssues("release", releaseSchema, content.releases),
  ...validateReferences(content),
];

if (issues.length === 0) {
  const { categories, concepts, quizzes, trivia, interview, releases } = content;
  const sections = concepts.reduce((n, c) => n + c.sections.length, 0);
  console.log(
    `content ok — ${categories.length} categories, ${concepts.length} concepts ` +
      `(${sections} sections), ${quizzes.length} quizzes, ${trivia.length} trivia, ` +
      `${interview.length} interview questions, ${releases.length} releases`,
  );
} else {
  for (const issue of issues) console.error(`${issue.location}: ${issue.problem}`);
  console.error(`\n${issues.length} content ${issues.length === 1 ? "issue" : "issues"}`);
  process.exitCode = 1;
}
