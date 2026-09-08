import crypto from "node:crypto";
import { Router } from "express";
import multer from "multer";
import { createJob, deleteJob, getJob, updateJobStatus } from "../db";
import * as agent from "../services/agentClient";
import { extractText } from "../services/fileParser";
import { getSouthCarolinaScienceSources } from "../services/scScienceSources";
import type { ParsedDocument, Scenario1DocumentKey, Scenario2DocumentKey, ScenarioKey } from "../types";
import { SCENARIO1_DOCUMENT_KEYS, SCENARIO2_DOCUMENT_KEYS } from "../types";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });
export const manualJobsRouter = Router();

async function parsed(file: Express.Multer.File): Promise<ParsedDocument> {
  return { filename: file.originalname, text: await extractText(file.originalname, file.buffer) };
}

function scenarioFromParam(value: string): ScenarioKey | null {
  return value === "scenario1" || value === "scenario2" || value === "scenario3" ? value : null;
}

manualJobsRouter.post(
  "/scenario1/jobs",
  upload.fields(SCENARIO1_DOCUMENT_KEYS.map((key) => ({ name: key, maxCount: 1 }))),
  async (req, res) => {
    const files = req.files as Record<Scenario1DocumentKey, Express.Multer.File[]> | undefined;
    const missing = SCENARIO1_DOCUMENT_KEYS.filter((key) => !files?.[key]?.[0]);
    if (missing.length) { res.status(400).json({ error: `Missing required file(s): ${missing.join(", ")}` }); return; }
    try {
      const documents: Record<string, ParsedDocument> = {};
      const filenames: Record<string, string> = {};
      for (const key of SCENARIO1_DOCUMENT_KEYS) { documents[key] = await parsed(files![key][0]); filenames[key] = documents[key].filename; }
      const sources = await getSouthCarolinaScienceSources();
      documents.sc_performance_targets = sources.performanceTargets;
      documents.sc_vertical_articulation = sources.verticalArticulation;
      filenames.sc_performance_targets = sources.performanceTargets.filename;
      filenames.sc_vertical_articulation = sources.verticalArticulation.filename;
      const jobId = crypto.randomUUID();
      createJob(jobId, "scenario1", filenames, "manual");
      await agent.startManualRun("scenario1", jobId, documents);
      res.status(201).json({ job_id: jobId, status: "paused" });
    } catch (err) { res.status(502).json({ error: err instanceof Error ? err.message : "Failed to start manual job" }); }
  }
);

manualJobsRouter.post(
  "/scenario2/jobs",
  upload.fields(SCENARIO2_DOCUMENT_KEYS.map((key) => ({ name: key, maxCount: 1 }))),
  async (req, res) => {
    const files = req.files as Record<Scenario2DocumentKey, Express.Multer.File[]> | undefined;
    const missing = SCENARIO2_DOCUMENT_KEYS.filter((key) => !files?.[key]?.[0]);
    if (missing.length) { res.status(400).json({ error: `Missing required file(s): ${missing.join(", ")}` }); return; }
    try {
      const documents: Record<string, ParsedDocument> = {};
      const filenames: Record<string, string> = {};
      for (const key of SCENARIO2_DOCUMENT_KEYS) { documents[key] = await parsed(files![key][0]); filenames[key] = documents[key].filename; }
      const jobId = crypto.randomUUID();
      createJob(jobId, "scenario2", filenames, "manual");
      await agent.startManualRun("scenario2", jobId, documents);
      res.status(201).json({ job_id: jobId, status: "paused" });
    } catch (err) { res.status(502).json({ error: err instanceof Error ? err.message : "Failed to start manual job" }); }
  }
);

manualJobsRouter.post(
  "/scenario3/jobs",
  upload.fields([{ name: "scope_sequence", maxCount: 1 }, { name: "standards_reference", maxCount: 1 }, { name: "lesson_files", maxCount: 20 }]),
  async (req, res) => {
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    const scope = files?.scope_sequence?.[0];
    const standards = files?.standards_reference?.[0];
    const lessons = files?.lesson_files ?? [];
    if (!scope || !standards || !lessons.length) { res.status(400).json({ error: "scope_sequence, standards_reference, and lesson_files are required" }); return; }
    try {
      const scopeDoc = await parsed(scope);
      const standardsDoc = await parsed(standards);
      const lessonDocs = await Promise.all(lessons.map(parsed));
      const jobId = crypto.randomUUID();
      createJob(jobId, "scenario3", { scope_sequence: scopeDoc.filename, standards_reference: standardsDoc.filename, lesson_files: lessonDocs.map((doc) => doc.filename) }, "manual");
      await agent.startManualRun("scenario3", jobId, { scope_sequence: scopeDoc, standards_reference: standardsDoc, lesson_files: lessonDocs });
      res.status(201).json({ job_id: jobId, status: "paused" });
    } catch (err) { res.status(502).json({ error: err instanceof Error ? err.message : "Failed to start manual job" }); }
  }
);

manualJobsRouter.get("/:scenario/jobs/:id", async (req, res) => {
  const scenario = scenarioFromParam(req.params.scenario);
  const job = getJob(req.params.id);
  if (!scenario || !job || job.scenario !== scenario) { res.status(404).json({ error: "manual job not found" }); return; }
  try {
    const status = await agent.getManualRunStatus(scenario, job.id);
    updateJobStatus(job.id, status.status, status.phase, status.step);
    res.json({ ...status, job_id: job.id, scenario, created_at: job.created_at, updated_at: new Date().toISOString(), filenames: JSON.parse(job.filenames) });
  } catch (err) { res.status(502).json({ error: err instanceof Error ? err.message : "Failed to fetch manual status" }); }
});

manualJobsRouter.post("/:scenario/jobs/:id/approve", async (req, res) => {
  const scenario = scenarioFromParam(req.params.scenario);
  const job = getJob(req.params.id);
  if (!scenario || !job || job.scenario !== scenario) { res.status(404).json({ error: "manual job not found" }); return; }
  try { res.json(await agent.approveManualStep(scenario, job.id)); }
  catch (err) { res.status(409).json({ error: err instanceof Error ? err.message : "Failed to approve manual step" }); }
});

manualJobsRouter.post("/:scenario/jobs/:id/resume", async (req, res) => {
  const scenario = scenarioFromParam(req.params.scenario);
  const job = getJob(req.params.id);
  if (!scenario || !job || job.scenario !== scenario) { res.status(404).json({ error: "manual job not found" }); return; }
  try { res.json(await agent.resumeManualCheckpoint(scenario, job.id, req.body?.value ?? null)); }
  catch (err) { res.status(409).json({ error: err instanceof Error ? err.message : "Failed to resume manual workflow" }); }
});

manualJobsRouter.get("/:scenario/jobs/:id/result", async (req, res) => {
  const scenario = scenarioFromParam(req.params.scenario);
  const job = getJob(req.params.id);
  if (!scenario || !job || job.scenario !== scenario) { res.status(404).json({ error: "manual job not found" }); return; }
  try { res.json(await agent.getManualRunResult(scenario, job.id)); }
  catch (err) { res.status(409).json({ error: err instanceof Error ? err.message : "Failed to fetch manual result" }); }
});
