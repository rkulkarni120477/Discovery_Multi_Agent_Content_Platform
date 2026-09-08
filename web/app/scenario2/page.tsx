import Link from "next/link";
import { Scenario2UploadForm } from "@/components/Scenario2UploadForm";

export default function Scenario2Page() {
  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-semibold">Scenario 2 — Literacy Strategy Integration</h1>
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
        Upload one Explore lesson and a literacy strategy resource. A multi-agent LangGraph pipeline
        will analyze the lesson, plan and draft a revision, run five parallel QA passes, and produce a final
        revised lesson with full rationale — pausing for your review at the three judgment calls the
        workflow can&apos;t safely automate.
      </p>
      <Scenario2UploadForm />
    </main>
  );
}
