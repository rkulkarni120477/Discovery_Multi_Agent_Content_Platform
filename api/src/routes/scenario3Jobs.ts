import crypto from "node:crypto";
import { Router } from "express";
import multer from "multer";
import { createJob, deleteJob, updateJobStatus } from "../db";
import * as agent from "../services/agentClient";
import { extractText } from "../services/fileParser";
import type { ParsedDocument } from "../types";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

export const scenario3JobsRouter = Router();

/**
 * @openapi
 * /api/scenario3/jobs:
 *   post:
 *     summary: Start a Scenario 3 run
 *     description: >
 *       Uploads the scope-and-sequence document, an authoritative state-standards reference
 *       document, and one or more lesson/educator-support files (.docx, .pdf, .txt, or .md),
 *       extracts their text, and starts a run on the agent service. The status, resume, and
 *       result endpoints for a Scenario 3 job are the same unified endpoints Scenario 2 uses --
 *       GET/POST /api/jobs/{id}[/resume|/result] -- since every job id is globally unique and
 *       carries its own scenario tag.
 *     tags: [scenario3]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [scope_sequence, standards_reference, lesson_files]
 *             properties:
 *               scope_sequence: { type: string, format: binary }
 *               standards_reference: { type: string, format: binary }
 *               lesson_files:
 *                 type: array
 *                 items: { type: string, format: binary }
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
scenario3JobsRouter.post(
  "/",
  upload.fields([
    { name: "scope_sequence", maxCount: 1 },
    { name: "standards_reference", maxCount: 1 },
    { name: "lesson_files", maxCount: 20 },
  ]),
  async (req, res) => {
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    const scopeSequenceFile = files?.scope_sequence?.[0];
    const standardsReferenceFile = files?.standards_reference?.[0];
    const lessonFiles = files?.lesson_files ?? [];

    const missing: string[] = [];
    if (!scopeSequenceFile) missing.push("scope_sequence");
    if (!standardsReferenceFile) missing.push("standards_reference");
    if (lessonFiles.length === 0) missing.push("lesson_files (at least one)");
    if (missing.length > 0) {
      res.status(400).json({ error: `Missing required file(s): ${missing.join(", ")}` });
      return;
    }

    try {
      const scopeSequence: ParsedDocument = {
        filename: scopeSequenceFile!.originalname,
        text: await extractText(scopeSequenceFile!.originalname, scopeSequenceFile!.buffer),
      };
      const standardsReference: ParsedDocument = {
        filename: standardsReferenceFile!.originalname,
        text: await extractText(standardsReferenceFile!.originalname, standardsReferenceFile!.buffer),
      };
      const lessonDocs: ParsedDocument[] = [];
      for (const file of lessonFiles) {
        lessonDocs.push({
          filename: file.originalname,
          text: await extractText(file.originalname, file.buffer),
        });
      }

      const jobId = crypto.randomUUID();
      createJob(jobId, "scenario3", {
        scope_sequence: scopeSequence.filename,
        standards_reference: standardsReference.filename,
        lesson_files: lessonDocs.map((d) => d.filename),
      });
      try {
        const runStatus = await agent.startScenario3Run(jobId, {
          scope_sequence: scopeSequence,
          standards_reference: standardsReference,
          lesson_files: lessonDocs,
        });
        updateJobStatus(jobId, runStatus.status, null, null);
        res.status(201).json({ job_id: jobId, status: runStatus.status });
      } catch (err) {
        deleteJob(jobId);
        throw err;
      }
    } catch (err) {
      res.status(502).json({ error: err instanceof Error ? err.message : "Failed to start job" });
    }
  }
);
