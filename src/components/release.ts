import type { Release, ReleaseChange } from "@/content/schema";
import type { Tone } from "./ui";

export const impactTone: Record<Release["impact"], Tone> = {
  high: "danger",
  medium: "warning",
  low: "neutral",
};

export const changeTone: Record<ReleaseChange["type"], Tone> = {
  new: "success",
  changed: "accent",
  deprecated: "warning",
  removed: "danger",
};

export const changeGlyph: Record<ReleaseChange["type"], string> = {
  new: "+",
  changed: "~",
  deprecated: "!",
  removed: "−",
};
