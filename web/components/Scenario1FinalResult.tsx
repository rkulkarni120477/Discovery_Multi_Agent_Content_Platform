"use client";

import Link from "next/link";
import { useState } from "react";
import { getResultDocxUrl } from "@/lib/api";
import type { Scenario1FinalPackage } from "@/lib/types";
import { ReportFrame } from "@/components/ReportFrame";

const TABS = ["Crosswalk", "Classification", "Gap Analysis", "Evidence Review", "QA Review"] as const;
type Tab = (typeof TABS)[number];

export function Scenario1FinalResult({ jobId, pkg }: { jobId: string; pkg: Scenario1FinalPackage }) {
  const [tab, setTab] = useState<Tab>("Crosswalk");

  return (
    <ReportFrame
      scenario="Scenario 1"
      title="Standards Alignment Report"
      summary={pkg.summary}
      metrics={[
        { label: "Strong", value: pkg.sc_codes_strong, tone: "teal" },
        { label: "Partial", value: pkg.sc_codes_partial, tone: "orange" },
        { label: "Gaps", value: pkg.sc_codes_gap, tone: "red" },
        { label: "Standards reviewed", value: pkg.sc_codes_total },
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
        {tab === "Crosswalk" &&
          pkg.crosswalk
            .map((r) => `${r.ngss_code} -> ${r.sc_code} [${r.relationship}]\n  ${r.notes}`)
            .join("\n\n")}
        {tab === "Classification" &&
          pkg.classification
            .map((c) => `${c.sc_code} [${c.classification}]\n  ${c.rationale}`)
            .join("\n\n")}
        {tab === "Gap Analysis" &&
          (pkg.gap_analysis.length > 0
            ? pkg.gap_analysis
                .map((g) => `${g.sc_code}\n  Gap: ${g.gap_description}\n  Remediation: ${g.remediation_recommendation}`)
                .join("\n\n")
            : "No gaps remaining.")}
        {tab === "Evidence Review" &&
          pkg.evidence_review
            .map(
              (r) =>
                `${r.sc_code}\n  Existing citation: ${r.existing_citation || "none"}\n  Evidence: ${r.evidence_summary}\n  ${r.notes}`
            )
            .join("\n\n")}
        {tab === "QA Review" &&
          `Passed: ${pkg.final_qa_review.passed}\n\n` +
            `Findings:\n${pkg.final_qa_review.findings.map((f) => `- ${f}`).join("\n") || "None"}\n\n` +
            `Issues to resolve:\n${pkg.final_qa_review.issues_to_resolve.map((i) => `- ${i}`).join("\n") || "None"}`}
      </pre>

      <div className="mt-5 flex flex-wrap gap-3">
      <Link
        href={`/jobs/${jobId}/remediations`}
        className="inline-flex border border-orange-600 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-950"
      >
        View recommendations and remediations
      </Link>

      <a
        href={getResultDocxUrl(jobId)}
        className="inline-flex bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
      >
        Download final package (.docx)
      </a>
      </div>
    </ReportFrame>
  );
}
