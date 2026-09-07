export type RunStatus = "running" | "paused" | "complete" | "error";
export type ScenarioKey = "scenario1" | "scenario2" | "scenario3";

export interface JobStatus {
  job_id: string;
  scenario: ScenarioKey;
  status: RunStatus;
  phase: string | null;
  step: number | null;
  total_steps: number;
  phases: string[];
  interrupt_type: string | null;
  interrupt_payload: Record<string, unknown> | null;
  error: string | null;
  created_at: string;
  updated_at: string;
  filenames: Record<string, unknown>;
}

export interface JobSummary {
  id: string;
  scenario: ScenarioKey;
  status: string;
  phase: string | null;
  step: number | null;
  created_at: string;
  updated_at: string;
  filenames: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Scenario 2 -- literacy strategy integration
// ---------------------------------------------------------------------------

export interface FitMatrixRow {
  lesson_id: string;
  strategy_name: string;
  authentic_literacy_demand: string;
  science_learning_depth: string;
  communication_benefit: string;
  duplication_risk: string;
  natural_embedding: string;
  timing_fit: string;
  interference_risk: string;
  fit_rating: string;
  notes: string;
}

export interface Combination {
  lesson_id: string;
  strategy_name: string;
  rationale: string;
}

export interface SelectCombinationPayload {
  type: "select_combination";
  fit_matrix: FitMatrixRow[];
  recommended_combination: Combination;
  instructions: string;
}

export interface IntegrationCandidate {
  candidate_id: string;
  location: string;
  current_student_activity: string;
  literacy_demand: string;
  what_strategy_adds: string;
  guidance_changes_needed: string;
  timing_impact_minutes: number;
  risks: string;
  duplication_notes: string;
  score: string;
}

export interface IntegrationPoint {
  candidate_id: string;
  location: string;
  rationale: string;
}

export interface SelectIntegrationPointPayload {
  type: "select_integration_point";
  candidates: IntegrationCandidate[];
  recommended_integration_point: IntegrationPoint;
  instructions: string;
}

export interface QAFinding {
  category: string;
  findings: string[];
  issues_to_resolve: string[];
  passed: boolean;
}

export interface ReviewQAFeedbackPayload {
  type: "review_qa_feedback";
  qa_findings: Record<string, QAFinding>;
  instructions: string;
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
  qa_findings: Record<string, QAFinding>;
  final_validation_status: Record<string, unknown>;
}

export const SCENARIO2_PHASE_STEP_RANGES: Record<string, [number, number]> = {
  "Gather & Organize": [1, 3],
  "Understand & Screen": [4, 7],
  "Deep Instructional Analysis": [8, 11],
  "Revision Planning": [12, 14],
  "Content Development": [15, 18],
  "Quality Assurance": [19, 23],
  Finalization: [24, 27],
};

// ---------------------------------------------------------------------------
// Scenario 3 -- state-standards alignment
// ---------------------------------------------------------------------------

export interface CrosswalkRow {
  c3_code: string;
  oregon_id: string;
  match_type: string;
  notes: string;
}

export interface ReviewCrosswalkPayload {
  type: "review_crosswalk";
  crosswalk: CrosswalkRow[];
  unmatched_oregon_standards: string[];
  instructions: string;
}

export interface AlignmentRow {
  oregon_id: string;
  coverage_status: string;
  evidence: string;
  lesson_id: string;
}

export interface ReviewAlignmentMapPayload {
  type: "review_alignment_map";
  alignment_map: AlignmentRow[];
  instructions: string;
}

export interface RevisionRow {
  revision_id: string;
  oregon_id: string;
  intervention_type: string;
  description: string;
  target_lesson_id: string;
  placement_location: string;
  timing_impact_minutes: number;
  notes: string;
}

export interface ReviewRevisionPlanPayload {
  type: "review_revision_plan";
  revision_plan: RevisionRow[];
  instructions: string;
}

export interface Scenario3FinalPackage {
  unit_summary: string;
  oregon_standards_addressed: number;
  total_oregon_standards: number;
  revisions_made: number;
  remaining_gaps: string[];
  overall_notes: string;
  confirmed_grade: string;
  crosswalk: CrosswalkRow[];
  alignment_map: AlignmentRow[];
  gap_list: { oregon_id: string; gap_type: string; description: string }[];
  surplus_inventory: { content_description: string; lesson_id: string; disposition: string }[];
  revision_plan: RevisionRow[];
  drafted_content: { revision_id: string; lesson_id: string; content_text: string }[];
  rationale_entries: {
    revision_id: string;
    oregon_standard: string;
    gap: string;
    what_changed: string;
    why: string;
  }[];
  updated_scope_sequence: string;
  final_alignment_matrix: { oregon_id: string; lesson_id: string; evidence: string; covered: boolean }[];
  coherence_findings: QAFinding;
  editorial_findings: QAFinding;
}

export const SCENARIO3_PHASE_STEP_RANGES: Record<string, [number, number]> = {
  "Gather & Organize": [1, 4],
  "Read & Map": [5, 6],
  "Gap Analysis": [7, 8],
  "Revision Planning": [9, 10],
  "Content Drafting": [11, 13],
  "Quality Assurance": [14, 16],
};

// ---------------------------------------------------------------------------
// Scenario 1 -- NGSS-to-state-standards crosswalk
// ---------------------------------------------------------------------------

export interface NGSSCitation {
  ngss_code: string;
  ngss_text: string;
  citation_location: string;
}

export interface CrosswalkRow1 {
  ngss_code: string;
  sc_code: string;
  relationship: string;
  notes: string;
}

export interface DeltaRow {
  sc_code: string;
  delta_type: string;
  description: string;
}

export interface PerformanceTargetRow {
  sc_code: string;
  performance_target_id: string;
  performance_target_text: string;
  requires_observable_performance: boolean;
  notes: string;
}

export interface GradeLevelDepthRow {
  sc_code: string;
  grade: string;
  dimension: string; // SEP | DCI | CCC
  expected_depth: string;
  validated_depth: string;
  matches: boolean;
  notes: string;
}

export interface ReviewGradeLevelDepthPayload {
  type: "review_grade_level_depth";
  grade_level_depth_validation: GradeLevelDepthRow[];
  instructions: string;
}

export interface AlignmentCriteria {
  strong_criteria: string;
  partial_criteria: string;
  gap_criteria: string;
  evidence_requirements: string;
}

export interface EvidenceReviewRow {
  sc_code: string;
  existing_citation: string;
  evidence_summary: string;
  notes: string;
}

export interface ClassificationRow {
  sc_code: string;
  classification: string; // Strong | Partial | Gap
  rationale: string;
}

export interface GapRow1 {
  sc_code: string;
  gap_description: string;
  remediation_recommendation: string;
}

export interface ReviewGapAnalysisPayload {
  type: "review_gap_analysis";
  gap_analysis: GapRow1[];
  instructions: string;
}

export interface FinalQAReview {
  findings: string[];
  issues_to_resolve: string[];
  passed: boolean;
}

export interface Scenario1FinalPackage {
  summary: string;
  sc_codes_strong: number;
  sc_codes_partial: number;
  sc_codes_gap: number;
  sc_codes_total: number;
  overall_notes: string;
  ngss_alignment_inventory: NGSSCitation[];
  crosswalk: CrosswalkRow1[];
  sc_deltas: DeltaRow[];
  performance_target_map: PerformanceTargetRow[];
  grade_level_depth_validation: GradeLevelDepthRow[];
  alignment_criteria: AlignmentCriteria;
  evidence_review: EvidenceReviewRow[];
  classification: ClassificationRow[];
  gap_analysis: GapRow1[];
  final_qa_review: FinalQAReview;
  out_of_scope_note: string;
}

export const SCENARIO1_PHASE_STEP_RANGES: Record<string, [number, number]> = {
  "Standards Crosswalk": [1, 3],
  "Performance Target Mapping & Validation": [4, 5],
  "Content Alignment Review": [6, 8],
  "Gap Analysis & Remediation": [9, 10],
  "QA & Finalization": [11, 11],
};
