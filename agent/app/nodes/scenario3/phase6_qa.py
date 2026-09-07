"""Phase 6 -- Quality Assurance (Scenario 3, steps 14-16) plus final package production.

Steps:
  14. Coherence review of the revised unit.
  15. Final standards coverage verification.
  16. Editorial and format review.

Unlike Scenario 2's five independent QA passes, these three are naturally sequential (coverage
verification needs the finalized content; editorial review is a last pass over everything), so
they run one after another rather than fanning out in parallel.
"""

from __future__ import annotations

import json

from app.llm import ask_structured
from app.schemas_scenario3 import FinalAlignmentMatrix, FinalPackage3, QAFinding3Model
from app.state_scenario3 import ScenarioState3


def coherence_review(state: ScenarioState3) -> dict:
    finding = ask_structured(
        "Read the revised unit end to end as a teacher would, using the materials below: check "
        "vocabulary sequencing, cross-references, the learning arc, repeated content, timing, and "
        "overall seamlessness of the newly integrated content. Set category to 'coherence'. List "
        "only genuine issues in issues_to_resolve; passed is true only if that list is empty.\n\n"
        f"Updated scope and sequence:\n{state['updated_scope_sequence']}\n\n"
        f"Drafted content:\n{json.dumps(state['drafted_content'], indent=2)}\n\n"
        f"Lesson summaries:\n{json.dumps(state['lesson_summaries'], indent=2)}",
        QAFinding3Model,
    )
    return {
        "coherence_findings": finding.model_dump(),
        "phase": "Quality Assurance",
        "step": 14,
    }


def final_coverage_verification(state: ScenarioState3) -> dict:
    result = ask_structured(
        "Confirm every state standard below now maps to at least one specific instructional "
        "moment in the revised unit (original coverage from the alignment map, plus anything newly "
        "covered by the drafted revisions). Produce a clean alignment matrix: standard -> lesson -> "
        "evidence -> covered (true/false). List any standards still unmet.\n\n"
        f"State standards:\n{json.dumps(state['oregon_standards'], indent=2)}\n\n"
        f"Original alignment map:\n{json.dumps(state['confirmed_alignment_map'], indent=2)}\n\n"
        f"Drafted content:\n{json.dumps(state['drafted_content'], indent=2)}\n\n"
        f"Revision plan:\n{json.dumps(state['confirmed_revision_plan'], indent=2)}",
        FinalAlignmentMatrix,
    )
    return {
        "final_alignment_matrix": [r.model_dump() for r in result.rows],
        "unmet_standards": result.unmet_standards,
        "phase": "Quality Assurance",
        "step": 15,
    }


def editorial_review(state: ScenarioState3) -> dict:
    finding = ask_structured(
        "Final check that every new or revised element below follows the existing lesson files' "
        "formatting conventions, slide structure, and tagging, and is ready for the standard "
        "authoring pipeline (no placeholder text, no missing sections, consistent style). Set "
        "category to 'editorial'.\n\n"
        f"Drafted content:\n{json.dumps(state['drafted_content'], indent=2)}\n\n"
        f"Updated scope and sequence:\n{state['updated_scope_sequence']}",
        QAFinding3Model,
    )
    return {
        "editorial_findings": finding.model_dump(),
        "phase": "Quality Assurance",
        "step": 16,
    }


def produce_final_package(state: ScenarioState3) -> dict:
    summary = ask_structured(
        "Summarize the outcome of this alignment revision for Discovery Education's review: a "
        "short unit summary, how many state standards are now addressed vs. the total, how many "
        "revisions were made, any remaining unmet gaps, and overall notes.\n\n"
        f"Final alignment matrix:\n{json.dumps(state['final_alignment_matrix'], indent=2)}\n\n"
        f"Unmet standards:\n{json.dumps(state['unmet_standards'], indent=2)}\n\n"
        f"Revision plan:\n{json.dumps(state['confirmed_revision_plan'], indent=2)}\n\n"
        f"Rationale entries:\n{json.dumps(state['rationale_entries'], indent=2)}",
        FinalPackage3,
    )
    final_package = {
        **summary.model_dump(),
        "confirmed_grade": state["confirmed_grade"],
        "crosswalk": state["confirmed_crosswalk"],
        "alignment_map": state["confirmed_alignment_map"],
        "gap_list": state["gap_list"],
        "surplus_inventory": state["surplus_inventory"],
        "revision_plan": state["confirmed_revision_plan"],
        "drafted_content": state["drafted_content"],
        "rationale_entries": state["rationale_entries"],
        "updated_scope_sequence": state["updated_scope_sequence"],
        "final_alignment_matrix": state["final_alignment_matrix"],
        "coherence_findings": state["coherence_findings"],
        "editorial_findings": state["editorial_findings"],
    }
    return {
        "final_package": final_package,
        "phase": "Quality Assurance",
        "step": 16,
        "status": "complete",
    }
