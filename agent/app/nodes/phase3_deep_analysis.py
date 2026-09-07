"""Phase 3 — Deep Instructional Analysis (Scenario 2, steps 8-10; step 11 is a human checkpoint).

Steps:
  8. Conduct a detailed review of the selected lesson -> architecture map.
  9. Identify existing literacy demands and supports.
  10. Identify candidate integration points.
"""

from __future__ import annotations

import json

from app.llm import ask_structured
from app.schemas import IntegrationCandidateList, LessonArchitectureMap, LiteracyDemandMap
from app.state import ScenarioState


def deep_review(state: ScenarioState) -> dict:
    lesson_id = state["selected_combination"]["lesson_id"]
    lesson_text = state["documents"][lesson_id]["text"]
    result = ask_structured(
        "Read this lesson end to end and produce a detailed architecture map: objective, science "
        "content progression, Performance Expectation, DCI, focal SEP, focal CCC, student-facing "
        "sequence, teacher-facing sequence, questions/prompts, vocabulary, discussion "
        "opportunities, reading/writing requirements, scaffolds, differentiation, assessment, "
        "transitions, total timing in minutes, and required assets.\n\n"
        f"{lesson_text}",
        LessonArchitectureMap,
    )
    return {
        "lesson_architecture_map": result.model_dump(),
        "phase": "Deep Instructional Analysis",
        "step": 8,
    }


def map_literacy_demands(state: ScenarioState) -> dict:
    result = ask_structured(
        "Using this lesson architecture map, identify every point where students read, interpret, "
        "use academic/science vocabulary, discuss, explain, record, write, use evidence, "
        "synthesize, or communicate. For each, note the location, demand_type, a description, and "
        "any existing literacy scaffold already present (or 'none').\n\n"
        f"{json.dumps(state['lesson_architecture_map'], indent=2)}",
        LiteracyDemandMap,
    )
    return {
        "literacy_demand_map": [item.model_dump() for item in result.items],
        "phase": "Deep Instructional Analysis",
        "step": 9,
    }


def find_integration_points(state: ScenarioState) -> dict:
    strategy_name = state["selected_combination"]["strategy_name"]
    strategy = next(
        (s for s in state["strategy_inventory"] if s["name"] == strategy_name),
        state["strategy_inventory"][0] if state["strategy_inventory"] else {},
    )
    result = ask_structured(
        f"The literacy strategy '{strategy_name}' has been selected for integration into this "
        "lesson:\n"
        f"{json.dumps(strategy, indent=2)}\n\n"
        "Using the lesson architecture map and literacy-demand map below, identify all plausible "
        "integration points. For each candidate, record: a candidate_id, the lesson "
        "section/activity (location), current student activity, literacy demand present, what the "
        "strategy could add, guidance changes needed, timing impact in minutes, risks/duplication "
        "notes, and an overall score (High/Medium/Low instructional value). Then recommend the "
        "single best candidate_id with a rationale, evaluating against student need, "
        "science-learning purpose, literacy purpose, lesson flow, cognitive load, timing, "
        "redundancy, and teacher usability.\n\n"
        f"Architecture map:\n{json.dumps(state['lesson_architecture_map'], indent=2)}\n\n"
        f"Literacy demand map:\n{json.dumps(state['literacy_demand_map'], indent=2)}",
        IntegrationCandidateList,
    )
    recommended = next(
        (c.model_dump() for c in result.candidates if c.candidate_id == result.recommended_candidate_id),
        result.candidates[0].model_dump() if result.candidates else {},
    )
    recommended["rationale"] = result.recommendation_rationale
    return {
        "integration_candidates": [c.model_dump() for c in result.candidates],
        "recommended_integration_point": recommended,
        "phase": "Deep Instructional Analysis",
        "step": 10,
    }
