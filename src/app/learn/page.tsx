import type { Metadata } from "next";
import Link from "next/link";
import { content } from "@/content";
import { CategoryProgress } from "@/components/progress-islands";

export const metadata: Metadata = {
  title: "Learn",
  description:
    "Swift, memory management, concurrency, UIKit and SwiftUI — structured concepts from beginner to senior level.",
};

export default function LearnPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="title-xl">Learn</h1>
      <p className="mt-2 max-w-[60ch] text-text-2">
        Five tracks, {content.concepts.length} concepts. Each one is a structured lesson — an
        explanation, an analogy, a diagram you can step through, real code, the common mistake, and
        a question an interviewer would actually ask.
      </p>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {content.categories.map((category) => {
          const concepts = content.conceptsIn(category.id);
          return (
            <li key={category.id} style={{ "--cat": `#${category.accentHex}` } as React.CSSProperties}>
              <Link
                href={`/learn/${category.id}`}
                className="card block h-full p-5 transition-colors hover:border-cat"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-10 w-1 shrink-0 rounded-full bg-cat" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <h2 className="title-s">{category.name}</h2>
                    <p className="mt-1 text-[0.9375rem] text-text-2">{category.summary}</p>
                    <p className="caption mt-3 text-text-2">
                      {concepts.length} concepts · {content.interviewIn(category.id).length} interview
                      questions
                    </p>
                    <div className="mt-3">
                      <CategoryProgress categoryID={category.id} />
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
