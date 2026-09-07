"use client";

import { useState } from "react";
import type { GradeLevelDepthRow, ReviewGradeLevelDepthPayload } from "@/lib/types";

export function GradeLevelDepthReview({
  payload,
  onSubmit,
  submitting,
}: {
  payload: ReviewGradeLevelDepthPayload;
  onSubmit: (value: GradeLevelDepthRow[]) => void;
  submitting: boolean;
}) {
  const [rows, setRows] = useState<GradeLevelDepthRow[]>(payload.grade_level_depth_validation);

  function toggleMatches(index: number) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, matches: !r.matches } : r)));
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold">Validate grade-level depth (SEP/DCI/CCC)</h3>
        <p className="text-xs text-neutral-500 mt-1">{payload.instructions}</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-xs">
          <thead className="bg-neutral-50 dark:bg-neutral-900 text-left">
            <tr>
              <th className="p-2">SC standard</th>
              <th className="p-2">Grade</th>
              <th className="p-2">Dimension</th>
              <th className="p-2">Expected depth</th>
              <th className="p-2">Validated depth</th>
              <th className="p-2">Matches?</th>
              <th className="p-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={`${row.sc_code}-${row.dimension}-${i}`} className="border-t border-neutral-200 dark:border-neutral-800">
                <td className="p-2">{row.sc_code}</td>
                <td className="p-2">{row.grade}</td>
                <td className="p-2 font-medium">{row.dimension}</td>
                <td className="p-2 max-w-xs">{row.expected_depth}</td>
                <td className="p-2 max-w-xs">{row.validated_depth}</td>
                <td className="p-2">
                  <input type="checkbox" checked={row.matches} onChange={() => toggleMatches(i)} />
                </td>
                <td className="p-2 max-w-xs">{row.notes}</td>
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
        {submitting ? "Submitting…" : "Confirm grade-level depth validation"}
      </button>
    </div>
  );
}
