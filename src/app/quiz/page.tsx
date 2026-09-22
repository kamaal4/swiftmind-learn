import type { Metadata } from "next";
import Link from "next/link";
import { content } from "@/content";
import { modeCopy, questionLimits, type QuizModeKind } from "@/learning/quiz";

export const metadata: Metadata = {
  title: "Quiz",
  description:
    "Daily quizzes, weak-area drills and interview-level questions, scheduled by spaced repetition.",
};

const hubModes: QuizModeKind[] = ["daily", "weakAreas", "random", "interview"];

export default function QuizHubPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="title-xl">Quiz</h1>
      <p className="mt-2 max-w-[60ch] text-text-2">
        Every answer moves the concept along a spaced-repetition schedule — right answers push the
        next review further out, a wrong one brings it back tomorrow. The explanation shows either
        way; that is where the learning is.
      </p>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {hubModes.map((kind) => (
          <li key={kind}>
            <Link href={`/quiz/${kind}`} className="card block h-full p-5 hover:border-accent">
              <h2 className="title-s">{modeCopy[kind].title}</h2>
              <p className="mt-1 text-[0.9375rem] text-text-2">{modeCopy[kind].subtitle}</p>
              <p className="caption mt-3 text-text-2">{questionLimits[kind]} questions</p>
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="title-m mt-12">By category</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {content.categories.map((category) => (
          <li key={category.id} style={{ "--cat": `#${category.accentHex}` } as React.CSSProperties}>
            <Link
              href={`/quiz/category?id=${category.id}`}
              className="card flex items-center gap-3 p-4 hover:border-cat"
            >
              <span className="h-8 w-1 shrink-0 rounded-full bg-cat" aria-hidden="true" />
              <span className="font-medium">{category.name}</span>
              <span className="caption ml-auto text-text-2">
                {content.quizzes.filter((q) => q.categoryID === category.id).length} questions
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
