"use client";

import { useState } from "react";
import type { ReviewRevisionPlanPayload, RevisionRow } from "@/lib/types";

export function RevisionPlanReview({
  payload,
  onSubmit,
  submitting,
}: {
  payload: ReviewRevisionPlanPayload;
  onSubmit: (value: RevisionRow[]) => void;
  submitting: boolean;
}) {
  const [included, setIncluded] = useState<boolean[]>(payload.revision_plan.map(() => true));

  function toggleIncluded(index: number) {
    setIncluded((prev) => prev.map((v, i) => (i === index ? !v : v)));
  }

  function handleSubmit() {
    onSubmit(payload.revision_plan.filter((_, i) => included[i]));
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold">Review the planned revisions</h3>
        <p className="text-xs text-neutral-500 mt-1">{payload.instructions}</p>
      </div>

      <div className="flex flex-col gap-3">
        {payload.revision_plan.map((row, i) => (
          <label
            key={row.revision_id}
            className={`rounded-lg border p-3 text-sm ${
              included[i]
                ? "border-neutral-200 dark:border-neutral-800"
                : "border-neutral-200 dark:border-neutral-800 opacity-50"
            }`}
          >
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                className="mt-1"
                checked={included[i]}
                onChange={() => toggleIncluded(i)}
              />
              <div>
                <p className="font-medium">
                  {row.oregon_id} — {row.intervention_type}
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                  {row.description}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Lesson {row.target_lesson_id} · {row.placement_location} · +
                  {row.timing_impact_minutes} min
                </p>
                {row.notes && <p className="text-xs text-neutral-500 mt-0.5">Notes: {row.notes}</p>}
              </div>
            </div>
          </label>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-fit rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-4 py-2 text-sm font-semibold disabled:opacity-40"
      >
        {submitting ? "Submitting…" : "Confirm revision plan"}
      </button>
    </div>
  );
}
