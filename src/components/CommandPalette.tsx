"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { content } from "@/content";
import { search } from "@/content/search";

type Hit = { href: string; title: string; detail: string; kind: string };

const hits = (query: string): Hit[] => {
  const r = search(query, content);
  return [
    ...r.concepts.map((c) => ({
      href: `/learn/${c.categoryID}/${c.id}`,
      title: c.title,
      detail: c.subtitle,
      kind: content.categoryByID.get(c.categoryID)?.name ?? "Concept",
    })),
    ...r.interviewQuestions.map((q) => ({
      href: `/interview/${q.categoryID}#${q.id}`,
      title: q.question,
      detail: q.keyPoints[0] ?? "",
      kind: "Interview",
    })),
    ...r.trivia.map((t) => ({
      href: `/learn/${t.categoryID}/${t.conceptID}`,
      title: t.text,
      detail: t.detail ?? "",
      kind: "Trivia",
    })),
  ].slice(0, 20);
};

export function SearchButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="flex h-11 items-center gap-2 rounded-xl px-3 text-text-2 transition-colors hover:text-text"
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <kbd className="caption hidden rounded border border-separator px-1.5 py-0.5 font-sans lg:inline">
          ⌘K
        </kbd>
      </button>
      {open && <Palette onClose={() => setOpen(false)} />}
    </>
  );
}

function Palette({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const results = useMemo(() => hits(query), [query]);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const go = useCallback(
    (href: string) => {
      dialog.current?.close();
      router.push(href);
    },
    [router],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      go(results[active].href);
    }
  };

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(e) => e.target === dialog.current && dialog.current.close()}
      className="m-0 w-full max-w-xl rounded-2xl border border-separator bg-surface p-0 text-text backdrop:bg-black/40 sm:mx-auto sm:mt-[12vh]"
    >
      <div onKeyDown={onKeyDown}>
        <input
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            // Reset the highlight here rather than in an effect — a new query means a new list.
            setActive(0);
          }}
          placeholder="Concepts, questions, trivia"
          aria-label="Search concepts, questions and trivia"
          className="w-full border-b border-separator bg-transparent px-4 py-4 outline-none placeholder:text-text-2"
        />

        {query.trim().length >= 2 && (
          <ul className="max-h-[50vh] overflow-y-auto p-2" role="listbox">
            {results.map((hit, i) => (
              <li key={hit.href + hit.title} role="option" aria-selected={i === active}>
                <Link
                  href={hit.href}
                  onClick={() => dialog.current?.close()}
                  onMouseEnter={() => setActive(i)}
                  className={`block rounded-xl px-3 py-2 ${i === active ? "bg-accent/12" : ""}`}
                >
                  <span className="caption block text-text-2">{hit.kind}</span>
                  <span className="line-clamp-1 block">{hit.title}</span>
                  {hit.detail && (
                    <span className="line-clamp-1 block text-[0.9375rem] text-text-2">{hit.detail}</span>
                  )}
                </Link>
              </li>
            ))}
            {results.length === 0 && (
              <li className="px-3 py-6 text-center text-text-2">No matches</li>
            )}
          </ul>
        )}
      </div>
    </dialog>
  );
}
