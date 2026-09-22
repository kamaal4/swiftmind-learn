import assert from "node:assert/strict";
import test from "node:test";
import type { DiagramEdge } from "@/content/schema";
import {
  ENDPOINT_PULLBACK,
  PARALLEL_SPACING,
  VIEW_H,
  VIEW_W,
  edgeGeometry,
  nodePoint,
  parallelOffset,
} from "./diagram-geometry.ts";

const edge = (id: string, from: string, to: string): DiagramEdge => ({
  id,
  from,
  to,
  style: "strong",
});

test("normalised coordinates are inset so edge nodes are not clipped", () => {
  assert.deepEqual(nodePoint({ x: 0, y: 0 }), { x: 0.1 * VIEW_W, y: 0.1 * VIEW_H });
  assert.deepEqual(nodePoint({ x: 1, y: 1 }), { x: 0.9 * VIEW_W, y: 0.9 * VIEW_H });
  assert.deepEqual(nodePoint({ x: 0.5, y: 0.5 }), { x: VIEW_W / 2, y: VIEW_H / 2 });
});

test("a lone edge is not offset", () => {
  const edges = [edge("e1", "a", "b"), edge("e2", "b", "c")];
  assert.equal(parallelOffset(edges[0], edges), 0);
});

test("reciprocal edges fan apart symmetrically", () => {
  // The retain-cycle case: a→b and b→a must not draw on top of each other.
  const edges = [edge("e1", "a", "b"), edge("e2", "b", "a")];
  const first = parallelOffset(edges[0], edges);
  const second = parallelOffset(edges[1], edges);

  assert.equal(first, -PARALLEL_SPACING / 2);
  assert.equal(second, PARALLEL_SPACING / 2);
  assert.equal(first + second, 0);
});

test("endpoints are pulled back from both nodes by the same amount", () => {
  const from = { x: 100, y: 300 };
  const to = { x: 900, y: 300 };
  const { start, end } = edgeGeometry(edge("e1", "a", "b"), from, to, 0);

  assert.equal(start.x, 100 + ENDPOINT_PULLBACK);
  assert.equal(end.x, 900 - ENDPOINT_PULLBACK);
  assert.equal(start.y, 300);
  assert.equal(end.y, 300);
});

test("reciprocal edges are displaced to opposite sides of the same line", () => {
  const a = { x: 100, y: 300 };
  const b = { x: 900, y: 300 };
  const edges = [edge("e1", "a", "b"), edge("e2", "b", "a")];

  const forward = edgeGeometry(edges[0], a, b, parallelOffset(edges[0], edges));
  const backward = edgeGeometry(edges[1], b, a, parallelOffset(edges[1], edges));

  // Canonical endpoint ordering makes the offset geometric rather than direction-relative,
  // so the two lines end up on genuinely different sides.
  assert.notEqual(forward.start.y, backward.start.y);
  assert.ok(Math.abs(forward.start.y - backward.start.y) >= PARALLEL_SPACING - 0.001);
});

test("a zero-length edge does not divide by zero", () => {
  const p = { x: 500, y: 500 };
  const { start, end } = edgeGeometry(edge("e1", "a", "a"), p, p, 0);
  assert.ok(Number.isFinite(start.x) && Number.isFinite(start.y));
  assert.ok(Number.isFinite(end.x) && Number.isFinite(end.y));
});
