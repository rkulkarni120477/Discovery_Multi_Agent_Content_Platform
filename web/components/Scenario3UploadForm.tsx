"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createScenario3Job } from "@/lib/api";

export function Scenario3UploadForm() {
  const router = useRouter();
  const [scopeSequence, setScopeSequence] = useState<File | null>(null);
  const [standardsReference, setStandardsReference] = useState<File | null>(null);
  const [lessonFiles, setLessonFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allSelected = scopeSequence && standardsReference && lessonFiles.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!scopeSequence || !standardsReference || lessonFiles.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const { job_id } = await createScenario3Job({
        scope_sequence: scopeSequence,
        standards_reference: standardsReference,
        lesson_files: lessonFiles,
      });
      router.push(`/jobs/${job_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start job");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-xl">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Scope and sequence document
        </span>
        <input
          type="file"
          accept=".docx,.pdf,.txt,.md"
          required
          onChange={(e) => setScopeSequence(e.target.files?.[0] ?? null)}
          className="block w-full text-sm rounded-lg border border-neutral-300 dark:border-neutral-700
                     bg-white dark:bg-neutral-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg
                     file:border-0 file:bg-neutral-900 file:text-white dark:file:bg-neutral-100
                     dark:file:text-neutral-900 file:text-sm file:font-medium cursor-pointer"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          State standards reference document
        </span>
        <p className="text-xs text-neutral-500">
          An authoritative document listing the target state's standards for this grade — the
          agent structures it into a working reference rather than sourcing it itself.
        </p>
        <input
          type="file"
          accept=".docx,.pdf,.txt,.md"
          required
          onChange={(e) => setStandardsReference(e.target.files?.[0] ?? null)}
          className="block w-full text-sm rounded-lg border border-neutral-300 dark:border-neutral-700
                     bg-white dark:bg-neutral-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg
                     file:border-0 file:bg-neutral-900 file:text-white dark:file:bg-neutral-100
                     dark:file:text-neutral-900 file:text-sm file:font-medium cursor-pointer"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Lesson + educator-support files
        </span>
        <p className="text-xs text-neutral-500">
          Select all lesson files and their educator-support files together (e.g. 4 lessons + 4
          support docs = 8 files).
        </p>
        <input
          type="file"
          accept=".docx,.pdf,.txt,.md"
          required
          multiple
          onChange={(e) => setLessonFiles(Array.from(e.target.files ?? []))}
          className="block w-full text-sm rounded-lg border border-neutral-300 dark:border-neutral-700
                     bg-white dark:bg-neutral-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg
                     file:border-0 file:bg-neutral-900 file:text-white dark:file:bg-neutral-100
                     dark:file:text-neutral-900 file:text-sm file:font-medium cursor-pointer"
        />
        {lessonFiles.length > 0 && (
          <ul className="text-xs text-neutral-500 list-disc pl-4">
            {lessonFiles.map((f) => (
              <li key={f.name}>{f.name}</li>
            ))}
          </ul>
        )}
      </label>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!allSelected || submitting}
        className="mt-2 inline-flex items-center justify-center rounded-lg bg-neutral-900
                   dark:bg-neutral-100 text-white dark:text-neutral-900 px-5 py-2.5 text-sm
                   font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90
                   transition-opacity w-fit"
      >
        {submitting ? "Starting run…" : "Start Scenario 3 run"}
      </button>
    </form>
  );
}
