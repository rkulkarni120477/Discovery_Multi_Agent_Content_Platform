"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

const SCENARIOS = [
  { value: "", scenario: "", label: "Select a scenario…" },
  { value: "/scenario1", scenario: "Scenario1", label: "Scenario 1 — NGSS-to-State Standards Crosswalk" },
  { value: "/scenario2", scenario: "Scenario2", label: "Scenario 2 — Literacy Strategy Integration" },
  { value: "/scenario3", scenario: "Scenario3", label: "Scenario 3 — State Standards Alignment" },
] as const;

export default function Home() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [manualExecution, setManualExecution] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setValue(next);
    const selectedScenario = SCENARIOS.find((scenario) => scenario.value === next)?.scenario;
    if (selectedScenario) {
      router.push(manualExecution ? `/Manual/${selectedScenario}` : next);
    }
  }

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-16">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-semibold">Multi-Agent Scenario Executor</h1>
        <Link href="/jobs" className="text-sm underline underline-offset-4 text-neutral-600 dark:text-neutral-400">
          View past runs
        </Link>
      </div>
      <p className="text-neutral-600 dark:text-neutral-400 mb-8 max-w-xl">
        Choose which multi-agent workflow to run. Each scenario uploads its own source documents to
        a dedicated LangGraph pipeline and pauses for your review at the judgment calls the
        workflow can't safely automate on its own.
      </p>

      <label className="mb-5 flex w-fit items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
        <input
          type="checkbox"
          checked={manualExecution}
          onChange={(e) => setManualExecution(e.target.checked)}
          className="h-4 w-4 accent-orange-600"
        />
        Manual Execution
      </label>

      <label className="flex flex-col gap-1.5 max-w-md">
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Scenario</span>
        <select
          value={value}
          onChange={handleChange}
          className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white
                     dark:bg-neutral-900 px-3 py-2.5 text-sm"
        >
          {SCENARIOS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
    </main>
  );
}
