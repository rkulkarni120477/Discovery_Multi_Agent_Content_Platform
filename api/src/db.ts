import fs from "node:fs";
import path from "node:path";
import type { JobExecutionMode, JobRecord, ScenarioKey } from "./types";

// A flat JSON file is enough here: this table only stores lightweight job bookkeeping (id,
// status, filenames, timestamps). The actual workflow state of record lives in the agent
// service's LangGraph checkpointer, so this store never needs relational queries — avoiding a
// native-module dependency (e.g. better-sqlite3, which requires a C++ build toolchain that isn't
// guaranteed to be present on every dev machine) keeps `npm install` friction-free.

const dbPath = process.env.DB_PATH || "./data/jobs.json";
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

function readAll(): Record<string, JobRecord> {
  if (!fs.existsSync(dbPath)) return {};
  const raw = fs.readFileSync(dbPath, "utf-8").trim();
  const jobs = raw ? (JSON.parse(raw) as Record<string, JobRecord>) : {};

  // One-time migration: job records created before Scenario 3 existed have no `scenario` field.
  // Every one of them was necessarily created by the (then only) Scenario 2 endpoint, so that's a
  // safe, non-lossy default -- and it matters in practice, not just in theory: real in-progress
  // runs (including ones paused at a live checkpoint) can exist in this file from before the
  // upgrade, so silently dropping or misrouting them would lose a reviewer's pending work.
  let migrated = false;
  for (const job of Object.values(jobs)) {
    if (!job.scenario) {
      job.scenario = "scenario2";
      migrated = true;
    }
    if (!job.execution_mode) {
      job.execution_mode = "automated";
      migrated = true;
    }
  }
  if (migrated) writeAll(jobs);

  return jobs;
}

function writeAll(jobs: Record<string, JobRecord>): void {
  fs.writeFileSync(dbPath, JSON.stringify(jobs, null, 2), "utf-8");
}

export function createJob(
  id: string,
  scenario: ScenarioKey,
  filenames: Record<string, unknown>,
  execution_mode: JobExecutionMode = "automated"
): JobRecord {
  const now = new Date().toISOString();
  const record: JobRecord = {
    id,
    scenario,
    execution_mode,
    status: "running",
    phase: null,
    step: null,
    created_at: now,
    updated_at: now,
    filenames: JSON.stringify(filenames),
  };
  const jobs = readAll();
  jobs[id] = record;
  writeAll(jobs);
  return record;
}

export function updateJobStatus(id: string, status: string, phase: string | null, step: number | null): void {
  const jobs = readAll();
  const existing = jobs[id];
  if (!existing) return;
  jobs[id] = { ...existing, status, phase, step, updated_at: new Date().toISOString() };
  writeAll(jobs);
}

export function getJob(id: string): JobRecord | undefined {
  return readAll()[id];
}

export function deleteJob(id: string): void {
  const jobs = readAll();
  delete jobs[id];
  writeAll(jobs);
}

export function listJobs(): JobRecord[] {
  return Object.values(readAll()).sort((a, b) => b.created_at.localeCompare(a.created_at));
}
