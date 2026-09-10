"""Phase 4 -- Gap Analysis & Remediation (Scenario 1, steps 9-10).

Steps:
  9. Identify Specific Gaps.
  10. Recommend Remediation.
"""

from __future__ import annotations

import json

from app.llm import ask_structured
from app.schemas_scenario1 import GapAnalysis, GapDetailList
from app.state_scenario1 import ScenarioState1


def identify_specific_gaps(state: ScenarioState1) -> dict:
    result = ask_structured(
        "For every SC requirement classified as Partial or Gap below, document exactly what is "
        "missing or insufficient in the existing Discovery content -- be specific about which "
        "part of the requirement isn't satisfied, not just that it isn't.\n\n"
        f"Classification:\n{json.dumps(state['classification'], indent=2)}\n\n"
        f"Evidence review:\n{json.dumps(state['evidence_review'], indent=2)}",
        GapDetailList,
    )
    return {
        "gap_details": [g.model_dump() for g in result.gaps],
        "phase": "Gap Analysis & Remediation",
        "step": 9,
    }


def recommend_remediation(state: ScenarioState1) -> dict:
    result = ask_structured(
        "For each gap below, provide one concise, actionable remediation recommendation. "
        "Return one item per gap with the same SC code, a short gap description, and a concrete "
        "curriculum change a writer can implement. Do not repeat the input or add commentary.\n\n"
        f"Gap details:\n{json.dumps(state['gap_details'], indent=2)}\n\n"
        f"Alignment/evidence criteria:\n{json.dumps(state['alignment_criteria'], indent=2)}",
        GapAnalysis,
        max_tokens=1800,
    )
    return {
        "gap_analysis": [g.model_dump() for g in result.gaps],
        "phase": "Gap Analysis & Remediation",
        "step": 10,
    }
