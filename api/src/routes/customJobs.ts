import crypto from "node:crypto";
import { Router } from "express";
import multer from "multer";
import { createJob, deleteJob, getJob, updateJobStatus } from "../db";
import * as agent from "../services/agentClient";
import { extractText } from "../services/fileParser";
import { getSouthCarolinaScienceSources } from "../services/scScienceSources";
import type { ParsedDocument, ScenarioKey } from "../types";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });
export const customJobsRouter = Router();

const CUSTOM_UPLOAD_FIELDS = [
  { name: "scenario1_existing_product_content", maxCount: 1 },
  { name: "scenario1_sc_standards_reference", maxCount: 1 },
  { name: "scenario2_lesson", maxCount: 1 },
  { name: "scenario2_literacy_strategy", maxCount: 1 },
  { name: "scenario3_scope_sequence", maxCount: 1 },
  { name: "scenario3_standards_reference", maxCount: 1 },
  { name: "scenario3_lesson_files", maxCount: 20 },
] as const;

// These are the automated nodes in the source manual graphs. Review checkpoints and guide-only
// planning subdivisions intentionally have no entry because a custom workflow approves every node.
const AUTOMATED_SOURCE_NODES: Record<ScenarioKey, Partial<Record<number, string>>> = {
  scenario1: {
    1: "inventory_ngss_alignment", 2: "crosswalk_ngss_to_sc", 3: "identify_sc_deltas",
    4: "map_performance_targets", 5: "validate_grade_level_depth", 6: "define_alignment_criteria",
    7: "review_discovery_evidence", 8: "classify_strong_partial_gap", 9: "identify_specific_gaps",
    10: "recommend_remediation", 11: "qa_and_finalize",
  },
  scenario2: {
    1: "intake", 2: "catalog_metadata", 3: "extract_strategies", 4: "summarize_lessons",
    5: "analyze_strategies", 6: "screen_combinations", 8: "deep_review", 9: "map_literacy_demands",
    10: "find_integration_points", 14: "plan_revision", 15: "draft_student_content",
    16: "draft_teacher_content", 17: "update_connected_components", 18: "write_rationale",
    19: "qa_literacy_fidelity", 20: "qa_science_accuracy", 21: "qa_instructional_integrity",
    22: "qa_coherence_pacing", 23: "qa_consistency", 25: "incorporate_feedback",
    26: "re_review", 27: "finalize",
  },
  scenario3: {
    1: "identify_grade_level", 2: "acquire_standards", 3: "extract_c3_alignment", 4: "build_crosswalk",
    6: "summarize_lessons", 7: "map_to_standards", 9: "compile_gap_list", 10: "identify_surplus",
    11: "plan_and_place_revisions", 13: "draft_content", 14: "write_rationale",
    15: "update_scope_sequence", 16: "coherence_review",
  },
};

type WorkflowStep = { scenario: ScenarioKey; stepNumber: number; selectedStep: number };

function sourceScenario(value: unknown): ScenarioKey | null {
  return value === "scenario1" || value === "scenario2" || value === "scenario3" ? value : null;
}

function parseWorkflow(value: unknown): WorkflowStep[] {
  if (typeof value !== "string") throw new Error("workflow is required");
  const parsed = JSON.parse(value) as unknown;
  if (!Array.isArray(parsed) || !parsed.length) throw new Error("workflow must contain at least one step");
  const steps = parsed.map((item): WorkflowStep => {
    if (!item || typeof item !== "object") throw new Error("workflow contains an invalid step");
    const step = item as Record<string, unknown>;
    const scenario = sourceScenario(step.scenario);
    if (!scenario || !Number.isInteger(step.stepNumber) || !Number.isInteger(step.selectedStep)) {
      throw new Error("workflow step must include scenario, stepNumber, and selectedStep");
    }
    return { scenario, stepNumber: step.stepNumber as number, selectedStep: step.selectedStep as number };
  }).sort((first, second) => first.selectedStep - second.selectedStep);
  if (steps.some((step, index) => step.selectedStep !== index + 1)) throw new Error("workflow selectedStep values must be consecutive from 1");
  return steps;
}

async function parsed(file: Express.Multer.File): Promise<ParsedDocument> {
  return { filename: file.originalname, text: await extractText(file.originalname, file.buffer) };
}

function requiredFile(files: Record<string, Express.Multer.File[]> | undefined, key: string): Express.Multer.File {
  const file = files?.[key]?.[0];
  if (!file) throw new Error(`Missing required file: ${key}`);
  return file;
}

customJobsRouter.post("/jobs", upload.fields([...CUSTOM_UPLOAD_FIELDS]), async (req, res) => {
  try {
    const workflow = parseWorkflow(req.body.workflow);
    const selectedScenarios = new Set(workflow.map((step) => step.scenario));
    const selectedSteps = workflow.map((step) => {
      const node = AUTOMATED_SOURCE_NODES[step.scenario][step.stepNumber];
      if (!node) throw new Error(`${step.scenario} step ${step.stepNumber} is a review or non-executable guide step`);
      return { scenario: step.scenario, node };
    });
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    const sourceStates: Record<string, Record<string, unknown>> = {};
    const filenames: Record<string, unknown> = {};

    if (selectedScenarios.has("scenario1")) {
      const existing = await parsed(requiredFile(files, "scenario1_existing_product_content"));
      const standards = await parsed(requiredFile(files, "scenario1_sc_standards_reference"));
      const sources = await getSouthCarolinaScienceSources();
      sourceStates.scenario1 = { documents: { existing_product_content: existing, sc_standards_reference: standards, sc_performance_targets: sources.performanceTargets, sc_vertical_articulation: sources.verticalArticulation } };
      filenames.scenario1 = { existing_product_content: existing.filename, sc_standards_reference: standards.filename, sc_performance_targets: sources.performanceTargets.filename, sc_vertical_articulation: sources.verticalArticulation.filename };
    }
    if (selectedScenarios.has("scenario2")) {
      const lesson = await parsed(requiredFile(files, "scenario2_lesson"));
      const strategy = await parsed(requiredFile(files, "scenario2_literacy_strategy"));
      sourceStates.scenario2 = { documents: { lesson, literacy_strategy: strategy } };
      filenames.scenario2 = { lesson: lesson.filename, literacy_strategy: strategy.filename };
    }
    if (selectedScenarios.has("scenario3")) {
      const scope = await parsed(requiredFile(files, "scenario3_scope_sequence"));
      const standards = await parsed(requiredFile(files, "scenario3_standards_reference"));
      const lessons = await Promise.all((files?.scenario3_lesson_files ?? []).map(parsed));
      if (!lessons.length) throw new Error("Missing required file: scenario3_lesson_files");
      sourceStates.scenario3 = { documents: { scope_sequence: scope, standards_reference: standards, lesson_files: lessons } };
      filenames.scenario3 = { scope_sequence: scope.filename, standards_reference: standards.filename, lesson_files: lessons.map((lesson) => lesson.filename) };
    }

    const jobId = crypto.randomUUID();
    createJob(jobId, "custom", filenames, "manual");
    try {
      await agent.startCustomRun(jobId, selectedSteps, sourceStates);
    } catch (error) {
      deleteJob(jobId);
      throw error;
    }
    res.status(201).json({ job_id: jobId, status: "running" });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Failed to start custom job" });
  }
});

customJobsRouter.get("/jobs/:id", async (req, res) => {
  const job = getJob(req.params.id);
  if (!job || job.scenario !== "custom") { res.status(404).json({ error: "custom job not found" }); return; }
  try {
    const status = await agent.getCustomRunStatus(job.id);
    updateJobStatus(job.id, status.status, status.phase, status.step);
    res.json({ ...status, job_id: job.id, scenario: "custom", created_at: job.created_at, updated_at: new Date().toISOString(), filenames: JSON.parse(job.filenames) });
  } catch (err) { res.status(502).json({ error: err instanceof Error ? err.message : "Failed to fetch custom status" }); }
});

customJobsRouter.post("/jobs/:id/approve", async (req, res) => {
  const job = getJob(req.params.id);
  if (!job || job.scenario !== "custom") { res.status(404).json({ error: "custom job not found" }); return; }
  try { res.json(await agent.approveCustomStep(job.id)); }
  catch (err) { res.status(409).json({ error: err instanceof Error ? err.message : "Failed to approve custom step" }); }
});

customJobsRouter.post("/jobs/:id/resume", async (req, res) => {
  const job = getJob(req.params.id);
  if (!job || job.scenario !== "custom") { res.status(404).json({ error: "custom job not found" }); return; }
  try { res.json(await agent.resumeCustomRun(job.id, req.body?.value ?? null)); }
  catch (err) { res.status(409).json({ error: err instanceof Error ? err.message : "Failed to resume custom workflow" }); }
});