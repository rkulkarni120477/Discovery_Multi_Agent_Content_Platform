"use client";

import { useState } from "react";
import type { SelectIntegrationPointPayload } from "@/lib/types";

export function IntegrationPointReview({
  payload,
  onSubmit,
  submitting,
}: {
  payload: SelectIntegrationPointPayload;
  onSubmit: (value: { candidate_id: string; location: string; rationale: string }) => void;
  submitting: boolean;
}) {
  const [selectedId, setSelectedId] = useState(payload.recommended_integration_point.candidate_id);

  function handleSubmit() {
    const candidate = payload.candidates.find((c) => c.candidate_id === selectedId);
    if (!candidate) return;
    const isRecommended = selectedId === payload.recommended_integration_point.candidate_id;
    onSubmit({
      candidate_id: candidate.candidate_id,
      location: candidate.location,
      rationale: isRecommended
        ? payload.recommended_integration_point.rationale
        : `Reviewer-selected override: ${candidate.what_strategy_adds}`,
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold">Select the integration point</h3>
        <p className="text-xs text-neutral-500 mt-1">{payload.instructions}</p>
      </div>

      <div className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 p-3 text-sm">
        <span className="font-medium">AI recommendation: </span>
        {payload.recommended_integration_point.location}
        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
          {payload.recommended_integration_point.rationale}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {payload.candidates.map((c) => (
          <label
            key={c.candidate_id}
            className={`rounded-lg border p-3 text-sm cursor-pointer transition-colors ${
              selectedId === c.candidate_id
                ? "border-neutral-900 dark:border-neutral-100"
                : "border-neutral-200 dark:border-neutral-800"
            }`}
          >
            <div className="flex items-start gap-2">
              <input
                type="radio"
                className="mt-1"
                checked={selectedId === c.candidate_id}
                onChange={() => setSelectedId(c.candidate_id)}
              />
              <div>
                <p className="font-medium">
                  {c.location} <span className="text-xs text-neutral-500">({c.score} value)</span>
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                  Adds: {c.what_strategy_adds}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  +{c.timing_impact_minutes} min · risks: {c.risks || "none noted"}
                </p>
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
        {submitting ? "Submitting…" : "Confirm integration point"}
      </button>
    </div>
  );
}
