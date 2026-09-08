"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { getJobResult, getJobStatus, resumeJob } from "@/lib/api";
import { AlignmentMapReview } from "@/components/AlignmentMapReview";
import { CombinationReview } from "@/components/CombinationReview";
import { CrosswalkReview } from "@/components/CrosswalkReview";
import { FinalResult } from "@/components/FinalResult";
import { GapAnalysisReview } from "@/components/GapAnalysisReview";
import { GradeLevelDepthReview } from "@/components/GradeLevelDepthReview";
import { IntegrationPointReview } from "@/components/IntegrationPointReview";
import { PhaseTimeline } from "@/components/PhaseTimeline";
import { QAReview } from "@/components/QAReview";
import { RevisionPlanReview } from "@/components/RevisionPlanReview";
import { RunProgressBar } from "@/components/RunProgressBar";
import { Scenario1FinalResult } from "@/components/Scenario1FinalResult";
import { Scenario3FinalResult } from "@/components/Scenario3FinalResult";
import { StepNavigator } from "@/components/StepNavigator";
import {
  SCENARIO1_PHASE_STEP_RANGES,
  SCENARIO2_PHASE_STEP_RANGES,
  SCENARIO3_PHASE_STEP_RANGES,
  type FinalPackage,
  type JobStatus,
  type ReviewAlignmentMapPayload,
  type ReviewCrosswalkPayload,
  type ReviewGapAnalysisPayload,
  type ReviewGradeLevelDepthPayload,
  type ReviewQAFeedbackPayload,
  type ReviewRevisionPlanPayload,
  type Scenario1FinalPackage,
  type Scenario3FinalPackage,
  type SelectCombinationPayload,
  type SelectIntegrationPointPayload,
} from "@/lib/types";

const POLL_INTERVAL_MS = 3000;

const SCENARIO_LABELS: Record<string, string> = {
  scenario1: "Scenario 1",
  scenario2: "Scenario 2",
  scenario3: "Scenario 3",
};

const PHASE_STEP_RANGES_BY_SCENARIO: Record<string, Record<string, [number, number]>> = {
  scenario1: SCENARIO1_PHASE_STEP_RANGES,
  scenario2: SCENARIO2_PHASE_STEP_RANGES,
  scenario3: SCENARIO3_PHASE_STEP_RANGES,
};

type AnyFinalPackage = FinalPackage | Scenario1FinalPackage | Scenario3FinalPackage;

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const jobId = params.id;

  const [status, setStatus] = useState<JobStatus | null>(null);
  const [result, setResult] = useState<AnyFinalPackage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedStep, setSelectedStep] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await getJobStatus(jobId);
      setStatus(next);
      if (next.status === "complete") {
        const pkg = await getJobResult(jobId);
        setResult(pkg);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load job status");
    }
  }, [jobId]);

  useEffect(() => {
    refresh();
    timerRef.current = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [refresh]);

  useEffect(() => {
    if (status) {
      setSelectedStep(status.step ?? 1);
    }
  }, [status]);

  useEffect(() => {
    if (status?.status === "complete" || status?.status === "error") {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [status?.status]);

  async function handleResume(value: unknown) {
    setSubmitting(true);
    setError(null);
    try {
      const next = await resumeJob(jobId, value);
      setStatus(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit decision");
    } finally {
      setSubmitting(false);
    }
  }

  const scenario = status?.scenario ?? "scenario2";
  const phaseStepRanges = PHASE_STEP_RANGES_BY_SCENARIO[scenario] ?? SCENARIO2_PHASE_STEP_RANGES;

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 pb-28">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Run {jobId.slice(0, 8)}</h1>
          {status && (
            <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wide">
              {SCENARIO_LABELS[status.scenario] ?? status.scenario}
            </p>
          )}
        </div>
        <div className="flex gap-4 text-sm">
          <Link href="/" className="underline underline-offset-4 text-neutral-600 dark:text-neutral-400">
            Home
          </Link>
          <Link href="/jobs" className="underline underline-offset-4 text-neutral-600 dark:text-neutral-400">
            All runs
          </Link>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>}
      {status?.status === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400 mb-4">{status.error}</p>
      )}

      {!status && !error && <p className="text-sm text-neutral-500">Loading…</p>}

      {status && (
        <>
          <StepNavigator
            scenario={status.scenario}
            selectedStep={selectedStep}
          />
          <div className="grid grid-cols-1 md:grid-cols-[16rem_1fr] gap-10">
          <PhaseTimeline
            phases={status.phases}
            phaseStepRanges={phaseStepRanges}
            currentPhase={status.phase}
            currentStep={status.step}
            status={status.status}
          />

            <div>
            {status.status === "running" && (
              <p className="text-sm text-neutral-500">Agents are working — this refreshes automatically…</p>
            )}

            {/* Scenario 1 checkpoints */}
            {status.status === "paused" && status.interrupt_type === "review_grade_level_depth" && (
              <GradeLevelDepthReview
                payload={status.interrupt_payload as unknown as ReviewGradeLevelDepthPayload}
                onSubmit={handleResume}
                submitting={submitting}
              />
            )}
            {status.status === "paused" && status.interrupt_type === "review_gap_analysis" && (
              <GapAnalysisReview
                payload={status.interrupt_payload as unknown as ReviewGapAnalysisPayload}
                onSubmit={handleResume}
                submitting={submitting}
              />
            )}

            {/* Scenario 2 checkpoints */}
            {status.status === "paused" && status.interrupt_type === "select_combination" && (
              <CombinationReview
                payload={status.interrupt_payload as unknown as SelectCombinationPayload}
                onSubmit={handleResume}
                submitting={submitting}
              />
            )}
            {status.status === "paused" && status.interrupt_type === "select_integration_point" && (
              <IntegrationPointReview
                payload={status.interrupt_payload as unknown as SelectIntegrationPointPayload}
                onSubmit={handleResume}
                submitting={submitting}
              />
            )}
            {status.status === "paused" && status.interrupt_type === "review_qa_feedback" && (
              <QAReview
                payload={status.interrupt_payload as unknown as ReviewQAFeedbackPayload}
                onSubmit={handleResume}
                submitting={submitting}
              />
            )}

            {/* Scenario 3 checkpoints */}
            {status.status === "paused" && status.interrupt_type === "review_crosswalk" && (
              <CrosswalkReview
                payload={status.interrupt_payload as unknown as ReviewCrosswalkPayload}
                onSubmit={handleResume}
                submitting={submitting}
              />
            )}
            {status.status === "paused" && status.interrupt_type === "review_alignment_map" && (
              <AlignmentMapReview
                payload={status.interrupt_payload as unknown as ReviewAlignmentMapPayload}
                onSubmit={handleResume}
                submitting={submitting}
              />
            )}
            {status.status === "paused" && status.interrupt_type === "review_revision_plan" && (
              <RevisionPlanReview
                payload={status.interrupt_payload as unknown as ReviewRevisionPlanPayload}
                onSubmit={handleResume}
                submitting={submitting}
              />
            )}

            {status.status === "complete" && result && scenario === "scenario1" && (
              <Scenario1FinalResult jobId={jobId} pkg={result as Scenario1FinalPackage} />
            )}
            {status.status === "complete" && result && scenario === "scenario2" && (
              <FinalResult jobId={jobId} pkg={result as FinalPackage} />
            )}
            {status.status === "complete" && result && scenario === "scenario3" && (
              <Scenario3FinalResult jobId={jobId} pkg={result as Scenario3FinalPackage} />
            )}
            {status.status === "complete" && !result && (
              <p className="text-sm text-neutral-500">Loading final package…</p>
            )}
            </div>
          </div>
        </>
      )}
      {status && (
        <RunProgressBar
          scenario={status.scenario}
          status={status.status}
          step={status.step}
          totalSteps={status.total_steps}
        />
      )}
    </main>
  );
}
