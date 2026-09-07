"use client";

import { useState } from "react";
import { getResultDocxUrl } from "@/lib/api";
import type { FinalPackage } from "@/lib/types";
import { ReportFrame } from "@/components/ReportFrame";

const TABS = ["Student Content", "Teacher Content", "Rationale", "Change Log"] as const;
type Tab = (typeof TABS)[number];

export function FinalResult({ jobId, pkg }: { jobId: string; pkg: FinalPackage }) {
  const [tab, setTab] = useState<Tab>("Student Content");

  return (
    <ReportFrame
      scenario="Scenario 2"
      title="Final Revision Package"
      summary={pkg.reason_for_change}
      metrics={[
        { label: "Literacy strategy", value: pkg.selected_literacy_strategy, tone: "orange" },
        { label: "Original location", value: pkg.original_location },
        { label: "Literacy benefit", value: pkg.literacy_benefit, tone: "teal" },
        { label: "Instructional impact", value: pkg.timing_or_instructional_impact },
      ]}
    >
      <div className="flex gap-1 overflow-x-auto border-b border-neutral-200 dark:border-neutral-800">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${
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
        {tab === "Student Content" && pkg.student_content}
        {tab === "Teacher Content" && pkg.teacher_content}
        {tab === "Rationale" && pkg.rationale_doc}
        {tab === "Change Log" && pkg.connected_updates.join("\n")}
      </pre>

      <a
        href={getResultDocxUrl(jobId)}
        className="mt-5 inline-flex w-fit bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
      >
        Download final package (.docx)
      </a>
    </ReportFrame>
  );
}
