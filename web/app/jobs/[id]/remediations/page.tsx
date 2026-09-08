"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getJobResult, getJobStatus } from "@/lib/api";
import type { Scenario1FinalPackage } from "@/lib/types";

export default function Scenario1RemediationsPage() {
  const params = useParams<{ id: string }>();
  const jobId = params.id;
  const [pkg, setPkg] = useState<Scenario1FinalPackage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const status = await getJobStatus(jobId);
        if (status.scenario !== "scenario1") {
          throw new Error("Recommendations are available only for Scenario 1 runs.");
        }
        if (status.status !== "complete") {
          throw new Error("Recommendations are available after the run is complete.");
        }
        setPkg((await getJobResult(jobId)) as Scenario1FinalPackage);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load recommendations");
      }
    }
    load();
  }, [jobId]);

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Recommendations and Remediations</h1>
        <div className="flex gap-4 text-sm">
          <Link href="/" className="underline underline-offset-4 text-neutral-600 dark:text-neutral-400">
            Home
          </Link>
          <Link href={`/jobs/${jobId}`} className="underline underline-offset-4 text-neutral-600 dark:text-neutral-400">
            Back to run
          </Link>
        </div>
      </div>
      {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {!pkg && !error && <p className="mt-4 text-sm text-neutral-500">Loading recommendations...</p>}
      {pkg && (
        <div className="mt-6 flex flex-col gap-4">
          {pkg.gap_analysis.length === 0 ? (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">No remediations are required.</p>
          ) : (
            pkg.gap_analysis.map((item, index) => (
              <article key={`${String(item.sc_code)}-${index}`} className="border border-neutral-200 dark:border-neutral-800 p-4">
                <h2 className="text-base font-semibold">{String(item.sc_code)}</h2>
                <p className="mt-2 text-sm"><span className="font-medium">Gap: </span>{String(item.gap_description)}</p>
                <p className="mt-2 text-sm"><span className="font-medium">Recommendation: </span>{String(item.remediation_recommendation)}</p>
              </article>
            ))
          )}
        </div>
      )}
    </main>
  );
}