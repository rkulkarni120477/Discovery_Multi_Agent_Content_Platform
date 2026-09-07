"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createScenario2Job } from "@/lib/api";

const FIELDS = [
  { key: "lesson_1", label: "Lesson 1 (candidate Explore lesson)" },
  { key: "lesson_2", label: "Lesson 2 (candidate Explore lesson)" },
  { key: "lesson_3", label: "Lesson 3 (candidate Explore lesson)" },
  { key: "literacy_strategy", label: "Literacy Strategy resource" },
] as const;

type FieldKey = (typeof FIELDS)[number]["key"];

export function Scenario2UploadForm() {
  const router = useRouter();
  const [files, setFiles] = useState<Partial<Record<FieldKey, File>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allSelected = FIELDS.every((f) => files[f.key]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allSelected) return;
    setSubmitting(true);
    setError(null);
    try {
      const { job_id } = await createScenario2Job(files as Record<FieldKey, File>);
      router.push(`/jobs/${job_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start job");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-xl">
      {FIELDS.map((field) => (
        <label key={field.key} className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {field.label}
          </span>
          <input
            type="file"
            accept=".docx,.pdf,.txt,.md"
            required
            onChange={(e) =>
              setFiles((prev) => ({ ...prev, [field.key]: e.target.files?.[0] }))
            }
            className="block w-full text-sm rounded-lg border border-neutral-300 dark:border-neutral-700
                       bg-white dark:bg-neutral-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg
                       file:border-0 file:bg-neutral-900 file:text-white dark:file:bg-neutral-100
                       dark:file:text-neutral-900 file:text-sm file:font-medium cursor-pointer"
          />
        </label>
      ))}

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
        {submitting ? "Starting run…" : "Start Scenario 2 run"}
      </button>
    </form>
  );
}
