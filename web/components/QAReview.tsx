"use client";

import { useState } from "react";
import type { ReviewQAFeedbackPayload } from "@/lib/types";

const CATEGORY_LABELS: Record<string, string> = {
  literacy_fidelity: "Literacy-strategy fidelity",
  science_accuracy: "Scientific accuracy",
  instructional_integrity: "Instructional intent & 3D learning",
  coherence_pacing: "Coherence, pacing & grade appropriateness",
  consistency: "Cross-component consistency",
};

type Decision = { issues_to_resolve: string[]; notes: string };

export function QAReview({
  payload,
  onSubmit,
  submitting,
}: {
  payload: ReviewQAFeedbackPayload;
  onSubmit: (value: Record<string, Decision>) => void;
  submitting: boolean;
}) {
  const categories = Object.entries(payload.qa_findings);

  const [decisions, setDecisions] = useState<Record<string, Decision>>(() =>
    Object.fromEntries(
      categories.map(([key, finding]) => [key, { issues_to_resolve: [...finding.issues_to_resolve], notes: "" }])
    )
  );

  function toggleIssue(category: string, issue: string) {
    setDecisions((prev) => {
      const current = prev[category].issues_to_resolve;
      const next = current.includes(issue)
        ? current.filter((i) => i !== issue)
        : [...current, issue];
      return { ...prev, [category]: { ...prev[category], issues_to_resolve: next } };
    });
  }

  function setNotes(category: string, notes: string) {
    setDecisions((prev) => ({ ...prev, [category]: { ...prev[category], notes } }));
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold">Review QA findings</h3>
        <p className="text-xs text-neutral-500 mt-1">{payload.instructions}</p>
      </div>

      <div className="flex flex-col gap-4">
        {categories.map(([key, finding]) => (
          <div key={key} className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{CATEGORY_LABELS[key] ?? key}</p>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  finding.passed
                    ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                }`}
              >
                {finding.passed ? "passed" : "issues found"}
              </span>
            </div>

            {finding.findings.length > 0 && (
              <ul className="text-xs text-neutral-600 dark:text-neutral-400 mt-2 list-disc pl-4">
                {finding.findings.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            )}

            {finding.issues_to_resolve.length > 0 && (
              <div className="mt-2 flex flex-col gap-1">
                <p className="text-xs font-medium text-neutral-500">Issues to resolve:</p>
                {finding.issues_to_resolve.map((issue, i) => (
                  <label key={i} className="flex items-start gap-2 text-xs">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={decisions[key].issues_to_resolve.includes(issue)}
                      onChange={() => toggleIssue(key, issue)}
                    />
                    {issue}
                  </label>
                ))}
              </div>
            )}

            <textarea
              placeholder="Optional notes for this category…"
              value={decisions[key].notes}
              onChange={(e) => setNotes(key, e.target.value)}
              className="mt-2 w-full text-xs rounded-md border border-neutral-200 dark:border-neutral-800 bg-transparent p-2"
              rows={2}
            />
          </div>
        ))}
      </div>

      <button
        onClick={() => onSubmit(decisions)}
        disabled={submitting}
        className="w-fit rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-4 py-2 text-sm font-semibold disabled:opacity-40"
      >
        {submitting ? "Submitting…" : "Submit QA decisions"}
      </button>
    </div>
  );
}
