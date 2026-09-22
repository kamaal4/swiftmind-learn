import type { Metadata } from "next";
import { ProgressDashboard } from "@/components/ProgressDashboard";

export const metadata: Metadata = {
  title: "Progress",
  description: "Your streak, mastery by category, review queue and bookmarks.",
};

export default function ProgressPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="title-xl">Progress</h1>
      <p className="mt-2 max-w-[60ch] text-text-2">
        Mastery is a moving average of your recent answers, and reviews follow a 1 → 3 → 7 → 16 → 35
        day schedule. Get something wrong and it comes back tomorrow.
      </p>

      <div className="mt-10">
        <ProgressDashboard />
      </div>
    </div>
  );
}
