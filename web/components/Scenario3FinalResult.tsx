"use client";

import { useState } from "react";
import { getResultDocxUrl, getResultXlsxUrl } from "@/lib/api";
import type { Scenario3FinalPackage } from "@/lib/types";
import { ReportFrame } from "@/components/ReportFrame";

const TABS = ["Updated Scope & Sequence", "Rationale", "Alignment Matrix"] as const;
type Tab = (typeof TABS)[number];

export function Scenario3FinalResult({ jobId, pkg }: { jobId: string; pkg: Scenario3FinalPackage }) {
  const [tab, setTab] = useState<Tab>("Updated Scope & Sequence");

  return (
    <ReportFrame
      scenario="Scenario 3"
      title="State Standards Alignment Package"
      summary={pkg.unit_summary}
      metrics={[
        { label: "Grade", value: pkg.confirmed_grade },
        { label: "Standards addressed", value: `${pkg.oregon_standards_addressed} / ${pkg.total_oregon_standards}`, tone: "teal" },
        { label: "Revisions made", value: pkg.revisions_made, tone: "orange" },
        { label: "Remaining gaps", value: pkg.remaining_gaps.length, tone: pkg.remaining_gaps.length ? "red" : "teal" },
      ]}
    >
      <p className="mb-5 border-l-2 border-orange-500 pl-3 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
        {pkg.overall_notes}
      </p>
      <div className="flex gap-1 overflow-x-auto border-b border-neutral-200 dark:border-neutral-800">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t
                ? "border-neutral-900 dark:border-neutral-100"
                : "border-transparent text-neutral-500"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <pre className="mt-5 max-h-[28rem] overflow-y-auto whitespace-pre-wrap border border-neutral-200 bg-neutral-50 p-5 text-sm leading-6 font-sans dark:border-neutral-800 dark:bg-neutral-900">
        {tab === "Updated Scope & Sequence" && pkg.updated_scope_sequence}
        {tab === "Rationale" &&
          pkg.rationale_entries
            .map(
              (r) =>
                `${r.oregon_standard} (${r.revision_id})\nGap: ${r.gap}\nChanged: ${r.what_changed}\nWhy: ${r.why}`
            )
            .join("\n\n")}
        {tab === "Alignment Matrix" &&
          pkg.final_alignment_matrix
            .map((r) => `${r.oregon_id} -> ${r.lesson_id} [${r.covered ? "covered" : "NOT covered"}]\n  ${r.evidence}`)
            .join("\n\n")}
      </pre>

      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href={getResultDocxUrl(jobId)}
          className="inline-flex w-fit bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
        >
          Download final package (.docx)
        </a>
        <a
          href={getResultXlsxUrl(jobId)}
          className="inline-flex w-fit border border-orange-600 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-950"
        >
          Download JSON workbook (.xlsx)
        </a>
      </div>
    </ReportFrame>
  );
}
