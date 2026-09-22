import { content } from "@/content";
import type { ConceptSection } from "@/content/schema";
import { CodeBlock } from "./CodeBlock";
import { Diagram } from "./Diagram";
import { MarkdownText } from "./MarkdownText";

// Mirrors SectionView in the iOS app: one ordered list of typed sections, rendered
// generically. Adding a section kind means adding a case here and nowhere else.

const calloutStyles = {
  mistake: { tone: "border-danger text-danger", fill: "bg-danger/10", glyph: "✕", heading: "Common mistake" },
  warning: { tone: "border-warning text-warning", fill: "bg-warning/10", glyph: "!", heading: "Watch out" },
  tip: { tone: "border-success text-success", fill: "bg-success/10", glyph: "★", heading: "Tip" },
  note: { tone: "border-accent text-accent", fill: "bg-accent/10", glyph: "i", heading: "Note" },
} as const;

const Heading = ({ children }: { children: React.ReactNode }) => (
  <h2 className="title-m mt-10 mb-3">{children}</h2>
);

function Section({ section }: { section: ConceptSection }) {
  switch (section.type) {
    case "explanation":
      return (
        <>
          {section.heading && <Heading>{section.heading}</Heading>}
          <MarkdownText body={section.body} className="mt-4" />
        </>
      );

    case "analogy":
      return (
        <aside className="my-8 rounded-r-xl border-l-[3px] border-accent bg-accent/8 py-4 pr-4 pl-5">
          <p className="caption mb-2 font-semibold tracking-wide text-accent uppercase">
            {section.heading ?? "Analogy"}
          </p>
          <MarkdownText body={section.body} />
        </aside>
      );

    case "underTheHood":
      return (
        <>
          <Heading>{section.heading ?? "Under the hood"}</Heading>
          <MarkdownText body={section.body} />
        </>
      );

    case "keyTakeaway":
      return (
        <section className="card my-8 border-accent/30 bg-accent/8 p-5">
          <p className="caption mb-2 font-semibold tracking-wide text-accent uppercase">
            {section.heading ?? "Key takeaway"}
          </p>
          <MarkdownText body={section.body} />
        </section>
      );

    case "code":
      return <CodeBlock block={section} />;

    case "diagram":
      return <Diagram diagram={section} />;

    case "callout": {
      const style = calloutStyles[section.style];
      return (
        <aside className={`my-8 rounded-r-xl border-l-[3px] py-4 pr-4 pl-5 ${style.tone} ${style.fill}`}>
          <p className="caption mb-2 flex items-center gap-2 font-semibold">
            <span aria-hidden="true">{style.glyph}</span>
            {section.title || style.heading}
          </p>
          <MarkdownText body={section.body} className="text-text" />
        </aside>
      );
    }

    case "quickCheck": {
      const question = content.quizByID.get(section.refID);
      if (!question) return null;
      const answer = question.options.find((o) => o.id === question.correctOptionID);
      return (
        <section className="card my-8 p-5">
          <p className="caption mb-3 font-semibold tracking-wide text-text-2 uppercase">Quick check</p>
          <MarkdownText body={question.prompt} className="title-s" />
          <ul className="mt-4 space-y-2">
            {question.options.map((option) => (
              <li
                key={option.id}
                className="rounded-xl border border-separator px-4 py-2.5 text-[0.9375rem]"
              >
                {option.text}
              </li>
            ))}
          </ul>
          <details className="mt-4">
            <summary className="caption cursor-pointer font-semibold text-accent">
              Reveal answer
            </summary>
            <div className="mt-3 rounded-xl bg-success/10 p-4">
              <p className="font-semibold text-success">
                <span aria-hidden="true">✓ </span>
                {answer?.text}
              </p>
              <MarkdownText body={question.explanation} className="mt-2 text-[0.9375rem]" />
            </div>
          </details>
        </section>
      );
    }

    case "trivia": {
      const item = content.triviaByID.get(section.refID);
      if (!item) return null;
      return (
        <aside className="my-8 rounded-xl border border-separator bg-surface p-5">
          <p className="caption mb-2 font-semibold tracking-wide text-text-2 uppercase">
            Did you know
          </p>
          <MarkdownText body={item.text} />
          {item.detail && <MarkdownText body={item.detail} className="mt-2 text-text-2" />}
        </aside>
      );
    }

    case "interview": {
      const question = content.interviewByID.get(section.refID);
      if (!question) return null;
      return (
        <section className="card my-8 p-5">
          <p className="caption mb-2 font-semibold tracking-wide text-text-2 uppercase">
            Interview question
          </p>
          <MarkdownText body={question.question} className="title-s" />
          <details className="mt-4">
            <summary className="caption cursor-pointer font-semibold text-accent">
              Think first, then reveal
            </summary>
            <MarkdownText body={question.answer} className="mt-3" />
            <p className="caption mt-4 font-semibold text-text-2">What an interviewer listens for</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[0.9375rem]">
              {question.keyPoints.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </details>
        </section>
      );
    }

    // Forward compatibility: a section kind this build doesn't know is skipped, not crashed on.
    default:
      return null;
  }
}

export function ConceptSections({ sections }: { sections: readonly ConceptSection[] }) {
  return (
    <>
      {sections.map((section) => (
        // scroll-mt clears the sticky header when a table-of-contents link jumps here.
        <div key={section.id} id={section.id} className="scroll-mt-24">
          <Section section={section} />
        </div>
      ))}
    </>
  );
}
