"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { content } from "@/content";
import type { QuizQuestion } from "@/content/schema";
import { grade, makeSession, modeCopy, type QuizMode, type QuizModeKind } from "@/learning/quiz";
import { dispatch, useHydrated, useProgress } from "@/progress/store";
import { highlight, tokenClass } from "@/lib/highlight";
import { MarkdownText } from "./MarkdownText";
import { DifficultyBadge } from "./ui";

type Answered = { question: QuizQuestion; chosen: string; correct: boolean };

type Session = {
  key: string;
  questions: QuizQuestion[];
  index: number;
  chosen: string | null;
  answered: Answered[];
};

export function QuizRunner({ kind }: { kind: QuizModeKind }) {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const progress = useProgress();
  const hydrated = useHydrated();

  const mode: QuizMode = useMemo(
    () =>
      kind === "concept" || kind === "category"
        ? ({ kind, id } as QuizMode)
        : ({ kind } as QuizMode),
    [kind, id],
  );

  // The session is built once per mode, on the client, because the pool depends on stored
  // progress and a non-daily mode draws a random seed. Building it during render (rather than
  // in an effect) keeps it out of the server pass without a cascading re-render, and it is
  // deliberately not rebuilt when progress changes — re-shuffling mid-session would be hostile.
  const key = `${kind}:${id}`;
  const [session, setSession] = useState<Session | null>(null);

  if (hydrated && session?.key !== key) {
    setSession({
      key,
      questions: makeSession(mode, content, progress, new Date()).questions,
      index: 0,
      chosen: null,
      answered: [],
    });
  }

  if (!session || session.key !== key) {
    return <p className="text-text-2">Building your quiz…</p>;
  }

  const { questions, index, chosen, answered } = session;
  const update = (change: Partial<Session>) => setSession((s) => (s ? { ...s, ...change } : s));

  if (questions.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="title-s">Nothing to ask yet</p>
        <p className="mt-1 text-text-2">There are no questions for this selection.</p>
        <Link href="/quiz" className="mt-4 inline-block text-accent underline underline-offset-4">
          Back to quizzes
        </Link>
      </div>
    );
  }

  if (index >= questions.length) {
    return <Results answered={answered} kind={kind} />;
  }

  const question = questions[index];
  const submitted = answered.length > index;
  const outcome = submitted ? answered[index] : null;

  const submit = () => {
    if (!chosen || submitted) return;
    const result = grade(question, chosen);
    dispatch({ type: "answer", outcome: result, now: new Date() });
    update({ answered: [...answered, { question, chosen, correct: result.wasCorrect }] });
  };

  const next = () => update({ index: index + 1, chosen: null });

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-separator">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-200"
            style={{ width: `${((index + (submitted ? 1 : 0)) / questions.length) * 100}%` }}
          />
        </div>
        <span className="caption tabular-nums text-text-2">
          {index + 1} of {questions.length}
        </span>
      </div>

      <div className="card mt-6 p-6">
        <DifficultyBadge difficulty={question.difficulty} />
        <MarkdownText body={question.prompt} className="title-m mt-3" />

        {question.code && (
          <pre className="mt-4 overflow-x-auto rounded-xl bg-code-bg p-4 font-mono text-[0.875rem] leading-[1.6]">
            <code>
              {highlight(question.code).map((tokens, i) => (
                <span key={i} className="block">
                  {tokens.map((token, j) => (
                    <span key={j} className={tokenClass[token.kind]}>
                      {token.text}
                    </span>
                  ))}
                </span>
              ))}
            </code>
          </pre>
        )}

        <fieldset className="mt-5" disabled={submitted}>
          <legend className="sr-only">Choose an answer</legend>
          <div className="space-y-2">
            {question.options.map((option) => {
              const isCorrect = option.id === question.correctOptionID;
              const isChosen = (outcome?.chosen ?? chosen) === option.id;

              // Never colour alone: the right answer is also labelled in words.
              let state = "border-separator";
              if (submitted && isCorrect) state = "border-success bg-success/10";
              else if (submitted && isChosen) state = "border-danger bg-danger/10";
              else if (isChosen) state = "border-accent bg-accent/10";

              return (
                <label
                  key={option.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 px-4 py-3 transition-colors ${state}`}
                >
                  <input
                    type="radio"
                    name="option"
                    value={option.id}
                    checked={isChosen}
                    onChange={() => update({ chosen: option.id })}
                    className="mt-1.5 accent-accent"
                  />
                  <span className="flex-1">{option.text}</span>
                  {submitted && isCorrect && (
                    <span className="caption font-semibold text-success">✓ Correct</span>
                  )}
                  {submitted && isChosen && !isCorrect && (
                    <span className="caption font-semibold text-danger">✕ Your answer</span>
                  )}
                </label>
              );
            })}
          </div>
        </fieldset>

        {submitted && outcome && (
          <div className="mt-5 rounded-xl border border-separator p-4" aria-live="polite">
            <p className={`font-semibold ${outcome.correct ? "text-success" : "text-danger"}`}>
              {outcome.correct ? "✓ Correct" : "✕ Not quite"}
            </p>
            <MarkdownText body={question.explanation} className="mt-2 text-[0.9375rem]" />
          </div>
        )}

        <div className="mt-6 flex justify-end">
          {submitted ? (
            <button
              type="button"
              onClick={next}
              className="rounded-xl bg-accent px-5 py-2.5 font-medium text-white transition-opacity hover:opacity-90"
            >
              {index + 1 === questions.length ? "See results" : "Next question"}
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={!chosen}
              className="rounded-xl bg-accent px-5 py-2.5 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              Check answer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Results({ answered, kind }: { answered: Answered[]; kind: QuizModeKind }) {
  const correct = answered.filter((a) => a.correct).length;
  const missed = answered.filter((a) => !a.correct);

  return (
    <div className="card p-8">
      <h2 className="title-m">{modeCopy[kind].title} complete</h2>
      <p className="stat mt-4">
        {correct} / {answered.length}
      </p>
      <p className="text-text-2">
        {correct === answered.length
          ? "Every one right. Those intervals just got longer."
          : "Everything you missed is now scheduled to come back sooner."}
      </p>

      {missed.length > 0 && (
        <>
          <p className="caption mt-6 font-semibold tracking-wide text-text-2 uppercase">
            Worth re-reading
          </p>
          <ul className="mt-2 space-y-2">
            {missed.map((a) => {
              const concept = content.conceptByID.get(a.question.conceptID);
              if (!concept) return null;
              return (
                <li key={a.question.id}>
                  <Link
                    href={`/learn/${concept.categoryID}/${concept.id}`}
                    className="text-accent underline underline-offset-4"
                  >
                    {concept.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/quiz"
          className="rounded-xl bg-accent px-5 py-2.5 font-medium text-white transition-opacity hover:opacity-90"
        >
          More quizzes
        </Link>
        <Link href="/progress" className="rounded-xl border border-separator px-5 py-2.5 font-medium">
          See your progress
        </Link>
      </div>
    </div>
  );
}
