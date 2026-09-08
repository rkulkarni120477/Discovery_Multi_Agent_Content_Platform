"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { approveManualStep, getManualJobResult, getManualJobStatus, resumeManualJob } from "@/lib/api";
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

const RANGES = { scenario1: SCENARIO1_PHASE_STEP_RANGES, scenario2: SCENARIO2_PHASE_STEP_RANGES, scenario3: SCENARIO3_PHASE_STEP_RANGES };
type Result = FinalPackage | Scenario1FinalPackage | Scenario3FinalPackage;

export function ManualJobDetail({ scenario }: { scenario: "scenario1" | "scenario2" | "scenario3" }) {
  const params = useParams<{ id: string }>();
  const jobId = params.id;
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedStep, setSelectedStep] = useState(1);
  const [approvedStep, setApprovedStep] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await getManualJobStatus(scenario, jobId);
      setStatus(next);
      setSelectedStep(next.step ?? 1);
      const reachedNextGate =
        approvedStep !== null &&
        next.step !== approvedStep;
      const reachedSameStepReview =
        approvedStep !== null &&
        next.status === "paused" &&
        next.interrupt_type !== "manual_approval";
      if (reachedNextGate || reachedSameStepReview) {
        setApprovedStep(null);
      }
      if (next.status === "complete") setResult(await getManualJobResult(scenario, jobId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load manual workflow status");
    }
  }, [approvedStep, jobId, scenario]);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 1500);
    return () => {
      clearInterval(timer);
    };
  }, [refresh]);

  async function approve() {
    const currentStep = status?.step ?? selectedStep;
    if (approvedStep === currentStep) return;
    setApprovedStep(currentStep);
    setSubmitting(true); setError(null);
    try { setStatus(await approveManualStep(scenario, jobId)); }
    catch (err) {
      setApprovedStep(null);
      setError(err instanceof Error ? err.message : "Failed to approve step");
    }
    finally { setSubmitting(false); }
  }

  async function resume(value: unknown) {
    setSubmitting(true); setError(null);
    try { setStatus(await resumeManualJob(scenario, jobId, value)); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to submit review"); }
    finally { setSubmitting(false); }
  }

  if (!status) return <main className="mx-auto max-w-5xl px-6 py-12"><p>{error ?? "Loading manual workflow…"}</p></main>;
  const ranges = RANGES[scenario];
  const checkpoint = status.interrupt_type !== "manual_approval";

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12 pb-28">
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold">Manual {scenario}</h1><p className="text-xs uppercase tracking-wide text-neutral-500">Human approval required for every step</p></div>
        <Link href="/" className="text-sm underline underline-offset-4">Home</Link>
      </div>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <StepNavigator scenario={scenario} selectedStep={selectedStep} manualExecution />
      <div className="grid grid-cols-1 gap-10 md:grid-cols-[16rem_1fr]">
        <PhaseTimeline phases={status.phases} phaseStepRanges={ranges} currentPhase={status.phase} currentStep={status.step} status={status.status} />
        <div>
          {(status.status === "paused" || status.status === "error") && status.interrupt_type === "manual_approval" && (
            <div className="mb-5 border border-orange-300 bg-orange-50 p-5 dark:border-orange-800 dark:bg-orange-950/40">
              <h2 className="text-lg font-semibold">{status.status === "error" ? "Retry" : "Approve"} Step {status.step}</h2>
              <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-200">
                {status.status === "error"
                  ? "The step failed while executing. Resolve the reported service error, then retry this step."
                  : "Review the step details above, then approve this step to execute it."}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  disabled={submitting || approvedStep === status.step}
                  onClick={approve}
                  className="bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {status.status === "error" ? "Retry Step" : "Approve Step"}
                </button>
                {approvedStep === status.step && (
                  <div className="flex min-w-64 items-center gap-3" role="status" aria-live="polite">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-green-100 dark:bg-green-950">
                      <div className="h-full w-2/5 animate-pulse rounded-full bg-green-500" />
                    </div>
                    <span className="text-xs font-medium text-green-700 dark:text-green-300">
                      Step in progress
                    </span>
                  </div>
                )}
              </div>
              {approvedStep === status.step && (
                <p className="mt-2 text-sm text-orange-800 dark:text-orange-200">Moving to next step…</p>
              )}
            </div>
          )}
          {status.status === "paused" && checkpoint && status.interrupt_type === "review_grade_level_depth" && <GradeLevelDepthReview payload={status.interrupt_payload as unknown as ReviewGradeLevelDepthPayload} onSubmit={resume} submitting={submitting} />}
          {status.status === "paused" && checkpoint && status.interrupt_type === "review_gap_analysis" && <GapAnalysisReview payload={status.interrupt_payload as unknown as ReviewGapAnalysisPayload} onSubmit={resume} submitting={submitting} />}
          {status.status === "paused" && checkpoint && status.interrupt_type === "select_combination" && <CombinationReview payload={status.interrupt_payload as unknown as SelectCombinationPayload} onSubmit={resume} submitting={submitting} />}
          {status.status === "paused" && checkpoint && status.interrupt_type === "select_integration_point" && <IntegrationPointReview payload={status.interrupt_payload as unknown as SelectIntegrationPointPayload} onSubmit={resume} submitting={submitting} />}
          {status.status === "paused" && checkpoint && status.interrupt_type === "review_qa_feedback" && <QAReview payload={status.interrupt_payload as unknown as ReviewQAFeedbackPayload} onSubmit={resume} submitting={submitting} />}
          {status.status === "paused" && checkpoint && status.interrupt_type === "review_crosswalk" && <CrosswalkReview payload={status.interrupt_payload as unknown as ReviewCrosswalkPayload} onSubmit={resume} submitting={submitting} />}
          {status.status === "paused" && checkpoint && status.interrupt_type === "review_alignment_map" && <AlignmentMapReview payload={status.interrupt_payload as unknown as ReviewAlignmentMapPayload} onSubmit={resume} submitting={submitting} />}
          {status.status === "paused" && checkpoint && status.interrupt_type === "review_revision_plan" && <RevisionPlanReview payload={status.interrupt_payload as unknown as ReviewRevisionPlanPayload} onSubmit={resume} submitting={submitting} />}
          {status.status === "running" && <p className="text-sm text-neutral-500">Preparing the next approval gate…</p>}
          {status.status === "complete" && result && scenario === "scenario1" && <Scenario1FinalResult jobId={jobId} pkg={result as Scenario1FinalPackage} />}
          {status.status === "complete" && result && scenario === "scenario2" && <FinalResult jobId={jobId} pkg={result as FinalPackage} />}
          {status.status === "complete" && result && scenario === "scenario3" && <Scenario3FinalResult jobId={jobId} pkg={result as Scenario3FinalPackage} />}
        </div>
      </div>
      <RunProgressBar scenario={scenario} status={status.status} step={status.step} totalSteps={status.total_steps} />
    </main>
  );
}
