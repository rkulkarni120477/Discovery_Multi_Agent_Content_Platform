"""The two human-in-the-loop checkpoints in the Scenario 1 graph.

Unlike Scenario 2/3 (three checkpoints each), Scenario 1 only pauses at two points -- every other
step is fully AI-automatable:
  - step 5 (grade-level depth validation): a SC Science Standards SME validates the grade-level
    judgment for each SEP/DCI/CCC dimension.
  - step 10 (recommend remediation): final remediation recommendations require curriculum/SME
    judgment -- a SC Science Standards SME must verify all assumptions behind the gaps identified
    in step 9 and the remediation recommended in step 10 before they're finalized.
"""

from __future__ import annotations

from langgraph.types import interrupt

from app.state_scenario1 import ScenarioState1
from app.store import NO_OVERRIDE


def review_grade_level_depth(state: ScenarioState1) -> dict:
    decision = interrupt(
        {
            "type": "review_grade_level_depth",
            "grade_level_depth_validation": state["grade_level_depth_validation"],
            "instructions": "A SC Science Standards SME should validate each grade-level depth "
            "judgment against the vertical articulation documents. Edit any row or confirm as-is.",
        }
    )
    confirmed = state["grade_level_depth_validation"] if decision == NO_OVERRIDE else decision
    return {
        "confirmed_grade_level_depth_validation": confirmed,
        "phase": "Performance Target Mapping & Validation",
        "step": 5,
    }


def review_gap_analysis(state: ScenarioState1) -> dict:
    decision = interrupt(
        {
            "type": "review_gap_analysis",
            "gap_analysis": state["gap_analysis"],
            "instructions": "A SC Science Standards SME must verify all assumptions behind these "
            "gaps and remediation recommendations before they're finalized. Edit any row or "
            "confirm as-is.",
        }
    )
    confirmed = state["gap_analysis"] if decision == NO_OVERRIDE else decision
    return {
        "confirmed_gap_analysis": confirmed,
        "phase": "Gap Analysis & Remediation",
        "step": 10,
    }
