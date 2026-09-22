import Link from "next/link";
import { content } from "@/content";
import { ContinuePanel, ReviewPanel, StreakPanel } from "@/components/HomePanels";
import { CategoryProgress } from "@/components/progress-islands";
import { Badge, SectionHeader } from "@/components/ui";
import { impactTone } from "@/components/release";

export default function Home() {
  const latest = content.releases.slice(0, 2);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <section className="max-w-[46ch]">
        <h1 className="title-xl">Understand iOS. Don&apos;t just memorise it.</h1>
        <p className="mt-4 text-lg text-text-2">
          Every concept is a structured lesson — a plain-English explanation, a real-world analogy, a
          diagram you can step through, the code, the common mistake, and the interview question
          behind it.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/learn"
            className="rounded-xl bg-accent px-5 py-2.5 font-medium text-white transition-opacity hover:opacity-90"
          >
            Start learning
          </Link>
          <Link
            href="/quiz/daily"
            className="rounded-xl border border-separator px-5 py-2.5 font-medium hover:border-accent"
          >
            Today&apos;s quiz
          </Link>
        </div>
      </section>

      <div className="mt-14 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <ContinuePanel />
          <ReviewPanel />

          <section>
            <SectionHeader
              title="Tracks"
              action={
                <Link href="/learn" className="caption text-accent underline underline-offset-4">
                  All concepts
                </Link>
              }
            />
            <ul className="grid gap-3 sm:grid-cols-2">
              {content.categories.map((category) => (
                <li
                  key={category.id}
                  style={{ "--cat": `#${category.accentHex}` } as React.CSSProperties}
                >
                  <Link href={`/learn/${category.id}`} className="card block p-4 hover:border-cat">
                    <div className="flex items-center gap-3">
                      <span className="h-8 w-1 shrink-0 rounded-full bg-cat" aria-hidden="true" />
                      <span className="title-s">{category.name}</span>
                      <span className="caption ml-auto text-text-2">
                        {content.conceptsIn(category.id).length}
                      </span>
                    </div>
                    <div className="mt-3">
                      <CategoryProgress categoryID={category.id} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-6">
          <StreakPanel />

          <section className="card p-6">
            <p className="caption font-semibold tracking-wide text-text-2 uppercase">What&apos;s new</p>
            <ul className="mt-3 space-y-4">
              {latest.map((release) => (
                <li key={release.id}>
                  <Link href={`/whats-new/${release.id}`} className="block hover:text-accent">
                    <Badge variant={impactTone[release.impact]}>{release.impact} impact</Badge>
                    <p className="title-s mt-2">{release.title}</p>
                    <p className="caption mt-1 line-clamp-2 text-text-2">{release.summary}</p>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/whats-new"
              className="caption mt-4 inline-block text-accent underline underline-offset-4"
            >
              All releases
            </Link>
          </section>

          <section className="card p-6">
            <p className="caption font-semibold tracking-wide text-text-2 uppercase">
              Interview prep
            </p>
            <p className="mt-2 text-text-2">
              {content.interview.length} questions from junior to staff level, with what the
              interviewer is listening for.
            </p>
            <Link
              href="/interview"
              className="caption mt-4 inline-block text-accent underline underline-offset-4"
            >
              Open interview prep
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
