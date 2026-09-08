import { notFound } from "next/navigation";
import Link from "next/link";
import { Scenario1UploadForm } from "@/components/Scenario1UploadForm";
import { Scenario2UploadForm } from "@/components/Scenario2UploadForm";
import { Scenario3UploadForm } from "@/components/Scenario3UploadForm";

const SCENARIOS = new Set(["Scenario1", "Scenario2", "Scenario3"]);

export default async function ManualScenarioPage({ params }: { params: Promise<{ scenario: string }> }) {
  const { scenario } = await params;
  if (!SCENARIOS.has(scenario)) notFound();

  const Form = scenario === "Scenario1" ? Scenario1UploadForm : scenario === "Scenario2" ? Scenario2UploadForm : Scenario3UploadForm;
  const scenarioKey = scenario.toLowerCase() as "scenario1" | "scenario2" | "scenario3";
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Manual {scenario}</h1>
        <Link href="/" className="text-sm underline underline-offset-4">Main page</Link>
      </div>
      <p className="mb-8 text-neutral-600 dark:text-neutral-400">Each step requires human approval before execution.</p>
      <Form manual={true} />
      <p className="mt-6 text-xs text-neutral-500">Workflow: {scenarioKey}</p>
    </main>
  );
}