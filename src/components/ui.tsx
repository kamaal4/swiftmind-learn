import type { Difficulty, InterviewLevel } from "@/content/schema";
import type { MasteryState } from "@/progress/types";

// Plain markup rather than components wherever a CSS class would do. These exist because
// they carry a rule — chiefly that state always pairs a colour with a word or a glyph.

const tone = {
  neutral: "text-text-2 border-separator bg-surface",
  accent: "text-accent border-accent/30 bg-accent/12",
  success: "text-success border-success/30 bg-success/12",
  warning: "text-warning border-warning/30 bg-warning/12",
  danger: "text-danger border-danger/30 bg-danger/12",
} as const;

export type Tone = keyof typeof tone;

export function Badge({
  children,
  variant = "neutral",
  glyph,
}: {
  children: React.ReactNode;
  variant?: Tone;
  glyph?: string;
}) {
  return (
    <span
      className={`caption inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 ${tone[variant]}`}
    >
      {glyph && <span aria-hidden="true">{glyph}</span>}
      {children}
    </span>
  );
}

const difficultyTone: Record<Difficulty, Tone> = {
  beginner: "success",
  intermediate: "accent",
  advanced: "warning",
  senior: "danger",
};

export const DifficultyBadge = ({ difficulty }: { difficulty: Difficulty }) => (
  <Badge variant={difficultyTone[difficulty]}>
    {difficulty[0].toUpperCase() + difficulty.slice(1)}
  </Badge>
);

const levelTone: Record<InterviewLevel, Tone> = {
  junior: "success",
  mid: "accent",
  senior: "warning",
  staff: "danger",
};

export const LevelBadge = ({ level }: { level: InterviewLevel }) => (
  <Badge variant={levelTone[level]}>{level[0].toUpperCase() + level.slice(1)}</Badge>
);

// Colour alone never signals state, so every mastery state carries a glyph and a word.
export const mastery: Record<MasteryState, { label: string; glyph: string; variant: Tone }> = {
  new: { label: "Not started", glyph: "○", variant: "neutral" },
  learning: { label: "Learning", glyph: "◐", variant: "warning" },
  review: { label: "In review", glyph: "◑", variant: "accent" },
  mastered: { label: "Mastered", glyph: "✓", variant: "success" },
};

export const MasteryBadge = ({ state }: { state: MasteryState }) => (
  <Badge variant={mastery[state].variant} glyph={mastery[state].glyph}>
    {mastery[state].label}
  </Badge>
);

/** The percentage is always written out as text — the bar alone would be colour-only. */
export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-2 flex-1 overflow-hidden rounded-full bg-separator"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progress"}
      >
        <div className="h-full rounded-full bg-cat transition-[width] duration-200" style={{ width: `${pct}%` }} />
      </div>
      <span className="caption tabular-nums text-text-2">{pct}%</span>
    </div>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-4">
      <h2 className="title-m">{title}</h2>
      {action}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="card p-8 text-center">
      <p className="title-s">{title}</p>
      <p className="mt-1 text-text-2">{body}</p>
    </div>
  );
}

export function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div>
      <p className="stat tabular-nums">{value}</p>
      <p className="caption text-text-2">{label}</p>
    </div>
  );
}
