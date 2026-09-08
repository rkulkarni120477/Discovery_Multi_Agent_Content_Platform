import { notFound } from "next/navigation";
import { ManualJobDetail } from "@/components/ManualJobDetail";

const scenarios = new Set(["Scenario1", "Scenario2", "Scenario3"]);

export default async function ManualJobPage({ params }: { params: Promise<{ scenario: string; id: string }> }) {
  const { scenario } = await params;
  if (!scenarios.has(scenario)) notFound();
  return <ManualJobDetail scenario={scenario.toLowerCase() as "scenario1" | "scenario2" | "scenario3"} />;
}