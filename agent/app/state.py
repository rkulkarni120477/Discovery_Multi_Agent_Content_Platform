"""Shared state threaded through the entire Scenario 2 graph.

One dict-like object is passed between every node (phase 1 through phase 7). Each node reads the
fields it needs and returns a partial update; LangGraph merges updates into the running state, so
every downstream node (and the API layer, via ``graph.get_state``) can see everything produced so far.
"""

from __future__ import annotations

from typing import Any, Optional, TypedDict


class Document(TypedDict):
    filename: str
    text: str


class LessonMetadata(TypedDict, total=False):
    lesson_id: str
    title: str
    grade_band: str
    lesson_type: str
    five_e_phase: str
    timing_minutes: int
    learning_objective: str
    performance_expectations: list[str]
    dci: str
    focal_sep: str
    focal_ccc: str
    supporting_practices: list[str]
    major_activities: list[str]
    assessment_opportunities: list[str]
    existing_literacy_supports: list[str]


class StrategyEntry(TypedDict, total=False):
    name: str
    type: str
    instructional_purpose: str
    student_behavior: str
    teacher_role: str
    appropriate_conditions: str
    point_of_use: str
    required_supports: list[str]
    unsuitable_conditions: str


class LessonSummary(TypedDict, total=False):
    lesson_id: str
    instructional_summary: str
    key_science_concepts: list[str]
    instructional_sequence: list[str]
    literacy_demand_profile: str
    teacher_facilitation_needs: str
    pacing_notes: str


class StrategyProfile(TypedDict, total=False):
    name: str
    literacy_behavior_strengthened: str
    science_learning_complement: str
    timing_fit: str
    time_required_minutes: int
    cognitive_demand_impact: str
    facilitation_needs: str


class FitMatrixRow(TypedDict, total=False):
    lesson_id: str
    strategy_name: str
    authentic_literacy_demand: str
    science_learning_depth: str
    communication_benefit: str
    duplication_risk: str
    natural_embedding: str
    timing_fit: str
    interference_risk: str
    fit_rating: str
    notes: str


class Combination(TypedDict, total=False):
    lesson_id: str
    strategy_name: str
    rationale: str


class IntegrationCandidate(TypedDict, total=False):
    candidate_id: str
    location: str
    current_student_activity: str
    literacy_demand: str
    what_strategy_adds: str
    guidance_changes_needed: str
    timing_impact_minutes: int
    risks: str
    duplication_notes: str
    score: str


class IntegrationPoint(TypedDict, total=False):
    candidate_id: str
    location: str
    rationale: str


class QAFinding(TypedDict, total=False):
    category: str
    findings: list[str]
    issues_to_resolve: list[str]
    passed: bool


class ScenarioState(TypedDict, total=False):
    # bookkeeping
    job_id: str
    phase: str
    step: int
    status: str  # running | paused | complete | error
    interrupt_type: Optional[str]
    interrupt_payload: Optional[dict[str, Any]]
    error: Optional[str]

    # Phase 1 — Gather & Organize
    documents: dict[str, Document]  # keys: lesson_1, lesson_2, lesson_3, literacy_strategy
    working_set_notes: str
    lesson_metadata: list[LessonMetadata]
    strategy_inventory: list[StrategyEntry]

    # Phase 2 — Understand & Screen
    lesson_summaries: list[LessonSummary]
    strategy_profiles: list[StrategyProfile]
    fit_matrix: list[FitMatrixRow]
    recommended_combination: Combination
    selected_combination: Combination

    # Phase 3 — Deep Instructional Analysis
    lesson_architecture_map: dict[str, Any]
    literacy_demand_map: list[dict[str, Any]]
    integration_candidates: list[IntegrationCandidate]
    recommended_integration_point: IntegrationPoint
    selected_integration_point: IntegrationPoint

    # Phase 4 — Revision Planning
    purpose_statement: str
    revision_impact_list: list[str]
    timing_plan: dict[str, Any]

    # Phase 5 — Content Development
    draft_student_content: str
    draft_teacher_content: str
    connected_updates: list[str]
    rationale_doc: str

    # Phase 6 — Quality Assurance
    # Each QA node writes its own field (rather than all writing into one shared dict) so the
    # five parallel branches never race on the same state key; ``aggregate_qa`` then combines
    # them into ``qa_findings`` for the human checkpoint.
    qa_literacy_fidelity: QAFinding
    qa_science_accuracy: QAFinding
    qa_instructional_integrity: QAFinding
    qa_coherence_pacing: QAFinding
    qa_consistency: QAFinding
    qa_findings: dict[str, QAFinding]  # keys match QA_CATEGORIES below, filled by aggregate_qa
    qa_human_decisions: dict[str, Any]

    # Phase 7 — Finalization
    updated_student_content: str
    updated_teacher_content: str
    final_validation_status: dict[str, Any]
    final_student_content: str
    final_teacher_content: str
    final_package: dict[str, Any]


QA_CATEGORIES = [
    "literacy_fidelity",
    "science_accuracy",
    "instructional_integrity",
    "coherence_pacing",
    "consistency",
]

PHASES = [
    "Gather & Organize",
    "Understand & Screen",
    "Deep Instructional Analysis",
    "Revision Planning",
    "Content Development",
    "Quality Assurance",
    "Finalization",
]
