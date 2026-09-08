"""Phase 2 — Understand & Screen (Scenario 2, steps 4-7).

Steps:
  4. Read and summarize each candidate lesson.
  5. Analyze the instructional intent of the literacy strategies.
  6. Screen potential lesson-strategy combinations -> fit matrix.
  7. Select the strongest strategy-lesson combination(s) -> HUMAN CHECKPOINT.
"""

from __future__ import annotations

import json

from app.llm import ask_structured
from app.schemas import FitMatrix, LessonSummaryList, StrategyProfileList
from app.state import ScenarioState

def lesson_ids(state: ScenarioState) -> list[str]:
    return ["lesson"] if "lesson" in state["documents"] else []


def summarize_lessons(state: ScenarioState) -> dict:
    docs = state["documents"]
    lesson_blocks = "\n\n".join(
        f"=== {lesson_id} ===\n{docs[lesson_id]['text']}" for lesson_id in lesson_ids(state)
    )
    result = ask_structured(
        "Read each candidate lesson sufficiently to understand the instructional experience. For "
        "each lesson_id, document: an instructional summary (what students learn and do), key "
        "science concepts, the instructional sequence, a literacy-demand profile (how students "
        "encounter information, literacy demands/supports present), teacher facilitation needs, and "
        "pacing notes.\n\n"
        f"{lesson_blocks}",
        LessonSummaryList,
    )
    return {
        "lesson_summaries": [s.model_dump() for s in result.summaries],
        "phase": "Understand & Screen",
        "step": 4,
    }


def analyze_strategies(state: ScenarioState) -> dict:
    inventory = state["strategy_inventory"]
    result = ask_structured(
        "For each literacy strategy below, determine: what literacy behavior it strengthens, what "
        "type of science learning it complements, whether it is best used before/during/after "
        "instruction, how much time it typically requires (minutes), its cognitive-demand impact, "
        "and facilitation needs.\n\n"
        f"Strategy inventory:\n{json.dumps(inventory, indent=2)}",
        StrategyProfileList,
    )
    return {
        "strategy_profiles": [p.model_dump() for p in result.profiles],
        "phase": "Understand & Screen",
        "step": 5,
    }


def screen_combinations(state: ScenarioState) -> dict:
    result = ask_structured(
        "You have lesson summaries and literacy-strategy profiles. For each plausible lesson x "
        "strategy combination, assess authentic literacy demand, science-learning depth, "
        "communication benefit, duplication risk, natural embedding, timing fit, and interference "
        "risk. Rate overall instructional fit (High/Medium/Low) with notes. Then recommend the "
        "single strongest combination, prioritizing clear literacy need, science connection, "
        "student benefit, minimal disruption, timing, and no duplication.\n\n"
        f"Lesson summaries:\n{json.dumps(state['lesson_summaries'], indent=2)}\n\n"
        f"Strategy profiles:\n{json.dumps(state['strategy_profiles'], indent=2)}",
        FitMatrix,
    )
    recommended = {
        "lesson_id": result.recommended_lesson_id,
        "strategy_name": result.recommended_strategy_name,
        "rationale": result.recommendation_rationale,
    }
    return {
        "fit_matrix": [r.model_dump() for r in result.rows],
        "recommended_combination": recommended,
        "phase": "Understand & Screen",
        "step": 6,
    }
