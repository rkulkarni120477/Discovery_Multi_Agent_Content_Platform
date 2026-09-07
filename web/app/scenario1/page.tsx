import Link from "next/link";
import { Scenario1UploadForm } from "@/components/Scenario1UploadForm";

export default function Scenario1Page() {
  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-semibold">Scenario 1 — NGSS-to-State Standards Crosswalk</h1>
        <div className="flex gap-4 text-sm">
          <Link href="/" className="underline underline-offset-4 text-neutral-600 dark:text-neutral-400">
            Change scenario
          </Link>
          <Link href="/jobs" className="underline underline-offset-4 text-neutral-600 dark:text-neutral-400">
            View past runs
          </Link>
        </div>
      </div>
      <p className="text-neutral-600 dark:text-neutral-400 mb-8 max-w-2xl">
        Upload the product's existing NGSS-aligned K-5 content, an NGSS reference, and the target
        state's science standards, performance targets, and vertical articulation documents. A
        multi-agent LangGraph pipeline will inventory the existing NGSS alignment, crosswalk it
        against the state's standards, map performance targets, validate grade-level depth across
        SEP/DCI/CCC, define evidence criteria, classify each requirement as Strong/Partial/Gap,
        and produce a gap analysis with remediation recommendations plus a final QA pass — pausing
        for your review at the two judgment calls a state-standards SME needs to sign off on:
        grade-level depth validation and the final gap/remediation recommendations.
      </p>
      <Scenario1UploadForm />
    </main>
  );
}
