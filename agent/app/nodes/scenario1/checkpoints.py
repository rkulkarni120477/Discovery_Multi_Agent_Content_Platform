"""Scenario 1 decision nodes for automated and manual execution.

Unlike Scenario 2/3 (three checkpoints each), Scenario 1 only pauses at two points -- every other
step is fully AI-automatable:
  - step 5 (grade-level depth validation): a SC Science Standards SME validates the grade-level
    judgment for each SEP/DCI/CCC dimension.
  - step 10 (recommend remediation): final remediation recommendations require curriculum/SME
    judgment -- a SC Science Standards SME must verify all assumptions behind the gaps identified
    in step 9 and the remediation recommended in step 10 before they're finalized.
The standard Scenario 1 graph uses the automated functions, which accept the AI-generated
recommendations without pausing. The separate manual graph continues to use the review functions
below so explicit manual execution retains its step and review approvals.
"""

from __future__ import annotations

from langgraph.types import interrupt

from app.state_scenario1 import ScenarioState1
from app.store import NO_OVERRIDE


def automate_grade_level_depth(state: ScenarioState1) -> dict:
    return {
        "confirmed_grade_level_depth_validation": state["grade_level_depth_validation"],
        "phase": "Performance Target Mapping & Validation",
        "step": 5,
    }


def automate_gap_analysis(state: ScenarioState1) -> dict:
    return {
        "confirmed_gap_analysis": state["gap_analysis"],
        "phase": "Gap Analysis & Remediation",
        "step": 10,
    }


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
