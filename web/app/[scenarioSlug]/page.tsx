"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getStepGuide } from "@/lib/stepGuide";
import type { ScenarioKey } from "@/lib/types";

type WorkflowStep = {
  scenario: ScenarioKey;
  stepNumber: number;
  stepName: string;
  selectedStep: number;
};

type CustomScenario = {
  id: string;
  name: string;
  slug: string;
  steps: WorkflowStep[];
};

const STORAGE_KEY = "custom-scenarios";
const WORKFLOW_STATE_KEY_PREFIX = "custom-scenario-workflow-";

function toScenarioSlug(name: string) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "custom-scenario";
}

export default function CustomScenarioWorkflowPage() {
  const params = useParams<{ scenarioSlug: string }>();
  const router = useRouter();
  const [scenario, setScenario] = useState<CustomScenario | null | undefined>(undefined);
  const [completedStepKeys, setCompletedStepKeys] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const scenarios = stored ? (JSON.parse(stored) as CustomScenario[]) : [];
      const matchedScenario = Array.isArray(scenarios)
          ? scenarios.find((item) => (item.slug ?? toScenarioSlug(item.name)) === params.scenarioSlug) ?? null
          : null;
      setScenario(matchedScenario);

      const workflowState = window.localStorage.getItem(`${WORKFLOW_STATE_KEY_PREFIX}${params.scenarioSlug}`);
      const completedSteps = workflowState ? (JSON.parse(workflowState) as string[]) : [];
      setCompletedStepKeys(Array.isArray(completedSteps) ? completedSteps : []);
    } catch {
      setScenario(null);
      setCompletedStepKeys([]);
    }
  }, [params.scenarioSlug]);

  if (scenario === undefined) {
    return <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">Loading workflow...</main>;
  }

  if (!scenario) {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <h1 className="text-2xl font-semibold">Scenario not found</h1>
        <Link href="/" className="mt-4 inline-block text-sm underline underline-offset-4 text-neutral-600 dark:text-neutral-400">
          Main page
        </Link>
      </main>
    );
  }

  const orderedSteps = [...scenario.steps].sort((first, second) => first.selectedStep - second.selectedStep);
  const nextStep = orderedSteps.find(
    (step) => !completedStepKeys.includes(`${step.scenario}-${step.stepNumber}`),
  );
  const completedCount = orderedSteps.filter((step) =>
    completedStepKeys.includes(`${step.scenario}-${step.stepNumber}`),
  ).length;
  const isComplete = !nextStep;

  function completeActiveStep() {
    if (!nextStep) return;

    const nextCompletedStepKeys = [...completedStepKeys, `${nextStep.scenario}-${nextStep.stepNumber}`];
    setCompletedStepKeys(nextCompletedStepKeys);
    window.localStorage.setItem(
      `${WORKFLOW_STATE_KEY_PREFIX}${params.scenarioSlug}`,
      JSON.stringify(nextCompletedStepKeys),
    );
  }

  function deleteScenario() {
    if (!isComplete) return;

    const stored = window.localStorage.getItem(STORAGE_KEY);
    const scenarios = stored ? (JSON.parse(stored) as CustomScenario[]) : [];
    const remainingScenarios = Array.isArray(scenarios)
      ? scenarios.filter((item) => (item.slug ?? toScenarioSlug(item.name)) !== params.scenarioSlug)
      : [];

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(remainingScenarios));
    window.localStorage.removeItem(`${WORKFLOW_STATE_KEY_PREFIX}${params.scenarioSlug}`);
    router.push("/");
  }

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">{scenario.name}</h1>
        <Link href="/" className="text-sm underline underline-offset-4 text-neutral-600 dark:text-neutral-400">
          Main page
        </Link>
      </div>

      <section className="mb-6 rounded-lg border border-orange-200 bg-orange-50 p-5 dark:border-orange-800 dark:bg-orange-950/40">
        <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
          {isComplete
            ? "Workflow complete"
            : `Workflow running: ${completedCount} of ${orderedSteps.length} steps complete`}
        </p>
        {nextStep && (
          <div className="mt-4">
            <p className="font-medium text-neutral-900 dark:text-neutral-100">
              Step {nextStep.selectedStep}: {nextStep.stepName}
            </p>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              {getStepGuide(nextStep.scenario, nextStep.stepNumber)?.execution}
            </p>
            <button
              type="button"
              onClick={completeActiveStep}
              className="mt-4 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-700"
            >
              Execute and complete step {nextStep.selectedStep}
            </button>
          </div>
        )}
      </section>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-neutral-100 dark:bg-neutral-900">
            <tr>
              <th className="px-3 py-3 font-medium">Workflow step</th>
              <th className="px-3 py-3 font-medium">Source scenario</th>
              <th className="px-3 py-3 font-medium">Original step</th>
              <th className="px-3 py-3 font-medium">Step name</th>
              <th className="px-3 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {orderedSteps.map((step) => {
              const stepKey = `${step.scenario}-${step.stepNumber}`;
              const isStepComplete = completedStepKeys.includes(stepKey);

              return (
              <tr key={stepKey} className="border-t border-neutral-200 dark:border-neutral-800">
                <td className="px-3 py-3 font-medium">{step.selectedStep}</td>
                <td className="px-3 py-3">{step.scenario.replace("scenario", "Scenario ")}</td>
                <td className="px-3 py-3">{step.stepNumber}</td>
                <td className="px-3 py-3">{step.stepName}</td>
                <td className="px-3 py-3">{isStepComplete ? "Complete" : step === nextStep ? "Ready to execute" : "Waiting"}</td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          disabled={!isComplete}
          onClick={deleteScenario}
          className="rounded-lg bg-red-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
        >
          Delete scenario
        </button>
      </div>
    </main>
  );
}