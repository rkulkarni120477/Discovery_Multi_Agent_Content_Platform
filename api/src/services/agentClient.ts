import type { AgentRunStatus, ParsedDocument, ScenarioKey } from "../types";

const AGENT_URL = process.env.AGENT_SERVICE_URL || "http://localhost:8000";

async function agentFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${AGENT_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown connection error";
    throw new Error(`Agent service is not reachable at ${AGENT_URL}${path}: ${message}`);
  }
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Agent service ${path} returned ${response.status}: ${body}`);
  }
  return response.json() as Promise<T>;
}

export function startScenario1Run(
  jobId: string,
  documents: Record<
    | "existing_product_content"
    | "sc_standards_reference"
    | "sc_performance_targets"
    | "sc_vertical_articulation",
    ParsedDocument
  >
): Promise<{ run_id: string; status: string }> {
  return agentFetch("/scenario1/runs", {
    method: "POST",
    body: JSON.stringify({ job_id: jobId, ...documents }),
  });
}

export function startScenario2Run(
  jobId: string,
  documents: Record<"lesson" | "literacy_strategy", ParsedDocument>
): Promise<{ run_id: string; status: string }> {
  return agentFetch("/scenario2/runs", {
    method: "POST",
    body: JSON.stringify({ job_id: jobId, ...documents }),
  });
}

export function startScenario3Run(
  jobId: string,
  documents: {
    scope_sequence: ParsedDocument;
    standards_reference: ParsedDocument;
    lesson_files: ParsedDocument[];
  }
): Promise<{ run_id: string; status: string }> {
  return agentFetch("/scenario3/runs", {
    method: "POST",
    body: JSON.stringify({ job_id: jobId, ...documents }),
  });
}

export function getRunStatus(scenario: ScenarioKey, runId: string): Promise<AgentRunStatus> {
  return agentFetch(`/${scenario}/runs/${encodeURIComponent(runId)}`);
}

export function resumeRun(scenario: ScenarioKey, runId: string, value: unknown): Promise<AgentRunStatus> {
  return agentFetch(`/${scenario}/runs/${encodeURIComponent(runId)}/resume`, {
    method: "POST",
    body: JSON.stringify({ value }),
  });
}

export function pauseRun(scenario: ScenarioKey, runId: string): Promise<AgentRunStatus> {
  return agentFetch(`/${scenario}/runs/${encodeURIComponent(runId)}/pause`, { method: "POST" });
}

export function resumeWorkflow(scenario: ScenarioKey, runId: string): Promise<AgentRunStatus> {
  return agentFetch(`/${scenario}/runs/${encodeURIComponent(runId)}/resume-workflow`, { method: "POST" });
}

export function getRunResult(scenario: ScenarioKey, runId: string): Promise<Record<string, unknown>> {
  return agentFetch(`/${scenario}/runs/${encodeURIComponent(runId)}/result`);
}

export function startManualRun(scenario: ScenarioKey, runId: string, documents: Record<string, unknown>) {
  return agentFetch(`/manual/${scenario}/runs`, {
    method: "POST",
    body: JSON.stringify({ job_id: runId, ...documents }),
  });
}

export function getManualRunStatus(scenario: ScenarioKey, runId: string): Promise<AgentRunStatus> {
  return agentFetch(`/manual/${scenario}/runs/${encodeURIComponent(runId)}`);
}

export function approveManualStep(scenario: ScenarioKey, runId: string): Promise<AgentRunStatus> {
  return agentFetch(`/manual/${scenario}/runs/${encodeURIComponent(runId)}/approve`, { method: "POST" });
}

export function resumeManualCheckpoint(scenario: ScenarioKey, runId: string, value: unknown): Promise<AgentRunStatus> {
  return agentFetch(`/manual/${scenario}/runs/${encodeURIComponent(runId)}/resume`, {
    method: "POST",
    body: JSON.stringify({ value }),
  });
}

export function getManualRunResult(scenario: ScenarioKey, runId: string): Promise<Record<string, unknown>> {
  return agentFetch(`/manual/${scenario}/runs/${encodeURIComponent(runId)}/result`);
}

export function startCustomRun(
  runId: string,
  selectedSteps: Array<{ scenario: ScenarioKey; node: string }>,
  sourceStates: Record<string, Record<string, unknown>>,
): Promise<{ run_id: string; status: string }> {
  return agentFetch("/custom/runs", {
    method: "POST",
    body: JSON.stringify({ job_id: runId, selected_steps: selectedSteps, source_states: sourceStates }),
  });
}

export function getCustomRunStatus(runId: string): Promise<AgentRunStatus> {
  return agentFetch(`/custom/runs/${encodeURIComponent(runId)}`);
}

export function approveCustomStep(runId: string): Promise<AgentRunStatus> {
  return agentFetch(`/custom/runs/${encodeURIComponent(runId)}/approve`, { method: "POST" });
}

export function resumeCustomRun(runId: string, value: unknown): Promise<AgentRunStatus> {
  return agentFetch(`/custom/runs/${encodeURIComponent(runId)}/resume`, {
    method: "POST",
    body: JSON.stringify({ value }),
  });
}
