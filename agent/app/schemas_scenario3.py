"""Pydantic schemas used with ``llm.ask_structured`` for every Scenario 3 extraction/analysis node."""

from __future__ import annotations

from pydantic import BaseModel, Field


class OregonStandardModel(BaseModel):
    standard_id: str
    text: str
    domain: str


class OregonStandardsDoc(BaseModel):
    standards: list[OregonStandardModel]


class C3StandardModel(BaseModel):
    code: str
    text: str


class C3StandardsTable(BaseModel):
    standards: list[C3StandardModel]


class CrosswalkRowModel(BaseModel):
    c3_code: str
    oregon_id: str
    match_type: str = Field(
        description="Direct match | Partial overlap | Oregon broader | Oregon narrower | No match"
    )
    notes: str


class Crosswalk(BaseModel):
    rows: list[CrosswalkRowModel]
    unmatched_oregon_standards: list[str] = Field(
        description="Oregon standard_ids with no C3 counterpart found in the reverse scan"
    )


class LessonSummary3Model(BaseModel):
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


class LessonSummary3List(BaseModel):
    summaries: list[LessonSummary3Model]


class AlignmentRowModel(BaseModel):
    oregon_id: str
    coverage_status: str = Field(description="Fully addressed | Partially addressed | Not addressed")
    evidence: str
    lesson_id: str


class AlignmentMap(BaseModel):
    rows: list[AlignmentRowModel]


class GapRowModel(BaseModel):
    oregon_id: str
    gap_type: str = Field(
        description="missing concept | grain size mismatch | missing skill emphasis | "
        "missing local/regional context | missing assessment"
    )
    description: str


class GapList(BaseModel):
    gaps: list[GapRowModel]


class SurplusRowModel(BaseModel):
    content_description: str
    lesson_id: str
    disposition: str = Field(description="trim | condense | leave as-is")


class SurplusInventory(BaseModel):
    items: list[SurplusRowModel]


class RevisionRowModel(BaseModel):
    revision_id: str
    oregon_id: str
    intervention_type: str = Field(
        description="text edit | new discussion prompt | new vocabulary entry | "
        "new/revised content slide | new activity | new assessment item | new lesson component"
    )
    description: str
    target_lesson_id: str
    placement_location: str
    timing_impact_minutes: int
    notes: str


class RevisionPlan3(BaseModel):
    rows: list[RevisionRowModel]


class DraftedContentItemModel(BaseModel):
    revision_id: str
    lesson_id: str
    content_text: str


class DraftedContentList(BaseModel):
    items: list[DraftedContentItemModel]


class RationaleEntryModel(BaseModel):
    revision_id: str
    oregon_standard: str
    gap: str
    what_changed: str
    why: str


class RationaleEntryList(BaseModel):
    entries: list[RationaleEntryModel]


class QAFinding3Model(BaseModel):
    category: str
    findings: list[str]
    issues_to_resolve: list[str]
    passed: bool


class FinalAlignmentRowModel(BaseModel):
    oregon_id: str
    lesson_id: str
    evidence: str
    covered: bool


class FinalAlignmentMatrix(BaseModel):
    rows: list[FinalAlignmentRowModel]
    unmet_standards: list[str]


class FinalPackage3(BaseModel):
    unit_summary: str
    oregon_standards_addressed: int
    total_oregon_standards: int
    revisions_made: int
    remaining_gaps: list[str]
    overall_notes: str
