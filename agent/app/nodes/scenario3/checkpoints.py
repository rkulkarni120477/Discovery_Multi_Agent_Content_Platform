"""The three human-in-the-loop checkpoints in the Scenario 3 graph.

The spreadsheet explicitly calls out human review at these points because AI errors here cascade
silently downstream:
  - step 4 (crosswalk): "human reviews every pairing, because misclassifying a 'partial overlap'
    as a 'direct match' cascades into missed gaps downstream."
  - step 6 (alignment map): "AI tends to over-credit surface-level keyword matches as full
    alignment (critical caveat) -- human validates every 'fully addressed' and 'partially
    addressed' classification."
  - steps 9-10 (revision plan + placement): both rated "Medium" -- the intervention-type and
    placement decisions are instructional-design judgment calls.
"""

from __future__ import annotations

from langgraph.types import interrupt

from app.state_scenario3 import ScenarioState3
from app.store import NO_OVERRIDE


def automate_crosswalk_review(state: ScenarioState3) -> dict:
    return {
        "confirmed_crosswalk": state["crosswalk"],
        "phase": "Gather & Organize",
        "step": 4,
    }


def automate_alignment_map_review(state: ScenarioState3) -> dict:
    return {
        "confirmed_alignment_map": state["alignment_map"],
        "phase": "Read & Map",
        "step": 6,
    }


def automate_revision_plan_review(state: ScenarioState3) -> dict:
    return {
        "confirmed_revision_plan": state["revision_plan"],
        "phase": "Revision Planning",
        "step": 10,
    }


def review_crosswalk(state: ScenarioState3) -> dict:
    decision = interrupt(
        {
            "type": "review_crosswalk",
            "crosswalk": state["crosswalk"],
            "unmatched_oregon_standards": state["unmatched_oregon_standards"],
            "instructions": "Review each C3-to-state-standard pairing and its match classification. "
            "Edit any row, remove false matches, or confirm as-is.",
        }
    )
    confirmed = state["crosswalk"] if decision == NO_OVERRIDE else decision
    return {
        "confirmed_crosswalk": confirmed,
        "phase": "Gather & Organize",
        "step": 4,
    }


def review_alignment_map(state: ScenarioState3) -> dict:
    decision = interrupt(
        {
            "type": "review_alignment_map",
            "alignment_map": state["alignment_map"],
            "instructions": "Validate every 'Fully addressed' and 'Partially addressed' "
            "classification against the cited evidence -- the AI tends to over-credit "
            "surface-level keyword matches. Edit any row or confirm as-is.",
        }
    )
    confirmed = state["alignment_map"] if decision == NO_OVERRIDE else decision
    return {
        "confirmed_alignment_map": confirmed,
        "phase": "Read & Map",
        "step": 6,
    }


def review_revision_plan(state: ScenarioState3) -> dict:
    decision = interrupt(
        {
            "type": "review_revision_plan",
            "revision_plan": state["revision_plan"],
            "instructions": "For each planned revision, confirm the intervention type and "
            "placement (lesson/location), or edit/remove rows that don't fit the lesson's flow.",
        }
    )
    confirmed = state["revision_plan"] if decision == NO_OVERRIDE else decision
    return {
        "confirmed_revision_plan": confirmed,
        "phase": "Revision Planning",
        "step": 10,
    }
