"""Shared state threaded through the Scenario 1 graph (NGSS -> state-science-standards crosswalk,
e.g. South Carolina). Mirrors state.py / state_scenario3.py's role for the other scenarios.

PE = Performance Expectation, SEP = Science and Engineering Practices, DCI = Disciplinary Core
Ideas, CCC = Crosscutting Concepts. DCI + SEP + CCC together are the three dimensions of
three-dimensional science learning used in NGSS-style standards.
"""

from __future__ import annotations

from typing import Any, Optional, TypedDict


class Document(TypedDict):
    filename: str
    text: str


class NGSSCitation(TypedDict, total=False):
    ngss_code: str
    ngss_text: str
    citation_location: str


class CrosswalkRow1(TypedDict, total=False):
    ngss_code: str
    sc_code: str
    relationship: str  # Same | SC adds | SC modifies | SC reframes | No SC counterpart
    notes: str


class DeltaRow(TypedDict, total=False):
    sc_code: str
    delta_type: str  # addition | modification | emphasis | reframe
    description: str


class PerformanceTargetRow(TypedDict, total=False):
    sc_code: str
    performance_target_id: str
    performance_target_text: str
    requires_observable_performance: bool
    notes: str


class GradeLevelDepthRow(TypedDict, total=False):
    sc_code: str
    grade: str
    dimension: str  # SEP | DCI | CCC
    expected_depth: str
    validated_depth: str
    matches: bool
    notes: str


class AlignmentCriteria(TypedDict, total=False):
    strong_criteria: str
    partial_criteria: str
    gap_criteria: str
    evidence_requirements: str


class EvidenceReviewRow(TypedDict, total=False):
    sc_code: str
    existing_citation: str
    evidence_summary: str
    notes: str


class ClassificationRow(TypedDict, total=False):
    sc_code: str
    classification: str  # Strong | Partial | Gap
    rationale: str


class GapDetailRow(TypedDict, total=False):
    sc_code: str
    gap_description: str


class GapRow1(TypedDict, total=False):
    sc_code: str
    gap_description: str
    remediation_recommendation: str


class FinalQAReview(TypedDict, total=False):
    findings: list[str]
    issues_to_resolve: list[str]
    passed: bool


class ScenarioState1(TypedDict, total=False):
    # bookkeeping
    job_id: str
    phase: str
    step: int
    status: str
    interrupt_type: Optional[str]
    interrupt_payload: Optional[dict[str, Any]]
    error: Optional[str]

    # Inputs
    documents: dict[str, Document]
    # keys: existing_product_content, sc_standards_reference, sc_performance_targets,
    #       sc_vertical_articulation

    # Phase 1 -- Standards Crosswalk (steps 1-3)
    ngss_alignment_inventory: list[NGSSCitation]
    crosswalk: list[CrosswalkRow1]
    sc_deltas: list[DeltaRow]

    # Phase 2 -- Performance Target Mapping & Validation (steps 4-5)
    performance_target_map: list[PerformanceTargetRow]
    grade_level_depth_validation: list[GradeLevelDepthRow]
    confirmed_grade_level_depth_validation: list[GradeLevelDepthRow]

    # Phase 3 -- Content Alignment Review (steps 6-8)
    alignment_criteria: AlignmentCriteria
    evidence_review: list[EvidenceReviewRow]
    classification: list[ClassificationRow]

    # Phase 4 -- Gap Analysis & Remediation (steps 9-10)
    gap_details: list[GapDetailRow]
    gap_analysis: list[GapRow1]
    confirmed_gap_analysis: list[GapRow1]

    # Phase 5 -- QA & Finalization (step 11)
    final_qa_review: FinalQAReview
    out_of_scope_note: str
    final_package: dict[str, Any]


PHASES = [
    "Standards Crosswalk",
    "Performance Target Mapping & Validation",
    "Content Alignment Review",
    "Gap Analysis & Remediation",
    "QA & Finalization",
]

TOTAL_STEPS = 11
