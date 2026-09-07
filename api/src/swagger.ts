import path from "node:path";
import swaggerJsdoc from "swagger-jsdoc";

const port = Number(process.env.PORT) || 4000;

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Discovery Education — Scenario API",
      version: "1.0.0",
      description:
        "REST API that uploads Scenario 1, Scenario 2, and Scenario 3 source documents, tracks " +
        "job status, and drives the LangGraph agent service (see the agent's own Swagger UI at " +
        "its /docs for the underlying /scenario1/runs, /scenario2/runs, and /scenario3/runs " +
        "endpoints). Scenario 1 job creation is POST /api/scenario1/jobs; Scenario 2 job creation " +
        "is POST /api/jobs; Scenario 3 job creation is POST /api/scenario3/jobs. Every other " +
        "operation (list/status/resume/result) is unified under /api/jobs/* regardless of which " +
        "scenario created the job, since each job id is globally unique and carries its own " +
        "scenario tag.",
    },
    servers: [{ url: `http://localhost:${port}`, description: "Local dev" }],
    tags: [
      { name: "jobs", description: "Unified run lifecycle (list/status/resume/result) + Scenario 2 creation" },
      { name: "scenario1", description: "Scenario 1 run creation" },
      { name: "scenario3", description: "Scenario 3 run creation" },
    ],
    components: {
      parameters: {
        JobId: {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "The job id returned by POST /api/jobs.",
        },
      },
      schemas: {
        JobCreateResponse: {
          type: "object",
          properties: {
            job_id: { type: "string", format: "uuid" },
            status: { type: "string", example: "running" },
          },
        },
        JobSummary: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            scenario: { type: "string", enum: ["scenario1", "scenario2", "scenario3"] },
            status: { type: "string" },
            phase: { type: "string", nullable: true },
            step: { type: "integer", nullable: true },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
            filenames: {
              type: "object",
              additionalProperties: true,
              example: {
                lesson_1: "lesson_02.docx",
                lesson_2: "lesson_03.docx",
                lesson_3: "lesson_04.docx",
                literacy_strategy: "literacy_strategies.docx",
              },
            },
          },
        },
        JobStatusResponse: {
          type: "object",
          properties: {
            run_id: { type: "string" },
            scenario: { type: "string", enum: ["scenario1", "scenario2", "scenario3"] },
            status: { type: "string", enum: ["running", "paused", "complete", "error"] },
            phase: { type: "string", nullable: true },
            step: { type: "integer", nullable: true },
            total_steps: {
              type: "integer",
              example: 27,
              description: "8 for scenario1, 27 for scenario2, 16 for scenario3",
            },
            phases: { type: "array", items: { type: "string" } },
            interrupt_type: {
              type: "string",
              nullable: true,
              enum: [
                "select_combination",
                "select_integration_point",
                "review_qa_feedback",
                "review_crosswalk",
                "review_alignment_map",
                "review_revision_plan",
                "review_grade_level_depth",
                "review_gap_analysis",
                null,
              ],
            },
            interrupt_payload: { type: "object", nullable: true, additionalProperties: true },
            error: { type: "string", nullable: true },
            job_id: { type: "string", format: "uuid" },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
            filenames: { type: "object", additionalProperties: true },
          },
        },
        ResumeRequest: {
          type: "object",
          properties: {
            value: {
              description:
                "The human decision for the paused checkpoint. Shape depends on interrupt_type. " +
                "Scenario 1: an edited grade-level-depth row array for " +
                "review_grade_level_depth, or an edited gap-analysis row array for " +
                "review_gap_analysis. Scenario 2: a Combination ({lesson_id, strategy_name, " +
                "rationale}) for select_combination, an IntegrationPoint ({candidate_id, " +
                "location, rationale}) for select_integration_point, or a per-category decisions " +
                "map for review_qa_feedback. Scenario 3: an edited crosswalk row array for " +
                "review_crosswalk, an edited alignment-map row array for review_alignment_map, or " +
                "an edited revision-plan row array for review_revision_plan. Omit or pass null to " +
                "accept the AI's recommendation as-is.",
              nullable: true,
              additionalProperties: true,
            },
          },
        },
        Scenario1FinalPackage: {
          type: "object",
          properties: {
            summary: { type: "string" },
            sc_codes_strong: { type: "integer" },
            sc_codes_partial: { type: "integer" },
            sc_codes_gap: { type: "integer" },
            sc_codes_total: { type: "integer" },
            overall_notes: { type: "string" },
            ngss_alignment_inventory: { type: "array", items: { type: "object", additionalProperties: true } },
            crosswalk: { type: "array", items: { type: "object", additionalProperties: true } },
            sc_deltas: { type: "array", items: { type: "object", additionalProperties: true } },
            performance_target_map: { type: "array", items: { type: "object", additionalProperties: true } },
            grade_level_depth_validation: { type: "array", items: { type: "object", additionalProperties: true } },
            alignment_criteria: { type: "object", additionalProperties: true },
            evidence_review: { type: "array", items: { type: "object", additionalProperties: true } },
            classification: { type: "array", items: { type: "object", additionalProperties: true } },
            gap_analysis: { type: "array", items: { type: "object", additionalProperties: true } },
            final_qa_review: { type: "object", additionalProperties: true },
            out_of_scope_note: { type: "string" },
          },
        },
        FinalPackage: {
          type: "object",
          properties: {
            original_location: { type: "string" },
            selected_literacy_strategy: { type: "string" },
            original_content_excerpt: { type: "string" },
            revised_content_summary: { type: "string" },
            reason_for_change: { type: "string" },
            literacy_benefit: { type: "string" },
            science_learning_benefit: { type: "string" },
            timing_or_instructional_impact: { type: "string" },
            lesson_id: { type: "string" },
            student_content: { type: "string" },
            teacher_content: { type: "string" },
            rationale_doc: { type: "string" },
            connected_updates: { type: "array", items: { type: "string" } },
            qa_findings: { type: "object", additionalProperties: true },
            final_validation_status: { type: "object", additionalProperties: true },
          },
        },
        Scenario3FinalPackage: {
          type: "object",
          properties: {
            unit_summary: { type: "string" },
            oregon_standards_addressed: { type: "integer" },
            total_oregon_standards: { type: "integer" },
            revisions_made: { type: "integer" },
            remaining_gaps: { type: "array", items: { type: "string" } },
            overall_notes: { type: "string" },
            confirmed_grade: { type: "string" },
            crosswalk: { type: "array", items: { type: "object", additionalProperties: true } },
            alignment_map: { type: "array", items: { type: "object", additionalProperties: true } },
            gap_list: { type: "array", items: { type: "object", additionalProperties: true } },
            surplus_inventory: { type: "array", items: { type: "object", additionalProperties: true } },
            revision_plan: { type: "array", items: { type: "object", additionalProperties: true } },
            drafted_content: { type: "array", items: { type: "object", additionalProperties: true } },
            rationale_entries: { type: "array", items: { type: "object", additionalProperties: true } },
            updated_scope_sequence: { type: "string" },
            final_alignment_matrix: { type: "array", items: { type: "object", additionalProperties: true } },
            coherence_findings: { type: "object", additionalProperties: true },
            editorial_findings: { type: "object", additionalProperties: true },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: { error: { type: "string" } },
        },
      },
    },
  },
  // swagger-jsdoc's glob matching requires forward slashes even on Windows — path.join alone
  // produces backslashes there, which silently matches zero files instead of erroring.
  apis: [path.join(__dirname, "routes", "*.{ts,js}").split(path.sep).join("/")],
});
