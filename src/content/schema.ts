import { z } from "zod";

// Ported from SwiftMind/Content/ContentModels.swift. Runs only in scripts/content-check.ts —
// the app imports the JSON directly and never parses at runtime.

const text = z.string().refine((s) => s.trim().length > 0, "must not be blank");

export const difficulties = ["beginner", "intermediate", "advanced", "senior"] as const;
export const interviewLevels = ["junior", "mid", "senior", "staff"] as const;
export const questionKinds = [
  "multipleChoice",
  "trueFalse",
  "scenario",
  "code",
  "whatHappensNext",
] as const;
export const calloutStyles = ["mistake", "warning", "tip", "note"] as const;
export const nodeStyles = ["object", "owner", "closure", "actorBox", "thread", "view", "note"] as const;
export const edgeStyles = ["strong", "weak", "unowned", "flow", "dashed"] as const;

const difficulty = z.enum(difficulties);
const interviewLevel = z.enum(interviewLevels);

export const categorySchema = z.object({
  id: text,
  name: text,
  summary: text,
  systemImage: z.string(),
  accentHex: z.string().regex(/^[0-9A-Fa-f]{6}$/, "must be a bare 6-digit hex colour"),
  order: z.number().int(),
});

const textBlock = z.object({ id: text, heading: text.optional(), body: text });
const codeBlock = z.object({
  id: text,
  heading: text.optional(),
  caption: text.optional(),
  code: text,
});
const callout = z.object({
  id: text,
  style: z.enum(calloutStyles),
  title: text,
  body: text,
});
const sectionRef = z.object({ id: text, refID: text });

const diagram = z.object({
  id: text,
  title: text,
  altText: text,
  nodes: z
    .array(
      z.object({
        id: text,
        label: text,
        detail: text.optional(),
        x: z.number().min(0).max(1),
        y: z.number().min(0).max(1),
        style: z.enum(nodeStyles),
      }),
    )
    .nonempty(),
  edges: z.array(
    z.object({
      id: text,
      from: text,
      to: text,
      label: text.optional(),
      style: z.enum(edgeStyles),
    }),
  ),
  steps: z.array(
    z.object({ id: text, caption: text, nodeIDs: z.array(z.string()), edgeIDs: z.array(z.string()) }),
  ),
});

const withType = <T extends z.ZodRawShape, K extends string>(type: K, shape: T) =>
  z.object({ type: z.literal(type), ...shape });

// The trailing `.or(...)` member IS the forward-compatible `unsupported` case: content-check
// rejects an unknown type as an authoring typo, while the renderer's switch skips it.
export const sectionSchema = z.union([
  withType("explanation", textBlock.shape),
  withType("analogy", textBlock.shape),
  withType("underTheHood", textBlock.shape),
  withType("keyTakeaway", textBlock.shape),
  withType("code", codeBlock.shape),
  withType("callout", callout.shape),
  withType("diagram", diagram.shape),
  withType("quickCheck", sectionRef.shape),
  withType("trivia", sectionRef.shape),
  withType("interview", sectionRef.shape),
]);

export const unknownSectionSchema = z.object({ id: text, type: z.string() });

export const conceptSchema = z.object({
  id: text,
  title: text,
  subtitle: text,
  categoryID: text,
  difficulty,
  estimatedMinutes: z.number().int().positive(),
  tags: z.array(text),
  sections: z.array(sectionSchema).nonempty(),
  quizIDs: z.array(text),
  triviaIDs: z.array(text),
  interviewQuestionIDs: z.array(text),
  relatedConceptIDs: z.array(text),
  prerequisiteIDs: z.array(text),
});

export const quizQuestionSchema = z.object({
  id: text,
  conceptID: text,
  categoryID: text,
  kind: z.enum(questionKinds),
  prompt: text,
  code: text.optional(),
  options: z.array(z.object({ id: text, text })).min(2, "needs at least two options"),
  correctOptionID: text,
  explanation: text,
  difficulty,
});

export const triviaSchema = z.object({
  id: text,
  conceptID: text,
  categoryID: text,
  text,
  detail: text.optional(),
});

export const interviewQuestionSchema = z.object({
  id: text,
  conceptID: text,
  categoryID: text,
  level: interviewLevel,
  question: text,
  answer: text,
  keyPoints: z.array(text).nonempty(),
  followUps: z.array(z.object({ id: text, question: text, answer: text })),
});

// Release Radar — web-only, no iOS counterpart.
export const releaseSchema = z.object({
  id: text,
  kind: z.enum(["swift", "ios", "xcode"]),
  version: text,
  releasedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must be YYYY-MM-DD"),
  title: text,
  summary: text,
  impact: z.enum(["high", "medium", "low"]),
  changes: z
    .array(
      z.object({
        id: text,
        type: z.enum(["new", "changed", "deprecated", "removed"]),
        title: text,
        detail: text,
        migration: text.optional(),
        conceptIDs: z.array(text),
        link: z.string().url().optional(),
      }),
    )
    .nonempty(),
});

export type ContentCategory = z.infer<typeof categorySchema>;
export type Concept = z.infer<typeof conceptSchema>;
// Deliberately the *known* union only. A `type: string` member would overlap every literal
// and defeat narrowing in the renderer's switch; an unrecognised kind is handled at runtime
// by that switch's default case, and rejected at authoring time by content:check.
export type ConceptSection = z.infer<typeof sectionSchema>;
export type Diagram = Extract<z.infer<typeof sectionSchema>, { type: "diagram" }>;
export type DiagramNode = Diagram["nodes"][number];
export type DiagramEdge = Diagram["edges"][number];
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type TriviaItem = z.infer<typeof triviaSchema>;
export type InterviewQuestion = z.infer<typeof interviewQuestionSchema>;
export type Release = z.infer<typeof releaseSchema>;
export type ReleaseChange = Release["changes"][number];
export type Difficulty = (typeof difficulties)[number];
export type InterviewLevel = (typeof interviewLevels)[number];
