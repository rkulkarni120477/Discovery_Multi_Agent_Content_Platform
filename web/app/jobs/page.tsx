"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { deleteJob, listJobs } from "@/lib/api";
import type { JobSummary } from "@/lib/types";

const STATUS_STYLES: Record<string, string> = {
  running: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  paused: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  complete: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  error: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    listJobs()
      .then(setJobs)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load jobs"));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this run? This cannot be undone.")) return;
    setDeletingId(id);
    setError(null);
    try {
      await deleteJob(id);
      setJobs((prev) => prev?.filter((j) => j.id !== id) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete job");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Runs</h1>
        <div className="flex gap-4 text-sm">
          <Link href="/" className="underline underline-offset-4 text-neutral-600 dark:text-neutral-400">
            Back to home
          </Link>
          <Link href="/" className="underline underline-offset-4 text-neutral-600 dark:text-neutral-400">
            Start a new run
          </Link>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>}
      {!jobs && !error && <p className="text-sm text-neutral-500">Loading…</p>}
      {jobs && jobs.length === 0 && (
        <p className="text-sm text-neutral-500">No runs yet — start one from the home page.</p>
      )}

      {jobs && jobs.length > 0 && (
        <ul className="flex flex-col divide-y divide-neutral-200 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
          {jobs.map((job) => (
            <li key={job.id} className="flex items-center hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
              <Link href={`/jobs/${job.id}`} className="flex-1 flex items-center justify-between px-4 py-3 min-w-0">
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate">{job.id}</span>
                  <span className="text-xs text-neutral-500">
                    {job.scenario === "scenario1"
                      ? "Scenario 1"
                      : job.scenario === "scenario3"
                        ? "Scenario 3"
                        : "Scenario 2"}
                    {job.phase ? ` · ${job.phase} · step ${job.step ?? "?"}` : " · starting…"}
                  </span>
                </div>
                <span
                  className={`ml-4 shrink-0 text-xs font-medium px-2 py-1 rounded-full ${
                    STATUS_STYLES[job.status] || "bg-neutral-100 text-neutral-700"
                  }`}
                >
                  {job.status}
                </span>
              </Link>
              <button
                onClick={() => handleDelete(job.id)}
                disabled={deletingId === job.id}
                title="Delete run"
                className="shrink-0 px-4 py-3 text-xs font-medium text-red-600 dark:text-red-400 underline
                           underline-offset-4 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deletingId === job.id ? "Deleting…" : "Delete"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
