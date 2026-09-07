import crypto from "node:crypto";
import { Router } from "express";
import multer from "multer";
import { createJob, deleteJob, updateJobStatus } from "../db";
import * as agent from "../services/agentClient";
import { extractText } from "../services/fileParser";
import { getSouthCarolinaScienceSources } from "../services/scScienceSources";
import type { ParsedDocument, Scenario1DocumentKey } from "../types";
import { SCENARIO1_DOCUMENT_KEYS } from "../types";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

export const scenario1JobsRouter = Router();

/**
 * @openapi
 * /api/scenario1/jobs:
 *   post:
 *     summary: Start a Scenario 1 run
 *     description: >
 *       Uploads the product's existing NGSS-aligned content, the target state's science standards
 *       reference (.docx, .pdf, .txt, or .md). The service downloads the configured official
 *       South Carolina performance-target and vertical-articulation PDFs. The agent extracts the
 *       implemented NGSS Performance Expectations from the product content before comparing them
 *       with the state standards. The status,
 *       resume, and result endpoints for a Scenario 1 job are the same unified endpoints
 *       Scenario 2/3 use -- GET/POST
 *       /api/jobs/{id}[/resume|/result] -- since every job id is globally unique and carries its
 *       own scenario tag.
 *     tags: [scenario1]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [existing_product_content, sc_standards_reference]
 *             properties:
 *               existing_product_content: { type: string, format: binary }
 *               sc_standards_reference: { type: string, format: binary }
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
scenario1JobsRouter.post(
  "/",
  upload.fields(SCENARIO1_DOCUMENT_KEYS.map((key) => ({ name: key, maxCount: 1 }))),
  async (req, res) => {
    const files = req.files as Record<Scenario1DocumentKey, Express.Multer.File[]> | undefined;
    const missing = SCENARIO1_DOCUMENT_KEYS.filter((key) => !files?.[key]?.[0]);
    if (missing.length > 0) {
      res.status(400).json({ error: `Missing required file(s): ${missing.join(", ")}` });
      return;
    }

    try {
      const documents = {} as Record<Scenario1DocumentKey, ParsedDocument>;
      const filenames: Record<string, string> = {};
      for (const key of SCENARIO1_DOCUMENT_KEYS) {
        const file = files![key][0];
        const text = await extractText(file.originalname, file.buffer);
        documents[key] = { filename: file.originalname, text };
        filenames[key] = file.originalname;
      }

      const sources = await getSouthCarolinaScienceSources();
      const agentDocuments = {
        ...documents,
        sc_performance_targets: sources.performanceTargets,
        sc_vertical_articulation: sources.verticalArticulation,
      };
      filenames.sc_performance_targets = sources.performanceTargets.filename;
      filenames.sc_vertical_articulation = sources.verticalArticulation.filename;

      const jobId = crypto.randomUUID();
      createJob(jobId, "scenario1", filenames);
      try {
        const runStatus = await agent.startScenario1Run(jobId, agentDocuments);
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
