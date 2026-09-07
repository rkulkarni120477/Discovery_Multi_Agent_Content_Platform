import { readFile } from "node:fs/promises";
import path from "node:path";
import { extractText } from "./fileParser";
import type { ParsedDocument } from "../types";

const SOURCE_DIRECTORY = path.resolve(__dirname, "../../../Documents/Scenario 1");
const PERFORMANCE_TARGETS_FILENAME = "state_performance_targets_k5.pdf";
const VERTICAL_ARTICULATION_FILENAME = "south_carolina_k5_vertical_articulation.pdf";

async function readPdf(filename: string, label: string): Promise<ParsedDocument> {
  const sourcePath = path.join(SOURCE_DIRECTORY, filename);
  let buffer: Buffer;
  try {
    buffer = await readFile(sourcePath);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown file error";
    throw new Error(`Could not read ${label} PDF at ${sourcePath}: ${message}`);
  }

  return { filename, text: await extractText(filename, buffer) };
}

export async function getSouthCarolinaScienceSources(): Promise<{
  performanceTargets: ParsedDocument;
  verticalArticulation: ParsedDocument;
}> {
  const [performanceTargets, verticalArticulation] = await Promise.all([
    readPdf(PERFORMANCE_TARGETS_FILENAME, "South Carolina performance targets"),
    readPdf(VERTICAL_ARTICULATION_FILENAME, "South Carolina vertical articulation"),
  ]);
  return { performanceTargets, verticalArticulation };
}