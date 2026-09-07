"""Pydantic schemas used with ``llm.ask_structured`` for every Scenario 1 extraction/analysis node."""

from __future__ import annotations

from pydantic import BaseModel, Field


class NGSSCitationModel(BaseModel):
    ngss_code: str
    ngss_text: str
    citation_location: str = Field(description="Where in the product this alignment is documented")


class NGSSAlignmentInventory(BaseModel):
    citations: list[NGSSCitationModel]


class CrosswalkRow1Model(BaseModel):
    ngss_code: str
    sc_code: str
    relationship: str = Field(
        description="Same | SC adds | SC modifies | SC reframes | No SC counterpart"
    )
    notes: str


class Crosswalk1(BaseModel):
    rows: list[CrosswalkRow1Model]


class DeltaRowModel(BaseModel):
    sc_code: str
    delta_type: str = Field(description="addition | modification | emphasis | reframe")
    description: str


class DeltaList(BaseModel):
    deltas: list[DeltaRowModel]


class PerformanceTargetRowModel(BaseModel):
    sc_code: str
    performance_target_id: str
    performance_target_text: str
    requires_observable_performance: bool
    notes: str


class PerformanceTargetMap(BaseModel):
    rows: list[PerformanceTargetRowModel]


class GradeLevelDepthRowModel(BaseModel):
    sc_code: str
    grade: str
    dimension: str = Field(description="SEP | DCI | CCC")
    expected_depth: str
    validated_depth: str
    matches: bool
    notes: str


class GradeLevelDepthValidation(BaseModel):
    rows: list[GradeLevelDepthRowModel]


class AlignmentCriteriaModel(BaseModel):
    strong_criteria: str = Field(description="What counts as Strong evidence of alignment")
    partial_criteria: str = Field(description="What counts as Partial evidence of alignment")
    gap_criteria: str = Field(description="What counts as a Gap -- insufficient or no evidence")
    evidence_requirements: str = Field(
        description="What kind of citation/evidence is required to support a classification"
    )


class EvidenceReviewRowModel(BaseModel):
    sc_code: str
    existing_citation: str
    evidence_summary: str = Field(description="What the existing evidence, if any, actually shows")
    notes: str


class EvidenceReview(BaseModel):
    rows: list[EvidenceReviewRowModel]


class ClassificationRowModel(BaseModel):
    sc_code: str
    classification: str = Field(description="Strong | Partial | Gap")
    rationale: str


class ClassificationList(BaseModel):
    rows: list[ClassificationRowModel]


class GapDetailModel(BaseModel):
    sc_code: str
    gap_description: str = Field(description="Exactly what is missing or insufficient")


class GapDetailList(BaseModel):
    gaps: list[GapDetailModel]


class GapRow1Model(BaseModel):
    sc_code: str
    gap_description: str
    remediation_recommendation: str


class GapAnalysis(BaseModel):
    gaps: list[GapRow1Model]


class FinalQAReviewModel(BaseModel):
    findings: list[str]
    issues_to_resolve: list[str]
    passed: bool


class FinalPackage1(BaseModel):
    summary: str
    overall_notes: str
