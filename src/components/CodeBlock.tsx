import type { ConceptSection } from "@/content/schema";
import { highlight, tokenClass } from "@/lib/highlight";
import { CopyButton } from "./CopyButton";
import { InlineMarkdown } from "./MarkdownText";

type Block = Extract<ConceptSection, { type: "code" }>;

const COLLAPSED_LINES = 14;

// Highlighting happens here, in a server component, so the tokeniser never ships to the
// browser — only the resulting spans do. Collapse is a native <details>, so it needs no JS.
export function CodeBlock({ block }: { block: Block }) {
  const lines = highlight(block.code);
  const isLong = lines.length > COLLAPSED_LINES;

  const code = (
    <pre className="overflow-x-auto p-4 font-mono text-[0.875rem] leading-[1.6]">
      <code>
        {lines.map((tokens, i) => (
          <span key={i} className="block">
            {tokens.map((token, j) => (
              <span key={j} className={tokenClass[token.kind]}>
                {token.text}
              </span>
            ))}
            {tokens.length === 0 ? "\n" : ""}
          </span>
        ))}
      </code>
    </pre>
  );

  return (
    <figure className="my-8">
      {block.caption && (
        <figcaption className="caption mb-2 text-text-2">
          <InlineMarkdown text={block.caption} />
        </figcaption>
      )}
      <div className="relative overflow-hidden rounded-xl bg-code-bg">
        <div className="absolute top-2 right-2 z-10">
          <CopyButton text={block.code} />
        </div>
        {isLong ? (
          <details className="group">
            <summary className="cursor-pointer list-none">
              <div className="max-h-[22rem] overflow-hidden group-open:max-h-none">{code}</div>
              <span className="caption block border-t border-white/10 px-4 py-2 text-[#9DC4FF]">
                <span className="group-open:hidden">Show all {lines.length} lines</span>
                <span className="hidden group-open:inline">Show less</span>
              </span>
            </summary>
          </details>
        ) : (
          code
        )}
      </div>
    </figure>
  );
}
