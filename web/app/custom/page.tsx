"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { getStepGuides } from "@/lib/stepGuide";
import type { ScenarioKey } from "@/lib/types";

type StepOption = {
  id: string;
  scenario: ScenarioKey;
  stepNumber: number;
  stepName: string;
  label: string;
};

type RowState = {
  id: string;
  scenario: ScenarioKey;
  stepNumber: number;
  stepName: string;
  checked: boolean;
  selectedStep: string;
};

const TOTAL_STEP_COUNT = 27;

const SCENARIO_LABELS: Record<ScenarioKey, string> = {
  scenario1: "Scenario 1",
  scenario2: "Scenario 2",
  scenario3: "Scenario 3",
};

const UPLOAD_REQUIREMENTS: Record<ScenarioKey, { key: string; label: string; multiple?: boolean }[]> = {
  scenario1: [
    { key: "existing-product-content", label: "Existing product content and NGSS citations" },
    { key: "sc-standards-reference", label: "South Carolina science standards reference" },
  ],
  scenario2: [
    { key: "lesson", label: "Candidate lesson" },
    { key: "literacy-strategy", label: "Literacy strategy resource" },
  ],
  scenario3: [
    { key: "scope-sequence", label: "Scope and sequence document" },
    { key: "standards-reference", label: "State standards reference document" },
    { key: "lesson-files", label: "Lesson and educator-support files", multiple: true },
  ],
};

const ALL_STEPS: StepOption[] = (["scenario1", "scenario2", "scenario3"] as ScenarioKey[]).flatMap((scenario) =>
  getStepGuides(scenario).map((guide) => ({
    id: `${scenario}-${guide.step}`,
    scenario,
    stepNumber: guide.step,
    stepName: guide.name,
    label: `${SCENARIO_LABELS[scenario]} — Step ${guide.step}: ${guide.name}`,
  })),
);

function buildRows(): RowState[] {
  return ALL_STEPS.map((option) => ({
    id: option.id,
    scenario: option.scenario,
    stepNumber: option.stepNumber,
    stepName: option.stepName,
    checked: false,
    selectedStep: "",
  }));
}

function toScenarioSlug(name: string) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "custom-scenario";
}

export default function CustomPage() {
  const router = useRouter();
  const [rows, setRows] = useState<RowState[]>(() => buildRows());
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File[]>>({});

  const selectedStepIds = useMemo(
    () => new Set(rows.filter((row) => row.checked && row.selectedStep).map((row) => row.selectedStep)),
    [rows],
  );

  const allStepNumbers = Array.from({ length: TOTAL_STEP_COUNT }, (_, index) => String(index + 1));
  const checkedRows = rows.filter((row) => row.checked);
  const hasSelectedRows = checkedRows.length > 0;
  const allCheckedRowsHaveSteps = hasSelectedRows && checkedRows.every((row) => row.selectedStep);
  const selectedStepNumbers = checkedRows
    .filter((row) => row.selectedStep)
    .map((row) => Number(row.selectedStep))
    .sort((first, second) => first - second);
  const stepsAreInOrder = allCheckedRowsHaveSteps && selectedStepNumbers.every(
    (stepNumber, index) => stepNumber === index + 1,
  );
  const selectedSourceSteps = new Set(checkedRows.map((row) => `${row.scenario}-${row.stepNumber}`));
  const selectedScenarios = [...new Set(checkedRows.map((row) => row.scenario))];
  const requiredUploadKeys = selectedScenarios.flatMap((scenario) =>
    UPLOAD_REQUIREMENTS[scenario].map((requirement) => `${scenario}-${requirement.key}`),
  );
  const allRequiredUploadsSelected = requiredUploadKeys.length > 0 && requiredUploadKeys.every(
    (key) => (uploadedFiles[key]?.length ?? 0) > 0,
  );
  const prerequisiteSteps = checkedRows
    .flatMap((row) => getStepGuides(row.scenario).filter((guide) => guide.step < row.stepNumber).map((guide) => ({
      scenario: row.scenario,
      stepNumber: guide.step,
      stepName: guide.name,
    })))
    .filter((step, index, steps) =>
      steps.findIndex((candidate) => candidate.scenario === step.scenario && candidate.stepNumber === step.stepNumber) === index,
    );
  const hasMissingPrerequisites = checkedRows.some((row) => {
    for (let stepNumber = 1; stepNumber < row.stepNumber; stepNumber += 1) {
      if (!selectedSourceSteps.has(`${row.scenario}-${stepNumber}`)) return true;
    }
    return false;
  });
  const prerequisitesSatisfied = !hasMissingPrerequisites || allRequiredUploadsSelected;
  const canGenerateScenario = hasSelectedRows && allCheckedRowsHaveSteps && stepsAreInOrder && prerequisitesSatisfied;
  const hasStepOrderError = selectedStepNumbers.length > 0 && !stepsAreInOrder;

  function toggleRow(rowId: string, checked: boolean) {
    setRows((currentRows) =>
      currentRows.map((row) => {
        if (row.id !== rowId) return row;
        return {
          ...row,
          checked,
          selectedStep: checked ? row.selectedStep : "",
        };
      }),
    );
  }

  function updateSelectedStep(rowId: string, nextValue: string) {
    setRows((currentRows) =>
      currentRows.map((row) => (row.id === rowId ? { ...row, selectedStep: nextValue } : row)),
    );
  }

  function handleGenerateScenario() {
    if (!canGenerateScenario) return;

    const scenarioName = window.prompt("Enter a name for this custom scenario:", "Custom Scenario");
    const trimmedName = scenarioName?.trim();

    if (!trimmedName) return;

    const workflowSteps = checkedRows.map((row) => ({
      ...row,
      selectedStep: Number(row.selectedStep),
    }));

    const customScenario = {
      id: `custom-${Date.now()}`,
      name: trimmedName,
      slug: toScenarioSlug(trimmedName),
      steps: workflowSteps.map((row) => ({
        scenario: row.scenario,
        stepNumber: row.stepNumber,
        stepName: row.stepName,
        selectedStep: row.selectedStep,
      })),
    };

    const stored = window.localStorage.getItem("custom-scenarios");
    const existing: Array<{ id: string; name: string; steps: unknown[] }> = stored ? JSON.parse(stored) : [];
    const nextScenarios = Array.isArray(existing) ? [...existing, customScenario] : [customScenario];
    window.localStorage.setItem("custom-scenarios", JSON.stringify(nextScenarios));

    router.push("/");
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Custom workflow builder</h1>
        <Link href="/" className="text-sm underline underline-offset-4 text-neutral-600 dark:text-neutral-400">
          Main page
        </Link>
      </div>

      <p className="mb-6 max-w-3xl text-neutral-600 dark:text-neutral-400">
        Select the steps you want to include in this custom workflow. Each selected step is removed from the dropdowns on the other rows so no step is duplicated.
      </p>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-neutral-100 dark:bg-neutral-900">
            <tr>
              <th className="px-3 py-3 font-medium">Include</th>
              <th className="px-3 py-3 font-medium">Scenario</th>
              <th className="px-3 py-3 font-medium">Step</th>
              <th className="px-3 py-3 font-medium">Original step</th>
              <th className="px-3 py-3 font-medium">Selected step</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const dropdownOptions = allStepNumbers.filter((stepNumber) => {
                if (row.selectedStep === stepNumber) return true;
                return !selectedStepIds.has(stepNumber);
              });

              return (
                <tr key={row.id} className="border-t border-neutral-200 dark:border-neutral-800 align-top">
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={row.checked}
                      onChange={(event) => toggleRow(row.id, event.target.checked)}
                      className="h-4 w-4 accent-orange-600"
                    />
                  </td>
                  <td className="px-3 py-3">{SCENARIO_LABELS[row.scenario]}</td>
                  <td className="px-3 py-3 font-medium">{row.stepNumber}</td>
                  <td className="px-3 py-3">{row.stepName}</td>
                  <td className="px-3 py-3">
                    <select
                      value={row.selectedStep}
                      onChange={(event) => updateSelectedStep(row.id, event.target.value)}
                      disabled={!row.checked}
                      className="w-full max-w-md rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select a step…</option>
                      {dropdownOptions.map((stepNumber) => (
                        <option key={stepNumber} value={stepNumber}>
                          Step {stepNumber}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hasStepOrderError && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">
          Please check the steps order.
        </p>
      )}
      {hasMissingPrerequisites && !allRequiredUploadsSelected && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">
          Please select all prerequisite steps or upload all required documents for the chosen scenario steps.
        </p>
      )}

      {hasSelectedRows && (
        <section className="mt-6 border-t border-neutral-200 pt-6 dark:border-neutral-800">
          {prerequisiteSteps.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold">Prerequisite steps</h2>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-neutral-700 dark:text-neutral-300">
                {prerequisiteSteps.map((step) => (
                  <li key={`${step.scenario}-${step.stepNumber}`}>
                    {SCENARIO_LABELS[step.scenario]} - Step {step.stepNumber}: {step.stepName}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className={prerequisiteSteps.length > 0 ? "mt-6" : ""}>
            <h2 className="text-lg font-semibold">Required uploads</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {selectedScenarios.flatMap((scenario) =>
                UPLOAD_REQUIREMENTS[scenario].map((requirement) => (
                  <label key={`${scenario}-${requirement.key}`} className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">
                      {SCENARIO_LABELS[scenario]}: {requirement.label}
                    </span>
                    <input
                      type="file"
                      accept=".docx,.pdf,.txt,.md"
                      multiple={requirement.multiple}
                      onChange={(event) =>
                        setUploadedFiles((currentFiles) => ({
                          ...currentFiles,
                          [`${scenario}-${requirement.key}`]: Array.from(event.target.files ?? []),
                        }))
                      }
                      className="block w-full text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 file:mr-3 file:border-0 file:bg-neutral-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white dark:file:bg-neutral-100 dark:file:text-neutral-900"
                    />
                  </label>
                )),
              )}
            </div>
          </div>
        </section>
      )}

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          disabled={!canGenerateScenario}
          onClick={handleGenerateScenario}
          className="rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-neutral-400"
        >
          Generate scenario
        </button>
      </div>
    </main>
  );
}
