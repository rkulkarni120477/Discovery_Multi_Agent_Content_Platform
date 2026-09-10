"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type CustomScenario = {
  id: string;
  name: string;
  slug?: string;
};

const STORAGE_KEY = "custom-scenarios";

function toScenarioSlug(name: string) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "custom-scenario";
}

const BASE_SCENARIOS = [
  { value: "", scenario: "", label: "Select a scenario…" },
  { value: "/scenario1", scenario: "Scenario1", label: "Scenario 1 — NGSS-to-State Standards Crosswalk" },
  { value: "/scenario2", scenario: "Scenario2", label: "Scenario 2 — Literacy Strategy Integration" },
  { value: "/scenario3", scenario: "Scenario3", label: "Scenario 3 — State Standards Alignment" },
  { value: "/custom", scenario: "Custom", label: "Custom" },
] as const;

export default function Home() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [manualExecution, setManualExecution] = useState(false);
  const [customScenarios, setCustomScenarios] = useState<CustomScenario[]>([]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as CustomScenario[];
      if (Array.isArray(parsed)) {
        const scenarios = parsed.map((scenario) => ({
          ...scenario,
          slug: scenario.slug ?? toScenarioSlug(scenario.name),
        }));
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
        setCustomScenarios(scenarios);
      }
    } catch {
      setCustomScenarios([]);
    }
  }, []);

  const SCENARIOS = useMemo(
    () => [
      ...BASE_SCENARIOS,
      ...customScenarios.map((scenario) => ({
        value: `/${scenario.slug ?? toScenarioSlug(scenario.name)}`,
        scenario: "Custom",
        label: scenario.name,
      })),
    ],
    [customScenarios],
  );

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setValue(next);

    if (!next) return;

    if (next === "/custom") {
      router.push("/custom");
      return;
    }

    const selectedScenario = SCENARIOS.find((scenario) => scenario.value === next)?.scenario;
    if (!selectedScenario) return;

    router.push(selectedScenario === "Custom" ? next : manualExecution ? `/Manual/${selectedScenario}` : next);
  }

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-16">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <Image
            src="/images/CourseCraft.jpg"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 rounded-md object-cover"
          />
          <h1 className="text-2xl font-semibold">Academian CourseCraft AI</h1>
        </div>
        <Link href="/jobs" className="text-sm underline underline-offset-4 text-neutral-600 dark:text-neutral-400">
          View past runs
        </Link>
      </div>
      <p className="text-neutral-600 dark:text-neutral-400 mb-8 max-w-xl text-justify">
        The Curriculum Intelligence Platform is an enterprise-grade solution designed to automate
        and standardize end-to-end curriculum lifecycle management. By leveraging intelligent
        workflows, advanced retrieval-augmented generation (RAG), and custom microservices, it
        seamlessly aligns content to state standards, integrates instructional strategies, and
        performs automated gap analyses. The platform embeds AI guardrails alongside
        human-in-the-loop review mechanisms to ensure precise, traceable, and high-quality
        educational outputs. Built on a cloud-native, API-first architecture, it provides
        educational organizations with a scalable, secure, and future-ready foundation to
        accelerate content delivery while maintaining strict compliance.
      </p>

      <label className="mb-5 flex w-fit items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
        <input
          type="checkbox"
          checked={manualExecution}
          onChange={(e) => setManualExecution(e.target.checked)}
          className="h-4 w-4 accent-orange-600"
        />
        Semi-Agentic Execution
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
