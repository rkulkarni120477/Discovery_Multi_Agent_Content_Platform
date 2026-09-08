export type ScenarioKey = "scenario1" | "scenario2" | "scenario3";
export type JobExecutionMode = "automated" | "manual";

export const SCENARIO1_DOCUMENT_KEYS = [
  "existing_product_content",
  "sc_standards_reference",
] as const;
export type Scenario1DocumentKey = (typeof SCENARIO1_DOCUMENT_KEYS)[number];

export const SCENARIO2_DOCUMENT_KEYS = ["lesson", "literacy_strategy"] as const;
export type Scenario2DocumentKey = (typeof SCENARIO2_DOCUMENT_KEYS)[number];

export const SCENARIO3_SINGLE_FILE_KEYS = ["scope_sequence", "standards_reference"] as const;
export type Scenario3SingleFileKey = (typeof SCENARIO3_SINGLE_FILE_KEYS)[number];
// lesson_files is a variable-length multi-file field, handled separately from the two single keys.

export interface ParsedDocument {
  filename: string;
  text: string;
}

export interface JobRecord {
  id: string;
  scenario: ScenarioKey;
  execution_mode: JobExecutionMode;
  status: string;
  phase: string | null;
  step: number | null;
  created_at: string;
  updated_at: string;
  filenames: string; // JSON-encoded: { [key: string]: string } for scenario1/scenario2, or
  // { scope_sequence, standards_reference, lesson_files: string[] } for scenario3
}

export interface AgentRunStatus {
  run_id: string;
  status: "running" | "paused" | "complete" | "error";
  phase: string | null;
  step: number | null;
  total_steps: number;
  phases: string[];
  interrupt_type: string | null;
  interrupt_payload: Record<string, unknown> | null;
  workflow_paused: boolean;
  error: string | null;
}

export interface JobStatusResponse extends AgentRunStatus {
  job_id: string;
  scenario: ScenarioKey;
  created_at: string;
  updated_at: string;
  filenames: Record<string, unknown>;
}

export interface Scenario1FinalPackage {
  summary: string;
  sc_codes_strong: number;
  sc_codes_partial: number;
  sc_codes_gap: number;
  sc_codes_total: number;
  overall_notes: string;
  ngss_alignment_inventory: Record<string, unknown>[];
  crosswalk: Record<string, unknown>[];
  sc_deltas: Record<string, unknown>[];
  performance_target_map: Record<string, unknown>[];
  grade_level_depth_validation: Record<string, unknown>[];
  alignment_criteria: Record<string, unknown>;
  evidence_review: Record<string, unknown>[];
  classification: Record<string, unknown>[];
  gap_analysis: Record<string, unknown>[];
  final_qa_review: Record<string, unknown>;
  out_of_scope_note: string;
}

export interface FinalPackage {
  original_location: string;
  selected_literacy_strategy: string;
  original_content_excerpt: string;
  revised_content_summary: string;
  reason_for_change: string;
  literacy_benefit: string;
  science_learning_benefit: string;
  timing_or_instructional_impact: string;
  lesson_id: string;
  student_content: string;
  teacher_content: string;
  rationale_doc: string;
  connected_updates: string[];
  qa_findings: Record<string, unknown>;
  final_validation_status: Record<string, unknown>;
}

export interface Scenario3FinalPackage {
  unit_summary: string;
  oregon_standards_addressed: number;
  total_oregon_standards: number;
  revisions_made: number;
  remaining_gaps: string[];
  overall_notes: string;
  confirmed_grade: string;
  crosswalk: Record<string, unknown>[];
  alignment_map: Record<string, unknown>[];
  gap_list: Record<string, unknown>[];
  surplus_inventory: Record<string, unknown>[];
  revision_plan: Record<string, unknown>[];
  drafted_content: Record<string, unknown>[];
  rationale_entries: Record<string, unknown>[];
  updated_scope_sequence: string;
  final_alignment_matrix: Record<string, unknown>[];
  coherence_findings: Record<string, unknown>;
  editorial_findings: Record<string, unknown>;
}
