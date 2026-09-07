"""Phase 4 — Revision Planning (Scenario 2, steps 12-14).

Steps:
  12. Define the instructional purpose of the integration.
  13. Determine which lesson components require revision.
  14. Assess impact on lesson flow and timing.

These three steps are asked together as one structured call: they share the same inputs (selected
strategy + integration point + full architecture map) and produce one coherent plan rather than
three independently-drifting artifacts.
"""

from __future__ import annotations

import json

from app.llm import ask_structured
from app.schemas import RevisionPlan
from app.state import ScenarioState


def plan_revision(state: ScenarioState) -> dict:
    result = ask_structured(
        "Plan the revision for integrating this literacy strategy at this integration point.\n\n"
        f"Selected strategy + lesson: {json.dumps(state['selected_combination'], indent=2)}\n"
        f"Selected integration point: {json.dumps(state['selected_integration_point'], indent=2)}\n"
        f"Full lesson architecture map: {json.dumps(state['lesson_architecture_map'], indent=2)}\n\n"
        "Produce: (1) a concise instructional purpose statement connecting the literacy goal "
        "directly to the lesson's science-learning goal (e.g., comprehension, vocabulary use, "
        "evidence organization, explanation, discussion, synthesis); (2) a revision-impact list — "
        "every lesson component affected by the proposed change (student instructions, prompts, "
        "teacher notes, discussion guidance, vocabulary, graphic organizer, scaffolding, "
        "differentiation, timing, transitions, check for understanding, sample responses) — avoid "
        "unnecessary changes; (3) added time required in minutes, any timing conflicts, timing "
        "adjustments needed, and notes on whether the sequence still flows logically.",
        RevisionPlan,
    )
    return {
        "purpose_statement": result.purpose_statement,
        "revision_impact_list": result.revision_impact_list,
        "timing_plan": {
            "added_time_minutes": result.added_time_minutes,
            "timing_conflicts": result.timing_conflicts,
            "timing_adjustments": result.timing_adjustments,
            "sequence_notes": result.sequence_notes,
        },
        "phase": "Revision Planning",
        "step": 14,
    }
