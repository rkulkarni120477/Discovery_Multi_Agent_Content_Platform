import crypto from "node:crypto";
import { Router } from "express";
import multer from "multer";
import { createJob, deleteJob, getJob, listJobs, updateJobStatus } from "../db";
import * as agent from "../services/agentClient";
import {
  buildFinalPackageDocx,
  buildScenario1FinalPackageDocx,
  buildScenario3FinalPackageDocx,
} from "../services/docExport";
import { extractText } from "../services/fileParser";
import type {
  DocumentKey,
  FinalPackage,
  JobStatusResponse,
  ParsedDocument,
  Scenario1FinalPackage,
  Scenario3FinalPackage,
} from "../types";
import { DOCUMENT_KEYS } from "../types";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

export const jobsRouter = Router();

/**
 * @openapi
 * /api/jobs:
 *   post:
 *     summary: Start a Scenario 2 run
 *     description: >
 *       Uploads the three candidate Explore lessons plus the literacy-strategy resource
 *       (.docx, .pdf, .txt, or .md), extracts their text, and starts a run on the agent service.
 *     tags: [jobs]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [lesson_1, lesson_2, lesson_3, literacy_strategy]
 *             properties:
 *               lesson_1: { type: string, format: binary }
 *               lesson_2: { type: string, format: binary }
 *               lesson_3: { type: string, format: binary }
 *               literacy_strategy: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Run started
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/JobCreateResponse' }
 *       400:
 *         description: One or more required files were missing
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       502:
 *         description: The agent service rejected or could not be reached to start the run
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
jobsRouter.post(
  "/",
  upload.fields(DOCUMENT_KEYS.map((key) => ({ name: key, maxCount: 1 }))),
  async (req, res) => {
    const files = req.files as Record<DocumentKey, Express.Multer.File[]> | undefined;
    const missing = DOCUMENT_KEYS.filter((key) => !files?.[key]?.[0]);
    if (missing.length > 0) {
      res.status(400).json({ error: `Missing required file(s): ${missing.join(", ")}` });
      return;
    }

    try {
      const documents = {} as Record<DocumentKey, ParsedDocument>;
      const filenames: Record<string, string> = {};
      for (const key of DOCUMENT_KEYS) {
        const file = files![key][0];
        const text = await extractText(file.originalname, file.buffer);
        documents[key] = { filename: file.originalname, text };
        filenames[key] = file.originalname;
      }

      const jobId = crypto.randomUUID();
      createJob(jobId, "scenario2", filenames);
      try {
        const runStatus = await agent.startScenario2Run(jobId, documents);
        updateJobStatus(jobId, runStatus.status, null, null);
        res.status(201).json({ job_id: jobId, status: runStatus.status });
      } catch (err) {
        // The job record was created locally but the agent never accepted the run — don't leave
        // a phantom "running" job behind for the dashboard to show forever.
        deleteJob(jobId);
        throw err;
      }
    } catch (err) {
      res.status(502).json({ error: err instanceof Error ? err.message : "Failed to start job" });
    }
  }
);

/**
 * @openapi
 * /api/jobs:
 *   get:
 *     summary: List runs
 *     description: Dashboard listing of every job this API instance has created, newest first.
 *     tags: [jobs]
 *     responses:
 *       200:
 *         description: List of jobs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/JobSummary' }
 */
jobsRouter.get("/", (_req, res) => {
  const jobs = listJobs().map((job) => ({
    id: job.id,
    scenario: job.scenario,
    status: job.status,
    phase: job.phase,
    step: job.step,
    created_at: job.created_at,
    updated_at: job.updated_at,
    filenames: JSON.parse(job.filenames),
  }));
  res.json(jobs);
});

/**
 * @openapi
 * /api/jobs/{id}:
 *   get:
 *     summary: Get run status
 *     description: >
 *       Current phase/step, and — when paused — the interrupt_type and interrupt_payload the
 *       reviewer needs to render (fit matrix, integration candidates, or QA findings).
 *     tags: [jobs]
 *     parameters:
 *       - $ref: '#/components/parameters/JobId'
 *     responses:
 *       200:
 *         description: Job status
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/JobStatusResponse' }
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       502:
 *         description: The agent service could not be reached
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
jobsRouter.get("/:id", async (req, res) => {
  const job = getJob(req.params.id);
  if (!job) {
    res.status(404).json({ error: "job not found" });
    return;
  }
  try {
    const status = await agent.getRunStatus(job.scenario, req.params.id);
    updateJobStatus(job.id, status.status, status.phase, status.step);
    const response: JobStatusResponse = {
      ...status,
      job_id: job.id,
      scenario: job.scenario,
      created_at: job.created_at,
      updated_at: new Date().toISOString(),
      filenames: JSON.parse(job.filenames),
    };
    res.json(response);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Failed to fetch status" });
  }
});

/**
 * @openapi
 * /api/jobs/{id}/resume:
 *   post:
 *     summary: Submit a human decision to resume a paused run
 *     description: >
 *       Only valid while the run is paused at one of the three checkpoints (select_combination,
 *       select_integration_point, review_qa_feedback). Pass value: null to accept the AI's
 *       recommendation as-is.
 *     tags: [jobs]
 *     parameters:
 *       - $ref: '#/components/parameters/JobId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ResumeRequest' }
 *     responses:
 *       200:
 *         description: Updated job status after resuming
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/JobStatusResponse' }
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       502:
 *         description: The agent service could not be reached, or rejected the resume
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
jobsRouter.post("/:id/resume", async (req, res) => {
  const job = getJob(req.params.id);
  if (!job) {
    res.status(404).json({ error: "job not found" });
    return;
  }
  try {
    const status = await agent.resumeRun(job.scenario, req.params.id, req.body?.value ?? null);
    updateJobStatus(job.id, status.status, status.phase, status.step);
    res.json(status);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Failed to resume job" });
  }
});

/**
 * @openapi
 * /api/jobs/{id}/result:
 *   get:
 *     summary: Get the final revision package
 *     description: Only available once the run's status is "complete".
 *     tags: [jobs]
 *     parameters:
 *       - $ref: '#/components/parameters/JobId'
 *     responses:
 *       200:
 *         description: Final package (shape depends on the job's scenario)
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/Scenario1FinalPackage'
 *                 - $ref: '#/components/schemas/FinalPackage'
 *                 - $ref: '#/components/schemas/Scenario3FinalPackage'
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       502:
 *         description: The agent service could not be reached, or the run isn't complete yet
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
jobsRouter.get("/:id/result", async (req, res) => {
  const job = getJob(req.params.id);
  if (!job) {
    res.status(404).json({ error: "job not found" });
    return;
  }
  try {
    const result = await agent.getRunResult(job.scenario, req.params.id);
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Failed to fetch result" });
  }
});

/**
 * @openapi
 * /api/jobs/{id}/result.docx:
 *   get:
 *     summary: Download the final revision package as a .docx file
 *     description: Only available once the run's status is "complete".
 *     tags: [jobs]
 *     parameters:
 *       - $ref: '#/components/parameters/JobId'
 *     responses:
 *       200:
 *         description: The .docx file
 *         content:
 *           application/vnd.openxmlformats-officedocument.wordprocessingml.document:
 *             schema: { type: string, format: binary }
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       502:
 *         description: The agent service could not be reached, the run isn't complete, or the docx failed to build
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
jobsRouter.get("/:id/result.docx", async (req, res) => {
  const job = getJob(req.params.id);
  if (!job) {
    res.status(404).json({ error: "job not found" });
    return;
  }
  try {
    const result = await agent.getRunResult(job.scenario, req.params.id);
    let buffer: Buffer;
    if (job.scenario === "scenario1") {
      buffer = await buildScenario1FinalPackageDocx(result as unknown as Scenario1FinalPackage);
    } else if (job.scenario === "scenario3") {
      buffer = await buildScenario3FinalPackageDocx(result as unknown as Scenario3FinalPackage);
    } else {
      buffer = await buildFinalPackageDocx(result as unknown as FinalPackage);
    }
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${job.scenario}-${job.id}.docx"`);
    res.send(buffer);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Failed to build docx" });
  }
});

/**
 * @openapi
 * /api/jobs/{id}:
 *   delete:
 *     summary: Delete a job
 *     description: >
 *       Removes the job from this API's dashboard/store. Does not affect the underlying agent
 *       checkpoint data (the run simply becomes unreachable through this API afterwards).
 *     tags: [jobs]
 *     parameters:
 *       - $ref: '#/components/parameters/JobId'
 *     responses:
 *       204:
 *         description: Deleted
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
jobsRouter.delete("/:id", (req, res) => {
  const job = getJob(req.params.id);
  if (!job) {
    res.status(404).json({ error: "job not found" });
    return;
  }
  deleteJob(req.params.id);
  res.status(204).send();
});
