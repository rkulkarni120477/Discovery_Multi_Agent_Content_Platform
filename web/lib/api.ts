import type { FinalPackage, JobStatus, JobSummary, Scenario1FinalPackage, Scenario3FinalPackage } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(body.error || `Request failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function createScenario1Job(files: {
  existing_product_content: File;
  sc_standards_reference: File;
}): Promise<{ job_id: string; status: string }> {
  const form = new FormData();
  form.append("existing_product_content", files.existing_product_content);
  form.append("sc_standards_reference", files.sc_standards_reference);
  const response = await fetch(`${API_BASE}/api/scenario1/jobs`, { method: "POST", body: form });
  return handle(response);
}

export async function createScenario2Job(files: {
  lesson_1: File;
  lesson_2: File;
  lesson_3: File;
  literacy_strategy: File;
}): Promise<{ job_id: string; status: string }> {
  const form = new FormData();
  form.append("lesson_1", files.lesson_1);
  form.append("lesson_2", files.lesson_2);
  form.append("lesson_3", files.lesson_3);
  form.append("literacy_strategy", files.literacy_strategy);
  const response = await fetch(`${API_BASE}/api/jobs`, { method: "POST", body: form });
  return handle(response);
}

export async function createScenario3Job(files: {
  scope_sequence: File;
  standards_reference: File;
  lesson_files: File[];
}): Promise<{ job_id: string; status: string }> {
  const form = new FormData();
  form.append("scope_sequence", files.scope_sequence);
  form.append("standards_reference", files.standards_reference);
  for (const file of files.lesson_files) {
    form.append("lesson_files", file);
  }
  const response = await fetch(`${API_BASE}/api/scenario3/jobs`, { method: "POST", body: form });
  return handle(response);
}

export async function listJobs(): Promise<JobSummary[]> {
  const response = await fetch(`${API_BASE}/api/jobs`, { cache: "no-store" });
  return handle(response);
}

export async function getJobStatus(id: string): Promise<JobStatus> {
  const response = await fetch(`${API_BASE}/api/jobs/${id}`, { cache: "no-store" });
  return handle(response);
}

export async function resumeJob(id: string, value: unknown): Promise<JobStatus> {
  const response = await fetch(`${API_BASE}/api/jobs/${id}/resume`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value }),
  });
  return handle(response);
}

export async function getJobResult(
  id: string
): Promise<FinalPackage | Scenario1FinalPackage | Scenario3FinalPackage> {
  const response = await fetch(`${API_BASE}/api/jobs/${id}/result`, { cache: "no-store" });
  return handle(response);
}

export function getResultDocxUrl(id: string): string {
  return `${API_BASE}/api/jobs/${id}/result.docx`;
}

export async function deleteJob(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/jobs/${id}`, { method: "DELETE" });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(body.error || `Request failed with ${response.status}`);
  }
}
