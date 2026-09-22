import Link from "next/link";
import { content } from "@/content";
import type { InterviewQuestion } from "@/content/schema";
import { MarkdownText } from "./MarkdownText";
import { LevelBadge } from "./ui";

// A <details> rather than a JS reveal: keyboard support and animation for free, and the
// answer is still reachable with JS disabled.
export function InterviewQuestionCard({
  question,
  showLevel = false,
}: {
  question: InterviewQuestion;
  showLevel?: boolean;
}) {
  const concept = content.conceptByID.get(question.conceptID);

  return (
    <details id={question.id} className="card scroll-mt-24 p-5">
      <summary className="cursor-pointer list-none">
        <div className="flex items-start gap-3">
          <span className="mt-1 text-text-2" aria-hidden="true">
            ▸
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="title-s">{question.question}</h3>
            <p className="caption mt-2 flex flex-wrap items-center gap-2 text-text-2">
              {showLevel && <LevelBadge level={question.level} />}
              <span>Tap to think, then reveal</span>
            </p>
          </div>
        </div>
      </summary>

      <div className="mt-4 border-t border-separator pt-4">
        <MarkdownText body={question.answer} />

        <p className="caption mt-5 font-semibold tracking-wide text-text-2 uppercase">
          What an interviewer listens for
        </p>
        <ul className="mt-2 space-y-1.5">
          {question.keyPoints.map((point, i) => (
            <li key={i} className="flex gap-2 text-[0.9375rem]">
              <span className="text-success" aria-hidden="true">
                ✓
              </span>
              <span>{point}</span>
            </li>
          ))}
        </ul>

        {question.followUps.length > 0 && (
          <>
            <p className="caption mt-5 font-semibold tracking-wide text-text-2 uppercase">
              Follow-ups
            </p>
            <div className="mt-2 space-y-3">
              {question.followUps.map((followUp) => (
                <details key={followUp.id} className="rounded-xl border border-separator p-4">
                  <summary className="cursor-pointer text-[0.9375rem] font-medium">
                    {followUp.question}
                  </summary>
                  <MarkdownText body={followUp.answer} className="mt-2 text-[0.9375rem] text-text-2" />
                </details>
              ))}
            </div>
          </>
        )}

        {concept && (
          <Link
            href={`/learn/${concept.categoryID}/${concept.id}`}
            className="caption mt-5 inline-block text-accent underline underline-offset-4"
          >
            Read the concept: {concept.title}
          </Link>
        )}
      </div>
    </details>
  );
}
