import type { Metadata } from "next";
import Link from "next/link";
import { content } from "@/content";
import { Badge } from "@/components/ui";
import { changeTone, impactTone } from "@/components/release";

export const metadata: Metadata = {
  title: "What's new",
  description:
    "Swift and iOS releases that change how you write code — new features, behaviour changes, deprecations, and what to migrate.",
};

export default function WhatsNewPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="title-xl">What&apos;s new</h1>
      <p className="mt-2 max-w-[60ch] text-text-2">
        The releases that change how you write Swift — what arrived, what changed underneath you,
        what is deprecated, and what you actually need to migrate.
      </p>

      <ul className="mt-10 space-y-4">
        {content.releases.map((release) => (
          <li key={release.id}>
            <Link href={`/whats-new/${release.id}`} className="card block p-5 hover:border-accent">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="neutral">{release.kind === "ios" ? "iOS" : release.kind}</Badge>
                <Badge variant={impactTone[release.impact]} glyph={release.impact === "high" ? "▲" : "•"}>
                  {release.impact} impact
                </Badge>
                <span className="caption ml-auto text-text-2">{release.releasedOn}</span>
              </div>

              <h2 className="title-s mt-3">{release.title}</h2>
              <p className="mt-1 text-[0.9375rem] text-text-2">{release.summary}</p>

              <ul className="mt-4 flex flex-wrap gap-2">
                {release.changes.map((change) => (
                  <li key={change.id}>
                    <Badge variant={changeTone[change.type]}>{change.type}</Badge>
                  </li>
                ))}
              </ul>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
