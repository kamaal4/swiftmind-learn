import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { content } from "@/content";
import { CategoryProgress, ConceptMastery } from "@/components/progress-islands";
import { DifficultyBadge } from "@/components/ui";

export function generateStaticParams() {
  return content.categories.map((category) => ({ categoryId: category.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/learn/[categoryId]">): Promise<Metadata> {
  const { categoryId } = await params;
  const category = content.categoryByID.get(categoryId);
  if (!category) return {};
  return { title: category.name, description: category.summary };
}

export default async function CategoryPage({ params }: PageProps<"/learn/[categoryId]">) {
  const { categoryId } = await params;
  const category = content.categoryByID.get(categoryId);
  if (!category) notFound();

  const concepts = content.conceptsIn(category.id);
  const minutes = concepts.reduce((n, c) => n + c.estimatedMinutes, 0);

  return (
    <div
      className="mx-auto max-w-3xl px-4 py-10"
      style={{ "--cat": `#${category.accentHex}` } as React.CSSProperties}
    >
      <nav aria-label="Breadcrumb" className="caption text-text-2">
        <Link href="/learn" className="hover:text-text">
          Learn
        </Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{category.name}</span>
      </nav>

      <div className="mt-4 flex items-start gap-4">
        <span className="mt-2 h-12 w-1.5 shrink-0 rounded-full bg-cat" aria-hidden="true" />
        <div>
          <h1 className="title-xl">{category.name}</h1>
          <p className="mt-2 max-w-[60ch] text-text-2">{category.summary}</p>
        </div>
      </div>

      <div className="mt-6 max-w-sm">
        <CategoryProgress categoryID={category.id} />
      </div>

      <p className="caption mt-6 text-text-2">
        {concepts.length} concepts · about {minutes} minutes of reading ·{" "}
        {content.interviewIn(category.id).length} interview questions
      </p>

      <ul className="mt-8 space-y-3">
        {concepts.map((concept) => (
          <li key={concept.id}>
            <Link
              href={`/learn/${category.id}/${concept.id}`}
              className="card block p-5 transition-colors hover:border-cat"
            >
              <div className="flex flex-wrap items-center gap-2">
                <ConceptMastery conceptID={concept.id} />
                <DifficultyBadge difficulty={concept.difficulty} />
                <span className="caption ml-auto text-text-2">{concept.estimatedMinutes} min</span>
              </div>
              <h2 className="title-s mt-3">{concept.title}</h2>
              <p className="mt-1 text-[0.9375rem] text-text-2">{concept.subtitle}</p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="card mt-10 flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h2 className="title-s">Quiz this category</h2>
          <p className="caption mt-1 text-text-2">
            Ten questions drawn from everything in {category.name}.
          </p>
        </div>
        <Link
          href={`/quiz/category?id=${category.id}`}
          className="rounded-xl bg-accent px-5 py-2.5 font-medium text-white transition-opacity hover:opacity-90"
        >
          Start quiz
        </Link>
      </div>
    </div>
  );
}
