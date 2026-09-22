import { Fragment } from "react";
import { parseBlocks, parseInline, type Inline } from "@/lib/markdown";

const renderInline = (tokens: Inline[], keyPrefix: string): React.ReactNode =>
  tokens.map((token, i) => {
    const key = `${keyPrefix}-${i}`;
    switch (token.kind) {
      case "code":
        return (
          <code
            key={key}
            className="rounded bg-separator/60 px-1 py-px font-mono text-[0.9em] text-text"
          >
            {token.text}
          </code>
        );
      case "bold":
        return (
          <strong key={key} className="font-semibold">
            {renderInline(token.children, key)}
          </strong>
        );
      default:
        return <Fragment key={key}>{token.text}</Fragment>;
    }
  });

export function MarkdownText({ body, className = "" }: { body: string; className?: string }) {
  return (
    <div className={className}>
      {parseBlocks(body).map((block, i) => {
        const spacing = i > 0 ? "mt-4" : "";

        if (block.kind === "list") {
          const Tag = block.ordered ? "ol" : "ul";
          return (
            <Tag
              key={i}
              className={`${spacing} space-y-2 pl-6 ${block.ordered ? "list-decimal" : "list-disc"}`}
            >
              {block.items.map((item, j) => (
                <li key={j}>{renderInline(item, `${i}-${j}`)}</li>
              ))}
            </Tag>
          );
        }

        return (
          <p key={i} className={spacing || undefined}>
            {renderInline(block.children, String(i))}
          </p>
        );
      })}
    </div>
  );
}

/** Single-line variant for captions and labels, where paragraphs would be wrong. */
export const InlineMarkdown = ({ text }: { text: string }) => <>{renderInline(parseInline(text), "i")}</>;
