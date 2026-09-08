"use client";

import type { ScenarioKey } from "@/lib/types";
import { getStepGuide, getStepGuides } from "@/lib/stepGuide";

export function StepNavigator({ scenario, selectedStep, manualExecution = false }: {
  scenario: ScenarioKey;
  selectedStep: number;
  manualExecution?: boolean;
}) {
  const guides = getStepGuides(scenario);
  const guide = getStepGuide(scenario, selectedStep) ?? guides[0];
  if (!guide) return null;

  return (
    <section className="mb-8 rounded-xl border border-orange-300 bg-orange-50 p-5 shadow-sm dark:border-orange-800 dark:bg-orange-950/40">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-700 dark:text-orange-300">
              Workflow step details
            </p>
            <h2 className="mt-1 text-xl font-semibold text-orange-950 dark:text-orange-50">
              Step {guide.step}: {guide.name}
            </h2>
          </div>
          <span className="rounded-full border border-orange-300 bg-white px-3 py-1 text-xs font-semibold text-orange-800 dark:border-orange-700 dark:bg-orange-950 dark:text-orange-200">
            Step {guide.step}
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-orange-200 bg-white/90 dark:border-orange-800 dark:bg-neutral-950/50">
          <table className="w-full min-w-[60rem] border-collapse text-left text-sm">
            <thead className="bg-orange-100 text-xs uppercase tracking-wide text-orange-900 dark:bg-orange-900/60 dark:text-orange-100">
              <tr>
                <th className="border-b border-orange-200 px-3 py-3 font-semibold dark:border-orange-800">Step</th>
                <th className="border-b border-orange-200 px-3 py-3 font-semibold dark:border-orange-800">Step group</th>
                <th className="border-b border-orange-200 px-3 py-3 font-semibold dark:border-orange-800">Executor agent</th>
                <th className="border-b border-orange-200 px-3 py-3 font-semibold dark:border-orange-800">Information</th>
                <th className="border-b border-orange-200 px-3 py-3 font-semibold dark:border-orange-800">Execution</th>
                <th className="border-b border-orange-200 px-3 py-3 font-semibold dark:border-orange-800">Expected result</th>
              </tr>
            </thead>
            <tbody>
              <tr className="align-top text-neutral-800 dark:text-neutral-100">
                <td className="border-r border-orange-100 px-3 py-4 font-semibold text-orange-700 dark:border-orange-900 dark:text-orange-300">
                  {guide.step}
                </td>
                <td className="border-r border-orange-100 px-3 py-4 dark:border-orange-900">{guide.group}</td>
                <td className="border-r border-orange-100 px-3 py-4 dark:border-orange-900">{guide.agent}</td>
                <td className="border-r border-orange-100 px-3 py-4 leading-6 dark:border-orange-900">{guide.information}</td>
                <td className="border-r border-orange-100 px-3 py-4 leading-6 dark:border-orange-900">{guide.execution}</td>
                <td className="px-3 py-4 leading-6">{guide.result}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-5 border-t border-orange-200 pt-4 dark:border-orange-800">
          <p className="text-xs text-orange-800 dark:text-orange-200">
            {manualExecution
              ? "Workflow Execution is Manual. Please wait after approving the step"
              : "Workflow execution is automatic. This table updates as the active step changes."}
          </p>
        </div>
      </div>
    </section>
  );
}
