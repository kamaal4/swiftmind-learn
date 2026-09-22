import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { QuizRunner } from "@/components/QuizRunner";
import { modeCopy, questionLimits, type QuizModeKind } from "@/learning/quiz";

const modes = Object.keys(questionLimits) as QuizModeKind[];

export function generateStaticParams() {
  return modes.map((mode) => ({ mode }));
}

export async function generateMetadata({ params }: PageProps<"/quiz/[mode]">): Promise<Metadata> {
  const { mode } = await params;
  const copy = modeCopy[mode as QuizModeKind];
  return copy ? { title: copy.title, description: copy.subtitle } : {};
}

export default async function QuizPage({ params }: PageProps<"/quiz/[mode]">) {
  const { mode } = await params;
  if (!modes.includes(mode as QuizModeKind)) notFound();
  const kind = mode as QuizModeKind;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="caption text-text-2">
        <Link href="/quiz" className="hover:text-text">
          Quiz
        </Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{modeCopy[kind].title}</span>
      </nav>

      <h1 className="title-xl mt-3">{modeCopy[kind].title}</h1>
      <p className="mt-1 text-text-2">{modeCopy[kind].subtitle}</p>

      <div className="mt-8">
        <Suspense fallback={<p className="text-text-2">Loading…</p>}>
          <QuizRunner kind={kind} />
        </Suspense>
      </div>
    </div>
  );
}
