"""Phase 6 — Quality Assurance (Scenario 2, steps 19-23).

Five independent review passes run in parallel (they read the same revised content but don't
depend on each other), then ``aggregate_qa`` fans them back into one ``qa_findings`` dict for the
step-24 human checkpoint.

  19. Review literacy-strategy fidelity.
  20. Review scientific accuracy.
  21. Review instructional intent and three-dimensional learning.
  22. Review coherence, pacing, and grade appropriateness.
  23. Review consistency across affected lesson components.
"""

from __future__ import annotations

import json

from app.llm import ask_structured
from app.schemas import QAFindingModel
from app.state import ScenarioState

_REVISED_CONTEXT_KEYS = (
    "selected_combination",
    "purpose_statement",
    "draft_student_content",
    "draft_teacher_content",
    "connected_updates",
)


def _revised_context(state: ScenarioState) -> str:
    return json.dumps({k: state.get(k) for k in _REVISED_CONTEXT_KEYS}, indent=2)


def _run_qa(category: str, instructions: str, state: ScenarioState) -> QAFindingModel:
    return ask_structured(
        f"{instructions}\n\nSet category to '{category}'. List concrete findings, list only the "
        "issues that genuinely need resolution (issues_to_resolve may be empty), and set passed "
        "to true only if issues_to_resolve is empty.\n\n"
        f"Revised lesson materials:\n{_revised_context(state)}",
        QAFindingModel,
    )


def qa_literacy_fidelity(state: ScenarioState) -> dict:
    finding = _run_qa(
        "literacy_fidelity",
        "Confirm the selected literacy strategy has been implemented as intended: required "
        "student and teacher behaviors are present, the strategy has not been reduced to a "
        "generic prompt/activity, and the literacy objective is genuinely supported.",
        state,
    )
    return {"qa_literacy_fidelity": finding.model_dump()}


def qa_science_accuracy(state: ScenarioState) -> dict:
    finding = _run_qa(
        "science_accuracy",
        "Confirm scientific concepts remain accurate, new prompts do not introduce "
        "misconceptions, vocabulary is used correctly, student responses remain scientifically "
        "defensible, and the literacy strategy has not unintentionally changed the scientific "
        "meaning.",
        state,
    )
    return {"qa_science_accuracy": finding.model_dump()}


def qa_instructional_integrity(state: ScenarioState) -> dict:
    finding = _run_qa(
        "instructional_integrity",
        "Compare the revised lesson with the original instructional goals: confirm the learning "
        "target, Performance Expectation, DCI, focal SEP, and focal CCC remain intact and that "
        "literacy support enhances rather than replaces the science-learning experience.",
        state,
    )
    return {"qa_instructional_integrity": finding.model_dump()}


def qa_coherence_pacing(state: ScenarioState) -> dict:
    finding = _run_qa(
        "coherence_pacing",
        "Read the revised lesson as a teacher/student would experience it: check logical "
        "sequence, smooth transitions, reasonable pacing, realistic timing, cognitive load, "
        "grade-appropriate language, redundancy, and natural integration of the strategy.",
        state,
    )
    return {"qa_coherence_pacing": finding.model_dump()}


def qa_consistency(state: ScenarioState) -> dict:
    finding = _run_qa(
        "consistency",
        "Confirm all affected components agree with one another: student and teacher directions "
        "match, timing and vocabulary are consistent, sample responses match revised prompts, "
        "differentiation supports the revised activity, referenced resources exist, and no "
        "outdated instructions remain.",
        state,
    )
    return {"qa_consistency": finding.model_dump()}


def aggregate_qa(state: ScenarioState) -> dict:
    findings = {
        "literacy_fidelity": state["qa_literacy_fidelity"],
        "science_accuracy": state["qa_science_accuracy"],
        "instructional_integrity": state["qa_instructional_integrity"],
        "coherence_pacing": state["qa_coherence_pacing"],
        "consistency": state["qa_consistency"],
    }
    return {
        "qa_findings": findings,
        "phase": "Quality Assurance",
        "step": 23,
    }
