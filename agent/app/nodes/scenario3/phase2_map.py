"""Phase 2 -- Read & Map (Scenario 3, steps 5-6; step 6's human validation is captured by
``checkpoints.review_alignment_map``).

Steps:
  5. Read and summarize each lesson's actual content.
  6. Map lesson content against the state's standards.
"""

from __future__ import annotations

import json

from app.llm import ask_structured
from app.schemas_scenario3 import AlignmentMap, LessonSummary3List
from app.state_scenario3 import ScenarioState3


def summarize_lessons(state: ScenarioState3) -> dict:
    lesson_files = state["documents"].get("lesson_files", [])
    lesson_blocks = "\n\n".join(
        f"=== {f['filename']} ===\n{f['text']}" for f in lesson_files
    )
    result = ask_structured(
        "Read each of the following lesson/educator-support files end to end. Group files that "
        "belong to the same lesson (a lesson file and its educator-support file usually share a "
        "lesson number in the title or filename) into one lesson_id per lesson. For each lesson, "
        "document: title/driving question, learning target, vocabulary, what students actually "
        "do, concepts developed, standards claimed in the teacher notes, what the assessment "
        "measures, the hook strategy, and total timing in minutes.\n\n"
        f"{lesson_blocks}",
        LessonSummary3List,
    )
    return {
        "lesson_summaries": [s.model_dump() for s in result.summaries],
        "phase": "Read & Map",
        "step": 5,
    }


def map_to_standards(state: ScenarioState3) -> dict:
    result = ask_structured(
        "Go standard by standard through the state standards list below. For each one, determine "
        "whether there is a specific instructional moment in the lesson summaries that develops "
        "it. Cite exactly where (which lesson_id and what activity/moment), then classify "
        "coverage_status as 'Fully addressed', 'Partially addressed', or 'Not addressed'. Use the "
        "crosswalk as a guide to which standards are already expected to be covered, but verify "
        "against the actual lesson content rather than assuming coverage from the crosswalk alone "
        "-- do not over-credit a surface-level keyword match as full alignment.\n\n"
        f"State standards:\n{json.dumps(state['oregon_standards'], indent=2)}\n\n"
        f"Crosswalk (guide only):\n{json.dumps(state['confirmed_crosswalk'], indent=2)}\n\n"
        f"Lesson summaries:\n{json.dumps(state['lesson_summaries'], indent=2)}",
        AlignmentMap,
    )
    return {
        "alignment_map": [r.model_dump() for r in result.rows],
        "phase": "Read & Map",
        "step": 6,
    }
