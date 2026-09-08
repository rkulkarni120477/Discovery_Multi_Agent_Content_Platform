"""Phase 1 — Gather & Organize (Scenario 2, steps 1-3).

Steps:
  1. Collect and organize the provided materials.
  2. Identify key lesson metadata.
  3. Extract and organize the available literacy strategies.
"""

from __future__ import annotations

from app.llm import ask_structured, ask_text
from app.schemas import LessonMetadataList, StrategyInventory
from app.state import ScenarioState

def lesson_ids(state: ScenarioState) -> list[str]:
    return ["lesson"] if "lesson" in state["documents"] else []


def intake(state: ScenarioState) -> dict:
    docs = state["documents"]
    listing = "\n".join(
        f"- {docs[key]['filename']} ({key}): {len(docs[key]['text'])} characters"
        for key in [*lesson_ids(state), "literacy_strategy"]
        if key in docs
    )
    notes = ask_text(
        "Confirm completeness of the following working set for a lesson-revision task: three "
        "candidate science lessons and one literacy-strategy resource. For each file, note whether "
        "it appears to contain student-facing content, teacher-facing guidance, and any referenced "
        "activities/metadata, and flag anything that looks incomplete.\n\n"
        f"Files:\n{listing}\n\n"
        "Respond with a short paragraph per file."
    )
    return {
        "working_set_notes": notes,
        "phase": "Gather & Organize",
        "step": 1,
    }


def catalog_metadata(state: ScenarioState) -> dict:
    docs = state["documents"]
    lesson_blocks = "\n\n".join(
        f"=== {lesson_id} ({docs[lesson_id]['filename']}) ===\n{docs[lesson_id]['text']}"
        for lesson_id in lesson_ids(state)
    )
    result = ask_structured(
        "For each of the following candidate science lessons, extract: grade/band, title, lesson "
        "type, 5E phase, timing, learning objective, Performance Expectation(s), DCI, focal SEP, "
        "focal CCC, supporting practices, major activities, assessment opportunities, and existing "
        "literacy supports. Use the lesson_id 'lesson' for the uploaded lesson.\n\n"
        f"{lesson_blocks}",
        LessonMetadataList,
    )
    return {
        "lesson_metadata": [m.model_dump() for m in result.lessons],
        "phase": "Gather & Organize",
        "step": 2,
    }


def extract_strategies(state: ScenarioState) -> dict:
    strategy_doc = state["documents"]["literacy_strategy"]["text"]
    result = ask_structured(
        "This document describes one or more literacy strategies available for integration into "
        "science lessons. For each strategy, document: name, type (vocabulary/reading/writing/"
        "other), instructional purpose, intended student behavior, teacher role, appropriate "
        "conditions, typical point of use, required supports, and conditions where it would NOT be "
        "appropriate. Do not recommend or select a strategy yet — just catalog what is available.\n\n"
        f"{strategy_doc}",
        StrategyInventory,
    )
    return {
        "strategy_inventory": [s.model_dump() for s in result.strategies],
        "phase": "Gather & Organize",
        "step": 3,
    }
