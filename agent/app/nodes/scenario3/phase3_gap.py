"""Phase 3 -- Gap Analysis (Scenario 3, steps 7-8).

Steps:
  7. Compile and classify the gap list.
  8. Identify content that is surplus relative to the state standards.
"""

from __future__ import annotations

import json

from app.llm import ask_structured
from app.schemas_scenario3 import GapList, SurplusInventory
from app.state_scenario3 import ScenarioState3


def compile_gap_list(state: ScenarioState3) -> dict:
    result = ask_structured(
        "Extract every standard classified as 'Partially addressed' or 'Not addressed' in the "
        "alignment map below. For each, characterize the gap type: missing concept, grain size "
        "mismatch, missing skill emphasis, missing local/regional context, or missing assessment.\n\n"
        f"{json.dumps(state['confirmed_alignment_map'], indent=2)}",
        GapList,
    )
    return {
        "gap_list": [g.model_dump() for g in result.gaps],
        "phase": "Gap Analysis",
        "step": 7,
    }


def identify_surplus(state: ScenarioState3) -> dict:
    result = ask_structured(
        "Flag any lesson content that serves a C3 standard but does not correspond to any state "
        "requirement (i.e. content the crosswalk shows as C3-only, with no state-standard match). "
        "For each item, note which lesson it's in and whether it should be trimmed, condensed, or "
        "left as-is.\n\n"
        f"Alignment map:\n{json.dumps(state['confirmed_alignment_map'], indent=2)}\n\n"
        f"Crosswalk:\n{json.dumps(state['confirmed_crosswalk'], indent=2)}\n\n"
        f"Lesson summaries:\n{json.dumps(state['lesson_summaries'], indent=2)}",
        SurplusInventory,
    )
    return {
        "surplus_inventory": [i.model_dump() for i in result.items],
        "phase": "Gap Analysis",
        "step": 8,
    }
