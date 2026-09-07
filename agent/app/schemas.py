"""Pydantic schemas used with ``llm.ask_structured`` for every extraction/analysis node.

These mirror the TypedDicts in ``state.py`` but as Pydantic models, which is what
``ChatOpenAI.with_structured_output`` needs to build a tool-call schema and validate the result.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class LessonMetadataModel(BaseModel):
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


class LessonMetadataList(BaseModel):
    lessons: list[LessonMetadataModel]


class StrategyEntryModel(BaseModel):
    name: str
    type: str = Field(description="vocabulary | reading | writing | other")
    instructional_purpose: str
    student_behavior: str
    teacher_role: str
    appropriate_conditions: str
    point_of_use: str
    required_supports: list[str]
    unsuitable_conditions: str


class StrategyInventory(BaseModel):
    strategies: list[StrategyEntryModel]


class LessonSummaryModel(BaseModel):
    lesson_id: str
    instructional_summary: str
    key_science_concepts: list[str]
    instructional_sequence: list[str]
    literacy_demand_profile: str
    teacher_facilitation_needs: str
    pacing_notes: str


class LessonSummaryList(BaseModel):
    summaries: list[LessonSummaryModel]


class StrategyProfileModel(BaseModel):
    name: str
    literacy_behavior_strengthened: str
    science_learning_complement: str
    timing_fit: str = Field(description="before | during | after instruction")
    time_required_minutes: int
    cognitive_demand_impact: str
    facilitation_needs: str


class StrategyProfileList(BaseModel):
    profiles: list[StrategyProfileModel]


class FitMatrixRowModel(BaseModel):
    lesson_id: str
    strategy_name: str
    authentic_literacy_demand: str
    science_learning_depth: str
    communication_benefit: str
    duplication_risk: str
    natural_embedding: str
    timing_fit: str
    interference_risk: str
    fit_rating: str = Field(description="High | Medium | Low")
    notes: str


class FitMatrix(BaseModel):
    rows: list[FitMatrixRowModel]
    recommended_lesson_id: str
    recommended_strategy_name: str
    recommendation_rationale: str


class LessonArchitectureMap(BaseModel):
    objective: str
    science_content_progression: list[str]
    performance_expectation: str
    dci: str
    focal_sep: str
    focal_ccc: str
    student_facing_sequence: list[str]
    teacher_facing_sequence: list[str]
    questions_and_prompts: list[str]
    vocabulary: list[str]
    discussion_opportunities: list[str]
    reading_writing_requirements: list[str]
    scaffolds: list[str]
    differentiation: list[str]
    assessment: list[str]
    transitions: list[str]
    timing_minutes: int
    required_assets: list[str]


class LiteracyDemandMapItem(BaseModel):
    location: str
    demand_type: str = Field(
        description="read | interpret | vocabulary | discuss | explain | record | write | evidence | synthesize | communicate"
    )
    description: str
    existing_scaffold: str


class LiteracyDemandMap(BaseModel):
    items: list[LiteracyDemandMapItem]


class IntegrationCandidateModel(BaseModel):
    candidate_id: str
    location: str
    current_student_activity: str
    literacy_demand: str
    what_strategy_adds: str
    guidance_changes_needed: str
    timing_impact_minutes: int
    risks: str
    duplication_notes: str
    score: str = Field(description="High | Medium | Low instructional value")


class IntegrationCandidateList(BaseModel):
    candidates: list[IntegrationCandidateModel]
    recommended_candidate_id: str
    recommendation_rationale: str


class RevisionPlan(BaseModel):
    purpose_statement: str
    revision_impact_list: list[str] = Field(
        description="Every lesson component affected by the integration"
    )
    added_time_minutes: int
    timing_conflicts: list[str]
    timing_adjustments: list[str]
    sequence_notes: str


class QAFindingModel(BaseModel):
    category: str
    findings: list[str]
    issues_to_resolve: list[str]
    passed: bool


class FinalPackage(BaseModel):
    original_location: str
    selected_literacy_strategy: str
    original_content_excerpt: str
    revised_content_summary: str
    reason_for_change: str
    literacy_benefit: str
    science_learning_benefit: str
    timing_or_instructional_impact: str
