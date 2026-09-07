import Link from "next/link";
import { Scenario3UploadForm } from "@/components/Scenario3UploadForm";

export default function Scenario3Page() {
  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-semibold">Scenario 3 — State Standards Alignment</h1>
        <div className="flex gap-4 text-sm">
          <Link href="/" className="underline underline-offset-4 text-neutral-600 dark:text-neutral-400">
            Main page
          </Link>
          <Link href="/jobs" className="underline underline-offset-4 text-neutral-600 dark:text-neutral-400">
            View past runs
          </Link>
        </div>
      </div>
      <p className="text-neutral-600 dark:text-neutral-400 mb-8 max-w-2xl">
        Upload a unit&apos;s scope-and-sequence document, an authoritative state-standards reference,
        and its lesson + educator-support files. A multi-agent LangGraph pipeline will crosswalk
        the unit&apos;s existing standards against the target state&apos;s standards, map lesson content to
        each standard, analyze gaps and surplus content, plan and draft revisions, and produce a
        final alignment package — pausing for your review at the three judgment calls the workflow
        can&apos;t safely automate (the crosswalk, the alignment classifications, and the revision
        plan).
      </p>
      <Scenario3UploadForm />
    </main>
  );
}
