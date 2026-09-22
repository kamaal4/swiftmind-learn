import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { content } from "@/content";
import type { ConceptSection } from "@/content/schema";
import { ConceptSections } from "@/components/ConceptSections";
import { ConceptActions, ConceptMastery, MarkOpened } from "@/components/progress-islands";
import { DifficultyBadge } from "@/components/ui";

export function generateStaticParams() {
  return content.concepts.map((concept) => ({
    categoryId: concept.categoryID,
    conceptId: concept.id,
  }));
}

export async function generateMetadata({
  params,
}: PageProps<"/learn/[categoryId]/[conceptId]">): Promise<Metadata> {
  const { conceptId } = await params;
  const concept = content.conceptByID.get(conceptId);
  if (!concept) return {};
  return { title: concept.title, description: concept.subtitle };
}

const headingFor = (section: ConceptSection) => {
  if ("heading" in section && section.heading) return section.heading;
  switch (section.type) {
    case "analogy":
      return "Analogy";
    case "underTheHood":
      return "Under the hood";
    case "keyTakeaway":
      return "Key takeaway";
    case "diagram":
      return "Diagram";
    case "quickCheck":
      return "Quick check";
    case "interview":
      return "Interview question";
    default:
      return null;
  }
};

export default async function ConceptPage({ params }: PageProps<"/learn/[categoryId]/[conceptId]">) {
  const { conceptId } = await params;
  const concept = content.conceptByID.get(conceptId);
  if (!concept) notFound();

  const category = content.categoryByID.get(concept.categoryID);
  if (!category) notFound();

  const siblings = content.conceptsIn(category.id);
  const { prev, next } = content.neighbours(concept.id);
  const toc = concept.sections
    .map((section) => ({ id: section.id, label: headingFor(section) }))
    .filter((entry): entry is { id: string; label: string } => entry.label !== null);

  return (
    <div
      className="mx-auto grid max-w-7xl gap-10 px-4 py-10 xl:grid-cols-[14rem_minmax(0,1fr)_16rem]"
      style={{ "--cat": `#${category.accentHex}` } as React.CSSProperties}
    >
      <MarkOpened conceptID={concept.id} />

      {/* Left rail: siblings. Hidden below xl, where the category page serves this purpose. */}
      <nav aria-label={`${category.name} concepts`} className="hidden xl:block">
        <div className="sticky top-24">
          <p className="caption font-semibold tracking-wide text-text-2 uppercase">{category.name}</p>
          <ul className="mt-3 space-y-1 border-l border-separator">
            {siblings.map((sibling) => {
              const current = sibling.id === concept.id;
              return (
                <li key={sibling.id}>
                  <Link
                    href={`/learn/${category.id}/${sibling.id}`}
                    aria-current={current ? "page" : undefined}
                    className={`-ml-px block border-l-2 py-1.5 pl-3 text-[0.9375rem] ${
                      current
                        ? "border-cat font-semibold text-text"
                        : "border-transparent text-text-2 hover:text-text"
                    }`}
                  >
                    {sibling.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <article className="min-w-0 max-w-[68ch]">
        <nav aria-label="Breadcrumb" className="caption text-text-2">
          <Link href="/learn" className="hover:text-text">
            Learn
          </Link>
          <span aria-hidden="true"> / </span>
          <Link href={`/learn/${category.id}`} className="hover:text-text">
            {category.name}
          </Link>
        </nav>

        <h1 className="title-xl mt-3">{concept.title}</h1>
        <p className="mt-2 text-lg text-text-2">{concept.subtitle}</p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <DifficultyBadge difficulty={concept.difficulty} />
          <ConceptMastery conceptID={concept.id} />
          <span className="caption text-text-2">{concept.estimatedMinutes} min</span>
        </div>

        {/* On narrow screens the contents collapse rather than taking a column. */}
        {toc.length > 0 && (
          <details className="card mt-6 p-4 xl:hidden">
            <summary className="caption cursor-pointer font-semibold">On this page</summary>
            <ul className="mt-2 space-y-1">
              {toc.map((entry) => (
                <li key={entry.id}>
                  <a href={`#${entry.id}`} className="text-[0.9375rem] text-text-2 hover:text-text">
                    {entry.label}
                  </a>
                </li>
              ))}
            </ul>
          </details>
        )}

        <div className="mt-2">
          <ConceptSections sections={concept.sections} />
        </div>

        {concept.prerequisiteIDs.length > 0 && (
          <section className="mt-12">
            <h2 className="title-m">Read these first</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {concept.prerequisiteIDs.map((id) => {
                const prerequisite = content.conceptByID.get(id);
                if (!prerequisite) return null;
                return (
                  <li key={id}>
                    <Link
                      href={`/learn/${prerequisite.categoryID}/${prerequisite.id}`}
                      className="caption rounded-full border border-separator px-3 py-1.5 hover:border-accent"
                    >
                      {prerequisite.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {concept.relatedConceptIDs.length > 0 && (
          <section className="mt-8">
            <h2 className="title-m">Related</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {concept.relatedConceptIDs.map((id) => {
                const related = content.conceptByID.get(id);
                if (!related) return null;
                return (
                  <li key={id}>
                    <Link
                      href={`/learn/${related.categoryID}/${related.id}`}
                      className="caption rounded-full border border-separator px-3 py-1.5 hover:border-accent"
                    >
                      {related.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* The right rail is hidden below xl, so the actions need a home in the flow. */}
        <div className="mt-12 xl:hidden">
          <ConceptActions conceptID={concept.id} />
        </div>

        <nav className="mt-12 grid gap-3 sm:grid-cols-2" aria-label="Concept navigation">
          {prev ? (
            <Link href={`/learn/${prev.categoryID}/${prev.id}`} className="card p-4 hover:border-accent">
              <span className="caption text-text-2">Previous</span>
              <span className="title-s mt-1 block">{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link
              href={`/learn/${next.categoryID}/${next.id}`}
              className="card p-4 text-right hover:border-accent"
            >
              <span className="caption text-text-2">Next</span>
              <span className="title-s mt-1 block">{next.title}</span>
            </Link>
          )}
        </nav>
      </article>

      {/* Right rail: contents and actions. */}
      <aside className="hidden xl:block">
        <div className="sticky top-24 space-y-6">
          {toc.length > 0 && (
            <nav aria-label="On this page">
              <p className="caption font-semibold tracking-wide text-text-2 uppercase">On this page</p>
              <ul className="mt-3 space-y-1 border-l border-separator">
                {toc.map((entry) => (
                  <li key={entry.id}>
                    <a
                      href={`#${entry.id}`}
                      className="-ml-px block border-l-2 border-transparent py-1 pl-3 text-[0.9375rem] text-text-2 hover:border-accent hover:text-text"
                    >
                      {entry.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          <ConceptActions conceptID={concept.id} />
        </div>
      </aside>
    </div>
  );
}
