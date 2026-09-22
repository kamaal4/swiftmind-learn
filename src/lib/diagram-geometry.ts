import type { DiagramEdge, DiagramNode } from "@/content/schema";

// Ported from SwiftMind/DesignSystem/DiagramView.swift. Kept pure and free of React so the
// awkward parts — endpoint pullback and the parallel offset for reciprocal edges — are
// directly testable.

export const VIEW_W = 1000;
export const VIEW_H = 620;

/** Calibration knobs. Content coordinates are normalised, so these are the only tuning the
 *  renderer needs; adjust them if node boxes get much larger or smaller. */
export const NODE_INSET = 0.1; // keeps nodes at 0 or 1 off the canvas edge
export const ENDPOINT_PULLBACK = 74; // stop the line at the node's edge, not under its label
export const PARALLEL_SPACING = 58; // fan reciprocal edges apart
export const LABEL_LIFT = 26;

export type Point = { x: number; y: number };

export const nodePoint = (node: Pick<DiagramNode, "x" | "y">): Point => ({
  x: (NODE_INSET + node.x * (1 - 2 * NODE_INSET)) * VIEW_W,
  y: (NODE_INSET + node.y * (1 - 2 * NODE_INSET)) * VIEW_H,
});

/**
 * Two nodes that reference each other — a retain cycle being the obvious case — produce
 * edges on the same line. Fanning them out perpendicular keeps both the arrows and their
 * labels readable instead of overprinting each other.
 */
export const parallelOffset = (edge: DiagramEdge, edges: readonly DiagramEdge[]): number => {
  const sameLine = edges.filter(
    (e) =>
      (e.from === edge.from && e.to === edge.to) || (e.from === edge.to && e.to === edge.from),
  );
  if (sameLine.length <= 1) return 0;
  const index = sameLine.findIndex((e) => e.id === edge.id);
  if (index < 0) return 0;
  return (index - (sameLine.length - 1) / 2) * PARALLEL_SPACING;
};

export type EdgeGeometry = { start: Point; end: Point; arrowhead: string; label: Point };

export const edgeGeometry = (
  edge: Pick<DiagramEdge, "from" | "to">,
  from: Point,
  to: Point,
  offset: number,
): EdgeGeometry => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const unit = { x: dx / length, y: dy / length };
  const perpendicular = { x: -unit.y, y: unit.x };

  // The perpendicular flips with the edge's direction, so an A→B and a B→A edge would
  // otherwise be nudged the same way and land back on top of each other. Flipping by a
  // canonical ordering of the endpoints makes the offset geometric, not direction-relative.
  const flip = edge.from <= edge.to ? 1 : -1;
  const sideways = { x: perpendicular.x * flip, y: perpendicular.y * flip };
  const shift = { x: sideways.x * offset, y: sideways.y * offset };

  const start = {
    x: from.x + unit.x * ENDPOINT_PULLBACK + shift.x,
    y: from.y + unit.y * ENDPOINT_PULLBACK + shift.y,
  };
  const end = {
    x: to.x - unit.x * ENDPOINT_PULLBACK + shift.x,
    y: to.y - unit.y * ENDPOINT_PULLBACK + shift.y,
  };

  const wing = 16;
  const arrowhead = [
    `${end.x},${end.y}`,
    `${end.x - unit.x * wing + perpendicular.x * wing * 0.6},${end.y - unit.y * wing + perpendicular.y * wing * 0.6}`,
    `${end.x - unit.x * wing - perpendicular.x * wing * 0.6},${end.y - unit.y * wing - perpendicular.y * wing * 0.6}`,
  ].join(" ");

  // Push the label clear of its own line, on the side that line was fanned to.
  const lift = offset + (offset < 0 ? -LABEL_LIFT : LABEL_LIFT);
  const label = {
    x: (start.x + end.x) / 2 + sideways.x * lift - shift.x,
    y: (start.y + end.y) / 2 + sideways.y * lift - shift.y,
  };

  return { start, end, arrowhead, label };
};

export const edgeStroke: Record<DiagramEdge["style"], { className: string; dash?: string; width: number }> = {
  strong: { className: "stroke-accent", width: 2.5 },
  weak: { className: "stroke-success", dash: "10 8", width: 2.5 },
  unowned: { className: "stroke-warning", dash: "4 6", width: 2.5 },
  flow: { className: "stroke-text-2", width: 2 },
  dashed: { className: "stroke-text-2", dash: "8 8", width: 2 },
};

export const nodeBox: Record<DiagramNode["style"], string> = {
  object: "bg-accent/16 border-accent/50 rounded-lg",
  owner: "bg-success/16 border-success/50 rounded-lg",
  closure: "bg-warning/16 border-warning/50 rounded-lg",
  actorBox: "bg-accent/22 border-accent/50 rounded-xl",
  thread: "bg-success/12 border-success/50 rounded-lg",
  view: "bg-surface border-separator rounded-lg",
  note: "bg-separator/50 border-separator rounded-full",
};
