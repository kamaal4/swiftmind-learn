"use client";

import { useState } from "react";
import type { Diagram as DiagramData } from "@/content/schema";
import {
  VIEW_H,
  VIEW_W,
  edgeGeometry,
  edgeStroke,
  nodeBox,
  nodePoint,
  parallelOffset,
} from "@/lib/diagram-geometry";

// Diagrams are data, not images: they scale, follow the theme, and can be walked a step at
// a time. Edges are SVG; nodes are real DOM text on top, so labels stay selectable,
// translatable and readable by a screen reader.

export function Diagram({ diagram }: { diagram: DiagramData }) {
  const [step, setStep] = useState(0);
  const current = diagram.steps[step];

  // With no step selected everything is at full strength; inside a step, only the
  // highlighted parts are.
  const nodeOn = (id: string) => !current || current.nodeIDs.includes(id);
  const edgeOn = (id: string) => !current || current.edgeIDs.includes(id);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setStep((i) => Math.min(i + 1, diagram.steps.length - 1));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setStep((i) => Math.max(i - 1, 0));
    }
  };

  return (
    <figure className="my-8 rounded-2xl border border-separator bg-surface-raised p-4">
      <figcaption className="title-s mb-3">{diagram.title}</figcaption>

      {/* Node boxes are real DOM text at a fixed size, so below ~34rem they collide rather
          than scale. Scrolling the canvas keeps the labels legible instead of shrinking them
          past readability. */}
      <div className="-mx-1 overflow-x-auto px-1">
        <div
          className="relative w-full min-w-[34rem]"
          style={{ aspectRatio: `${VIEW_W} / ${VIEW_H}` }}
          tabIndex={0}
          role="group"
          aria-describedby={`${diagram.id}-alt`}
          onKeyDown={onKeyDown}
        >
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            {diagram.edges.map((edge) => {
              const from = diagram.nodes.find((n) => n.id === edge.from);
              const to = diagram.nodes.find((n) => n.id === edge.to);
              if (!from || !to) return null;

              const geo = edgeGeometry(
                edge,
                nodePoint(from),
                nodePoint(to),
                parallelOffset(edge, diagram.edges),
              );
              const stroke = edgeStroke[edge.style];
              const on = edgeOn(edge.id);

              return (
                <g
                  key={edge.id}
                  className={`transition-opacity duration-200 ${on ? "opacity-100" : "opacity-25"}`}
                >
                  <line
                    x1={geo.start.x}
                    y1={geo.start.y}
                    x2={geo.end.x}
                    y2={geo.end.y}
                    className={stroke.className}
                    strokeWidth={stroke.width}
                    strokeDasharray={stroke.dash}
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                  <polygon
                    points={geo.arrowhead}
                    className={stroke.className.replace("stroke-", "fill-")}
                  />
                  {edge.label && (
                    <text
                      x={geo.label.x}
                      y={geo.label.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className={`${stroke.className.replace("stroke-", "fill-")} text-[20px]`}
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {diagram.nodes.map((node) => {
            const point = nodePoint(node);
            const on = nodeOn(node.id);
            return (
              <div
                key={node.id}
                className={`absolute -translate-x-1/2 -translate-y-1/2 border px-3 py-1.5 text-center transition-opacity duration-200 ${nodeBox[node.style]} ${on ? "opacity-100" : "opacity-30"}`}
                style={{
                  left: `${(point.x / VIEW_W) * 100}%`,
                  top: `${(point.y / VIEW_H) * 100}%`,
                }}
              >
                <span className="caption block font-semibold text-text">{node.label}</span>
                {node.detail && <span className="caption block text-text-2">{node.detail}</span>}
              </div>
            );
          })}
        </div>
      </div>

      <p id={`${diagram.id}-alt`} className="sr-only">
        {diagram.altText}
      </p>

      {diagram.steps.length > 0 && (
        <div className="mt-4">
          <p className="min-h-[3rem] text-text-2" aria-live="polite">
            {current?.caption}
          </p>

          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep((i) => Math.max(0, i - 1))}
              disabled={step === 0}
              className="rounded-lg border border-separator px-3 py-1.5 text-accent disabled:opacity-40"
            >
              <span aria-hidden="true">←</span>
              <span className="sr-only">Previous step</span>
            </button>

            <span className="caption flex-1 text-center text-text-2">
              Step {step + 1} of {diagram.steps.length}
            </span>

            <button
              type="button"
              onClick={() => setStep((i) => Math.min(diagram.steps.length - 1, i + 1))}
              disabled={step === diagram.steps.length - 1}
              className="rounded-lg border border-separator px-3 py-1.5 text-accent disabled:opacity-40"
            >
              <span aria-hidden="true">→</span>
              <span className="sr-only">Next step</span>
            </button>
          </div>

          {/* The whole sequence is readable without stepping through it. */}
          <ol className="sr-only">
            {diagram.steps.map((s) => (
              <li key={s.id}>{s.caption}</li>
            ))}
          </ol>
        </div>
      )}
    </figure>
  );
}
