import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { content } from "@/content";
import { InterviewQuestionCard } from "@/components/InterviewQuestionCard";

export function generateStaticParams() {
  return content.categories.map((category) => ({ categoryId: category.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/interview/[categoryId]">): Promise<Metadata> {
  const { categoryId } = await params;
  const category = content.categoryByID.get(categoryId);
  if (!category) return {};
  return {
    title: `${category.name} interview questions`,
    description: `Interview questions on ${category.name}, with model answers and follow-ups.`,
  };
}

export default async function InterviewCategoryPage({
  params,
}: PageProps<"/interview/[categoryId]">) {
  const { categoryId } = await params;
  const category = content.categoryByID.get(categoryId);
  if (!category) notFound();

  const questions = content
    .interviewIn(category.id)
    .slice()
    .sort((a, b) => a.level.localeCompare(b.level));

  return (
    <div
      className="mx-auto max-w-3xl px-4 py-10"
      style={{ "--cat": `#${category.accentHex}` } as React.CSSProperties}
    >
      <nav aria-label="Breadcrumb" className="caption text-text-2">
        <Link href="/interview" className="hover:text-text">
          Interview
        </Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{category.name}</span>
      </nav>

      <div className="mt-4 flex items-start gap-4">
        <span className="mt-2 h-12 w-1.5 shrink-0 rounded-full bg-cat" aria-hidden="true" />
        <div>
          <h1 className="title-xl">{category.name}</h1>
          <p className="mt-2 text-text-2">
            {questions.length} interview questions on {category.name.toLowerCase()}.
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        {questions.map((question) => (
          <InterviewQuestionCard key={question.id} question={question} showLevel />
        ))}
      </div>

      <div className="card mt-10 flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h2 className="title-s">Drill interview-level questions</h2>
          <p className="caption mt-1 text-text-2">
            Advanced and senior quiz questions only, across every category.
          </p>
        </div>
        <Link
          href="/quiz/interview"
          className="rounded-xl bg-accent px-5 py-2.5 font-medium text-white transition-opacity hover:opacity-90"
        >
          Start
        </Link>
      </div>
    </div>
  );
}
