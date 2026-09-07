"""The three human-in-the-loop checkpoints in the Scenario 2 graph.

Each corresponds to a step the spreadsheet rates "Medium" (AI can draft/rank, but a human makes the
final instructional-design call): step 7 (select combination), step 11 (select integration point),
step 24 (resolve QA feedback). Each node calls ``interrupt()`` with the exact artifact a reviewer
needs; LangGraph pauses the graph there until the API layer resumes it with the human's decision.
"""

from __future__ import annotations

from pathlib import Path

from langgraph.types import interrupt

from app.state import ScenarioState
from app.store import NO_OVERRIDE


def _resolve_lesson_key(state: ScenarioState, lesson_id: str) -> str:
    if lesson_id in state["documents"]:
        return lesson_id

    normalized_id = Path(lesson_id).stem.casefold()
    filename_matches: list[str] = []
    for document_key in ("lesson_1", "lesson_2", "lesson_3"):
        document = state["documents"].get(document_key)
        if not document:
            continue
        filename_stem = Path(document["filename"]).stem.casefold()
        if filename_stem == normalized_id:
            return document_key
        if normalized_id in filename_stem or filename_stem in normalized_id:
            filename_matches.append(document_key)

    if len(filename_matches) == 1:
        return filename_matches[0]

    raise ValueError(f"Selected lesson '{lesson_id}' does not match an uploaded lesson.")


def select_combination(state: ScenarioState) -> dict:
    decision = interrupt(
        {
            "type": "select_combination",
            "fit_matrix": state["fit_matrix"],
            "recommended_combination": state["recommended_combination"],
            "instructions": "Pick the lesson_id + strategy_name to carry forward, or confirm the "
            "AI's recommendation as-is.",
        }
    )
    selected = dict(state["recommended_combination"] if decision == NO_OVERRIDE else decision)
    selected["lesson_id"] = _resolve_lesson_key(state, selected["lesson_id"])
    return {
        "selected_combination": selected,
        "phase": "Understand & Screen",
        "step": 7,
    }


def select_integration_point(state: ScenarioState) -> dict:
    decision = interrupt(
        {
            "type": "select_integration_point",
            "candidates": state["integration_candidates"],
            "recommended_integration_point": state["recommended_integration_point"],
            "instructions": "Pick the candidate_id to integrate the strategy at, or confirm the "
            "AI's recommendation as-is.",
        }
    )
    selected = state["recommended_integration_point"] if decision == NO_OVERRIDE else decision
    return {
        "selected_integration_point": selected,
        "phase": "Deep Instructional Analysis",
        "step": 11,
    }


def review_qa_feedback(state: ScenarioState) -> dict:
    decision = interrupt(
        {
            "type": "review_qa_feedback",
            "qa_findings": state["qa_findings"],
            "instructions": "For each QA category, confirm which issues_to_resolve should actually "
            "be fixed (a reviewer may waive some as false positives or add free-text notes).",
        }
    )
    return {
        "qa_human_decisions": {} if decision == NO_OVERRIDE else decision,
        "phase": "Quality Assurance",
        "step": 24,
    }
