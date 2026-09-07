"use client";

import { useState } from "react";
import type { CrosswalkRow, ReviewCrosswalkPayload } from "@/lib/types";

const MATCH_TYPES = [
  "Direct match",
  "Partial overlap",
  "Oregon broader",
  "Oregon narrower",
  "No match",
];

export function CrosswalkReview({
  payload,
  onSubmit,
  submitting,
}: {
  payload: ReviewCrosswalkPayload;
  onSubmit: (value: CrosswalkRow[]) => void;
  submitting: boolean;
}) {
  const [rows, setRows] = useState<CrosswalkRow[]>(payload.crosswalk);
  const [included, setIncluded] = useState<boolean[]>(payload.crosswalk.map(() => true));

  function updateMatchType(index: number, match_type: string) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, match_type } : r)));
  }

  function toggleIncluded(index: number) {
    setIncluded((prev) => prev.map((v, i) => (i === index ? !v : v)));
  }

  function handleSubmit() {
    onSubmit(rows.filter((_, i) => included[i]));
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold">Review the C3-to-state-standards crosswalk</h3>
        <p className="text-xs text-neutral-500 mt-1">{payload.instructions}</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-xs">
          <thead className="bg-neutral-50 dark:bg-neutral-900 text-left">
            <tr>
              <th className="p-2">Include</th>
              <th className="p-2">C3 code</th>
              <th className="p-2">State standard</th>
              <th className="p-2">Match type</th>
              <th className="p-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={`${row.c3_code}-${row.oregon_id}-${i}`} className="border-t border-neutral-200 dark:border-neutral-800">
                <td className="p-2">
                  <input type="checkbox" checked={included[i]} onChange={() => toggleIncluded(i)} />
                </td>
                <td className="p-2">{row.c3_code}</td>
                <td className="p-2">{row.oregon_id}</td>
                <td className="p-2">
                  <select
                    value={row.match_type}
                    onChange={(e) => updateMatchType(i, e.target.value)}
                    disabled={!included[i]}
                    className="rounded border border-neutral-300 dark:border-neutral-700 bg-transparent p-1"
                  >
                    {MATCH_TYPES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2 max-w-xs">{row.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {payload.unmatched_oregon_standards.length > 0 && (
        <div className="text-xs text-neutral-500">
          <span className="font-medium">State standards with no C3 counterpart: </span>
          {payload.unmatched_oregon_standards.join(", ")}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-fit rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-4 py-2 text-sm font-semibold disabled:opacity-40"
      >
        {submitting ? "Submitting…" : "Confirm crosswalk"}
      </button>
    </div>
  );
}
