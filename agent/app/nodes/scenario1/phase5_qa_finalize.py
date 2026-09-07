"""Phase 5 -- QA & Finalization (Scenario 1, step 11) + final package production.

Step:
  11. QA & Finalize.

The South Carolina Grade 4 assessment-requirements flag (from the original source email) isn't one
of the 11 canonical steps, but is still worth carrying into the final package for visibility as a
fixed note -- it costs nothing and preserves institutional knowledge the client themselves raised.
It makes no LLM call.
"""

from __future__ import annotations

import json

from app.llm import ask_structured
from app.schemas_scenario1 import FinalPackage1, FinalQAReviewModel
from app.state_scenario1 import ScenarioState1

OUT_OF_SCOPE_NOTE = (
    "South Carolina has assessment requirements specific to Grade 4. This was flagged as a "
    "separate, optional follow-on effort -- out of scope for this K-5 NGSS-to-SC alignment "
    "workflow -- and is not addressed by the analysis above."
)


def qa_and_finalize(state: ScenarioState1) -> dict:
    finding = ask_structured(
        "Review the full analysis below for accuracy, consistency, traceability, and "
        "completeness before it's finalized: do the classifications match their stated rationale, "
        "are the recommended remediations actually traceable to the gaps and evidence review, and "
        "is any SC requirement missing from the chain end to end? List concrete findings, list "
        "only genuine issues in issues_to_resolve, and set passed to true only if that list is "
        "empty.\n\n"
        f"Crosswalk:\n{json.dumps(state['crosswalk'], indent=2)}\n\n"
        f"SC deltas:\n{json.dumps(state['sc_deltas'], indent=2)}\n\n"
        f"Grade-level depth validation:\n"
        f"{json.dumps(state['confirmed_grade_level_depth_validation'], indent=2)}\n\n"
        f"Classification:\n{json.dumps(state['classification'], indent=2)}\n\n"
        f"Gap analysis & remediation:\n{json.dumps(state['confirmed_gap_analysis'], indent=2)}",
        FinalQAReviewModel,
    )
    return {
        "final_qa_review": finding.model_dump(),
        "out_of_scope_note": OUT_OF_SCOPE_NOTE,
        "phase": "QA & Finalization",
        "step": 11,
    }


def produce_final_package(state: ScenarioState1) -> dict:
    classification = state["classification"]
    strong = sum(1 for c in classification if c["classification"] == "Strong")
    partial = sum(1 for c in classification if c["classification"] == "Partial")
    gap = sum(1 for c in classification if c["classification"] == "Gap")

    summary = ask_structured(
        "Summarize the outcome of this NGSS-to-South-Carolina alignment review for Discovery "
        "Education's review: a short summary and overall notes.\n\n"
        f"Classification counts -- Strong: {strong}, Partial: {partial}, Gap: {gap}, "
        f"Total: {len(classification)}\n\n"
        f"Gap analysis & remediation:\n{json.dumps(state['confirmed_gap_analysis'], indent=2)}\n\n"
        f"Final QA review:\n{json.dumps(state['final_qa_review'], indent=2)}",
        FinalPackage1,
    )
    final_package = {
        **summary.model_dump(),
        "sc_codes_strong": strong,
        "sc_codes_partial": partial,
        "sc_codes_gap": gap,
        "sc_codes_total": len(classification),
        "ngss_alignment_inventory": state["ngss_alignment_inventory"],
        "crosswalk": state["crosswalk"],
        "sc_deltas": state["sc_deltas"],
        "performance_target_map": state["performance_target_map"],
        "grade_level_depth_validation": state["confirmed_grade_level_depth_validation"],
        "alignment_criteria": state["alignment_criteria"],
        "evidence_review": state["evidence_review"],
        "classification": classification,
        "gap_analysis": state["confirmed_gap_analysis"],
        "final_qa_review": state["final_qa_review"],
        "out_of_scope_note": state["out_of_scope_note"],
    }
    return {
        "final_package": final_package,
        "phase": "QA & Finalization",
        "step": 11,
        "status": "complete",
    }
