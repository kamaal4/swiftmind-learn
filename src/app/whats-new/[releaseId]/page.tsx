import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { content } from "@/content";
import { MarkdownText } from "@/components/MarkdownText";
import { changeGlyph, changeTone, impactTone } from "@/components/release";
import { Badge } from "@/components/ui";

export function generateStaticParams() {
  return content.releases.map((release) => ({ releaseId: release.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/whats-new/[releaseId]">): Promise<Metadata> {
  const { releaseId } = await params;
  const release = content.releaseByID.get(releaseId);
  if (!release) return {};
  return { title: release.title, description: release.summary };
}

export default async function ReleasePage({ params }: PageProps<"/whats-new/[releaseId]">) {
  const { releaseId } = await params;
  const release = content.releaseByID.get(releaseId);
  if (!release) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="caption text-text-2">
        <Link href="/whats-new" className="hover:text-text">
          What&apos;s new
        </Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{release.title}</span>
      </nav>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge variant="neutral">{release.kind === "ios" ? "iOS" : release.kind}</Badge>
        <Badge variant={impactTone[release.impact]} glyph={release.impact === "high" ? "▲" : "•"}>
          {release.impact} impact
        </Badge>
        <span className="caption text-text-2">Released {release.releasedOn}</span>
      </div>

      <h1 className="title-xl mt-3">{release.title}</h1>
      <p className="mt-3 max-w-[60ch] text-lg text-text-2">{release.summary}</p>

      <div className="mt-10 space-y-4">
        {release.changes.map((change) => (
          <article key={change.id} className="card p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={changeTone[change.type]} glyph={changeGlyph[change.type]}>
                {change.type}
              </Badge>
            </div>

            <h2 className="title-s mt-3">{change.title}</h2>
            <MarkdownText body={change.detail} className="mt-2 max-w-[62ch]" />

            {change.migration && (
              <div className="mt-4 rounded-xl border-l-[3px] border-accent bg-accent/8 py-3 pr-4 pl-4">
                <p className="caption font-semibold tracking-wide text-accent uppercase">
                  What to do
                </p>
                <MarkdownText body={change.migration} className="mt-1 text-[0.9375rem]" />
              </div>
            )}

            {change.conceptIDs.length > 0 && (
              <div className="mt-4">
                <p className="caption text-text-2">Affects</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {change.conceptIDs.map((id) => {
                    const concept = content.conceptByID.get(id);
                    if (!concept) return null;
                    return (
                      <li key={id}>
                        <Link
                          href={`/learn/${concept.categoryID}/${concept.id}`}
                          className="caption rounded-full border border-separator px-3 py-1.5 hover:border-accent"
                        >
                          {concept.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {change.link && (
              <a
                href={change.link}
                target="_blank"
                rel="noreferrer"
                className="caption mt-4 inline-block text-accent underline underline-offset-4"
              >
                Read the proposal
              </a>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
