"""Shared state threaded through the Scenario 3 graph (Oregon C3 -> state-standards alignment).

Mirrors state.py's role for Scenario 2: one dict-like object passed between every node; each node
reads what it needs and returns a partial update that LangGraph merges into the running state.
"""

from __future__ import annotations

from typing import Any, Optional, TypedDict


class Document(TypedDict):
    filename: str
    text: str


class OregonStandard(TypedDict, total=False):
    standard_id: str
    text: str
    domain: str


class C3Standard(TypedDict, total=False):
    code: str
    text: str


class CrosswalkRow(TypedDict, total=False):
    c3_code: str
    oregon_id: str
    match_type: str  # Direct match | Partial overlap | Oregon broader | Oregon narrower | No match
    notes: str


class LessonSummary3(TypedDict, total=False):
    lesson_id: str
    title: str
    driving_question: str
    learning_target: str
    vocabulary: list[str]
    student_actions: list[str]
    concepts_developed: list[str]
    standards_claimed: list[str]
    assessment: str
    hook_strategy: str
    timing_minutes: int


class AlignmentRow(TypedDict, total=False):
    oregon_id: str
    coverage_status: str  # Fully addressed | Partially addressed | Not addressed
    evidence: str
    lesson_id: str


class GapRow(TypedDict, total=False):
    oregon_id: str
    gap_type: str
    description: str


class SurplusRow(TypedDict, total=False):
    content_description: str
    lesson_id: str
    disposition: str  # trim | condense | leave as-is


class RevisionRow(TypedDict, total=False):
    revision_id: str
    oregon_id: str
    intervention_type: str
    description: str
    target_lesson_id: str
    placement_location: str
    timing_impact_minutes: int
    notes: str


class DraftedContentItem(TypedDict, total=False):
    revision_id: str
    lesson_id: str
    content_text: str


class RationaleEntry(TypedDict, total=False):
    revision_id: str
    oregon_standard: str
    gap: str
    what_changed: str
    why: str


class QAFinding3(TypedDict, total=False):
    category: str
    findings: list[str]
    issues_to_resolve: list[str]
    passed: bool


class FinalAlignmentRow(TypedDict, total=False):
    oregon_id: str
    lesson_id: str
    evidence: str
    covered: bool


class ScenarioState3(TypedDict, total=False):
    # bookkeeping
    job_id: str
    phase: str
    step: int
    status: str
    interrupt_type: Optional[str]
    interrupt_payload: Optional[dict[str, Any]]
    error: Optional[str]

    # Inputs
    documents: dict[str, Any]  # scope_sequence: Document, standards_reference: Document, lesson_files: list[Document]

    # Phase 1 -- Gather & Organize
    confirmed_grade: str
    oregon_standards: list[OregonStandard]
    c3_standards: list[C3Standard]
    crosswalk: list[CrosswalkRow]
    unmatched_oregon_standards: list[str]
    confirmed_crosswalk: list[CrosswalkRow]

    # Phase 2 -- Read & Map
    lesson_summaries: list[LessonSummary3]
    alignment_map: list[AlignmentRow]
    confirmed_alignment_map: list[AlignmentRow]

    # Phase 3 -- Gap Analysis
    gap_list: list[GapRow]
    surplus_inventory: list[SurplusRow]

    # Phase 4 -- Revision Planning
    revision_plan: list[RevisionRow]
    confirmed_revision_plan: list[RevisionRow]

    # Phase 5 -- Content Drafting
    drafted_content: list[DraftedContentItem]
    rationale_entries: list[RationaleEntry]
    updated_scope_sequence: str

    # Phase 6 -- Quality Assurance
    coherence_findings: QAFinding3
    final_alignment_matrix: list[FinalAlignmentRow]
    unmet_standards: list[str]
    editorial_findings: QAFinding3
    final_package: dict[str, Any]


PHASES = [
    "Gather & Organize",
    "Read & Map",
    "Gap Analysis",
    "Revision Planning",
    "Content Drafting",
    "Quality Assurance",
]

TOTAL_STEPS = 16
