"""Phase 4 -- Revision Planning (Scenario 3, steps 9-10; step 10's human confirmation is captured
by ``checkpoints.review_revision_plan``).

Steps:
  9. Determine the revision approach for each gap.
  10. Assign each revision to a specific lesson and location.

Asked together in one structured call, like Scenario 2's revision-planning phase: both steps
share the same inputs (gap list + lesson summaries) and produce one coherent plan rather than two
independently-drifting artifacts.
"""

from __future__ import annotations

import json

from app.llm import ask_structured
from app.schemas_scenario3 import RevisionPlan3
from app.state_scenario3 import ScenarioState3


def plan_and_place_revisions(state: ScenarioState3) -> dict:
    result = ask_structured(
        "For each gap below, decide the minimum viable intervention (text edit, new discussion "
        "prompt, new vocabulary entry, new/revised content slide, new activity, new assessment "
        "item, or new lesson component), then decide exactly where it goes: which lesson_id, what "
        "slide/section, and what placement within that lesson. Check that each placement fits the "
        "lesson's existing flow and doesn't break the learning arc, and estimate the timing impact "
        "in minutes. Give each row a revision_id.\n\n"
        f"Gap list:\n{json.dumps(state['gap_list'], indent=2)}\n\n"
        f"Lesson summaries:\n{json.dumps(state['lesson_summaries'], indent=2)}",
        RevisionPlan3,
    )
    return {
        "revision_plan": [r.model_dump() for r in result.rows],
        "phase": "Revision Planning",
        "step": 9,
    }
