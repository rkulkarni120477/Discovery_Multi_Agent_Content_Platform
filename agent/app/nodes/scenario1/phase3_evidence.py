"""Phase 3 -- Content Alignment Review (Scenario 1, steps 6-8).

Steps:
  6. Define Alignment/Evidence Criteria.
  7. Review Existing Discovery Evidence.
  8. Classify Strong / Partial / Gap.
"""

from __future__ import annotations

import json

from app.llm import ask_structured
from app.schemas_scenario1 import AlignmentCriteriaModel, ClassificationList, EvidenceReview
from app.state_scenario1 import ScenarioState1


def define_alignment_criteria(state: ScenarioState1) -> dict:
    result = ask_structured(
        "Establish consistent criteria for evaluating whether Discovery's existing content "
        "provides sufficient evidence for the South Carolina requirements below. Define: what "
        "counts as Strong evidence (fully satisfies the requirement), what counts as Partial "
        "evidence (addresses the requirement but incompletely), what counts as a Gap "
        "(insufficient or no evidence), and what kind of citation/evidence is required to support "
        "each classification. These criteria will be applied consistently across every "
        "requirement in the next steps.\n\n"
        f"SC deltas:\n{json.dumps(state['sc_deltas'], indent=2)}\n\n"
        f"Performance target map:\n{json.dumps(state['performance_target_map'], indent=2)}",
        AlignmentCriteriaModel,
    )
    return {
        "alignment_criteria": result.model_dump(),
        "phase": "Content Alignment Review",
        "step": 6,
    }


def review_discovery_evidence(state: ScenarioState1) -> dict:
    result = ask_structured(
        "Using the alignment/evidence criteria below, review Discovery's existing NGSS citations "
        "to determine whether they provide evidence for the corresponding South Carolina "
        "requirements. For each SC standard, note the existing citation (if any) and summarize "
        "what that evidence actually shows -- do not classify yet, just describe the evidence.\n\n"
        f"Alignment/evidence criteria:\n{json.dumps(state['alignment_criteria'], indent=2)}\n\n"
        f"Existing NGSS alignment inventory:\n{json.dumps(state['ngss_alignment_inventory'], indent=2)}\n\n"
        f"SC deltas:\n{json.dumps(state['sc_deltas'], indent=2)}\n\n"
        f"Performance target map:\n{json.dumps(state['performance_target_map'], indent=2)}",
        EvidenceReview,
    )
    return {
        "evidence_review": [r.model_dump() for r in result.rows],
        "phase": "Content Alignment Review",
        "step": 7,
    }


def classify_strong_partial_gap(state: ScenarioState1) -> dict:
    result = ask_structured(
        "Using the alignment/evidence criteria and the evidence review below, classify each SC "
        "requirement as Strong, Partial, or Gap based on how completely the existing Discovery "
        "content satisfies it. Apply the criteria consistently and give a rationale for each "
        "classification.\n\n"
        f"Alignment/evidence criteria:\n{json.dumps(state['alignment_criteria'], indent=2)}\n\n"
        f"Evidence review:\n{json.dumps(state['evidence_review'], indent=2)}",
        ClassificationList,
    )
    return {
        "classification": [r.model_dump() for r in result.rows],
        "phase": "Content Alignment Review",
        "step": 8,
    }
