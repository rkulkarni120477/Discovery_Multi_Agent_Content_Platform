"""Phase 2 -- Performance Target Mapping & Validation (Scenario 1, steps 4-5; step 5's human
confirmation is captured by ``checkpoints.review_grade_level_depth``).

Steps:
  4. Map SC Performance Targets.
  5. Validate Grade-Level Depth (SEP/DCI/CCC).
"""

from __future__ import annotations

import json

from app.llm import ask_structured
from app.schemas_scenario1 import GradeLevelDepthValidation, PerformanceTargetMap
from app.state_scenario1 import ScenarioState1

THREE_DIMENSIONS_GLOSSARY = (
    "SEP = Science and Engineering Practices (how students engage in scientific investigation, "
    "reasoning, modeling, argumentation, etc.). DCI = Disciplinary Core Ideas (the core science "
    "content/concepts students need to understand). CCC = Crosscutting Concepts (concepts that "
    "apply across science disciplines, such as patterns, cause and effect, systems, structure and "
    "function, and energy and matter). Together, DCI + SEP + CCC are the three dimensions of "
    "three-dimensional science learning used in NGSS-style science standards."
)


def map_performance_targets(state: ScenarioState1) -> dict:
    performance_targets = state["documents"]["sc_performance_targets"]["text"]
    result = ask_structured(
        "Map each relevant South Carolina Performance Target below to its corresponding standard "
        "from the SC crosswalk, including standards classified as Same. Produce one row for every "
        "crosswalked SC standard. If a separate performance target is not present in the supplied "
        "reference, use the SC standard itself as the performance target and note that it was "
        "derived from the standard. Identify whether each target requires observable student "
        "performance.\n\n"
        f"SC crosswalk:\n{json.dumps(state['crosswalk'], indent=2)}\n\n"
        f"SC Performance Targets (K-5):\n{performance_targets}",
        PerformanceTargetMap,
    )
    rows = [r.model_dump() for r in result.rows]
    if not rows:
        rows = [
            {
                "sc_code": row["sc_code"],
                "performance_target_id": row["sc_code"],
                "performance_target_text": f"South Carolina performance expectation {row['sc_code']}",
                "requires_observable_performance": True,
                "notes": "Derived from the crosswalk because no separate performance target was found.",
            }
            for row in state["crosswalk"]
            if row.get("sc_code")
        ]
    return {
        "performance_target_map": rows,
        "phase": "Performance Target Mapping & Validation",
        "step": 4,
    }


def validate_grade_level_depth(state: ScenarioState1) -> dict:
    vertical_articulation = state["documents"]["sc_vertical_articulation"]["text"]
    result = ask_structured(
        f"{THREE_DIMENSIONS_GLOSSARY}\n\n"
        "For each standard in the performance target map below, check whether the expected "
        "Science and Engineering Practices (SEP), Disciplinary Core Ideas (DCI), and Crosscutting "
        "Concepts (CCC) are addressed at the depth expected for that grade -- confirm whether a "
        "program written for NGSS also satisfies South Carolina's expectation at the correct "
        "grade-level depth. Produce one row per (standard, dimension) pair -- i.e. up to three "
        "rows per standard, one each for SEP, DCI, and CCC -- using the vertical articulation "
        "documents as the source of the expected depth.\n\n"
        f"Performance target map:\n{json.dumps(state['performance_target_map'], indent=2)}\n\n"
        f"SC vertical articulation of SEPs, DCIs, and CCCs:\n{vertical_articulation}",
        GradeLevelDepthValidation,
    )
    return {
        "grade_level_depth_validation": [r.model_dump() for r in result.rows],
        "phase": "Performance Target Mapping & Validation",
        "step": 5,
    }
