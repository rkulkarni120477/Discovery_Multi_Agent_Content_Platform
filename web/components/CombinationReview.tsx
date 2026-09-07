"use client";

import { useState } from "react";
import type { SelectCombinationPayload } from "@/lib/types";

export function CombinationReview({
  payload,
  onSubmit,
  submitting,
}: {
  payload: SelectCombinationPayload;
  onSubmit: (value: { lesson_id: string; strategy_name: string; rationale: string }) => void;
  submitting: boolean;
}) {
  const recommendedKey = `${payload.recommended_combination.lesson_id}::${payload.recommended_combination.strategy_name}`;
  const [selectedKey, setSelectedKey] = useState(recommendedKey);

  const combos = Array.from(
    new Map(
      payload.fit_matrix.map((row) => [
        `${row.lesson_id}::${row.strategy_name}`,
        row,
      ])
    ).values()
  );

  function handleSubmit() {
    const row = combos.find((r) => `${r.lesson_id}::${r.strategy_name}` === selectedKey);
    if (!row) return;
    const isRecommended = selectedKey === recommendedKey;
    onSubmit({
      lesson_id: row.lesson_id,
      strategy_name: row.strategy_name,
      rationale: isRecommended ? payload.recommended_combination.rationale : row.notes,
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold">Select the lesson + literacy strategy combination</h3>
        <p className="text-xs text-neutral-500 mt-1">{payload.instructions}</p>
      </div>

      <div className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 p-3 text-sm">
        <span className="font-medium">AI recommendation: </span>
        {payload.recommended_combination.lesson_id} + {payload.recommended_combination.strategy_name}
        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
          {payload.recommended_combination.rationale}
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-xs">
          <thead className="bg-neutral-50 dark:bg-neutral-900 text-left">
            <tr>
              <th className="p-2"></th>
              <th className="p-2">Lesson</th>
              <th className="p-2">Strategy</th>
              <th className="p-2">Fit</th>
              <th className="p-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {combos.map((row) => {
              const key = `${row.lesson_id}::${row.strategy_name}`;
              return (
                <tr
                  key={key}
                  className="border-t border-neutral-200 dark:border-neutral-800 cursor-pointer"
                  onClick={() => setSelectedKey(key)}
                >
                  <td className="p-2">
                    <input
                      type="radio"
                      checked={selectedKey === key}
                      onChange={() => setSelectedKey(key)}
                    />
                  </td>
                  <td className="p-2">{row.lesson_id}</td>
                  <td className="p-2">{row.strategy_name}</td>
                  <td className="p-2">{row.fit_rating}</td>
                  <td className="p-2 max-w-xs">{row.notes}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-fit rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-4 py-2 text-sm font-semibold disabled:opacity-40"
      >
        {submitting ? "Submitting…" : "Confirm selection"}
      </button>
    </div>
  );
}
