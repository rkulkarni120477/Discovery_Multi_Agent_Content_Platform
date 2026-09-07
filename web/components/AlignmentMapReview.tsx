"use client";

import { useState } from "react";
import type { AlignmentRow, ReviewAlignmentMapPayload } from "@/lib/types";

const COVERAGE_STATUSES = ["Fully addressed", "Partially addressed", "Not addressed"];

const STATUS_STYLES: Record<string, string> = {
  "Fully addressed": "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  "Partially addressed": "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  "Not addressed": "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export function AlignmentMapReview({
  payload,
  onSubmit,
  submitting,
}: {
  payload: ReviewAlignmentMapPayload;
  onSubmit: (value: AlignmentRow[]) => void;
  submitting: boolean;
}) {
  const [rows, setRows] = useState<AlignmentRow[]>(payload.alignment_map);

  function updateStatus(index: number, coverage_status: string) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, coverage_status } : r)));
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold">Validate the standards coverage classifications</h3>
        <p className="text-xs text-neutral-500 mt-1">{payload.instructions}</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-xs">
          <thead className="bg-neutral-50 dark:bg-neutral-900 text-left">
            <tr>
              <th className="p-2">Standard</th>
              <th className="p-2">Lesson</th>
              <th className="p-2">Coverage</th>
              <th className="p-2">Evidence</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={`${row.oregon_id}-${i}`} className="border-t border-neutral-200 dark:border-neutral-800">
                <td className="p-2">{row.oregon_id}</td>
                <td className="p-2">{row.lesson_id}</td>
                <td className="p-2">
                  <select
                    value={row.coverage_status}
                    onChange={(e) => updateStatus(i, e.target.value)}
                    className={`rounded p-1 border border-neutral-300 dark:border-neutral-700 ${
                      STATUS_STYLES[row.coverage_status] ?? ""
                    }`}
                  >
                    {COVERAGE_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2 max-w-sm">{row.evidence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={() => onSubmit(rows)}
        disabled={submitting}
        className="w-fit rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-4 py-2 text-sm font-semibold disabled:opacity-40"
      >
        {submitting ? "Submitting…" : "Confirm alignment map"}
      </button>
    </div>
  );
}
