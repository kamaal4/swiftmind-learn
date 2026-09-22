import type { Metadata } from "next";
import Link from "next/link";
import { content } from "@/content";
import { interviewLevels } from "@/content/schema";
import { InterviewQuestionCard } from "@/components/InterviewQuestionCard";
import { LevelBadge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Interview prep",
  description:
    "iOS interview questions by level — junior through staff — with model answers and what an interviewer is listening for.",
};

export default function InterviewPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="title-xl">Interview prep</h1>
      <p className="mt-2 max-w-[60ch] text-text-2">
        {content.interview.length} questions with model answers, the points an interviewer is
        actually listening for, and the follow-ups they will ask next. Think before you reveal.
      </p>

      <nav aria-label="Jump to level" className="mt-6 flex flex-wrap gap-2">
        {interviewLevels.map((level) => (
          <a
            key={level}
            href={`#${level}`}
            className="caption rounded-full border border-separator px-3 py-1.5 capitalize hover:border-accent"
          >
            {level}
          </a>
        ))}
      </nav>

      <div className="mt-6 flex flex-wrap gap-2">
        {content.categories.map((category) => (
          <Link
            key={category.id}
            href={`/interview/${category.id}`}
            className="caption rounded-full border border-separator px-3 py-1.5 hover:border-accent"
            style={{ "--cat": `#${category.accentHex}` } as React.CSSProperties}
          >
            {category.name}
          </Link>
        ))}
      </div>

      {interviewLevels.map((level) => {
        const questions = content.interview.filter((q) => q.level === level);
        if (questions.length === 0) return null;
        return (
          <section key={level} id={level} className="mt-12 scroll-mt-24">
            <div className="flex items-center gap-3">
              <h2 className="title-m capitalize">{level}</h2>
              <LevelBadge level={level} />
              <span className="caption text-text-2">{questions.length} questions</span>
            </div>
            <div className="mt-4 space-y-3">
              {questions.map((question) => (
                <InterviewQuestionCard key={question.id} question={question} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
