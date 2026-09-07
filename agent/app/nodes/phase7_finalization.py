"""Phase 7 — Finalization (Scenario 2, steps 24-27; step 24's human input is captured upstream by
``checkpoints.review_qa_feedback``).

Steps:
  24. Incorporate review feedback.
  25. Re-review affected components.
  26. Finalize revised lesson content.
  27. Produce final change and rationale documentation.
"""

from __future__ import annotations

import json

from app.llm import ask_structured, ask_text
from app.schemas import FinalPackage, QAFindingModel
from app.state import ScenarioState


def incorporate_feedback(state: ScenarioState) -> dict:
    human_decisions = state.get("qa_human_decisions") or {}
    updated_student = ask_text(
        "Resolve the following confirmed QA issues in the student-facing content. Only change what "
        "is necessary to resolve each issue; do not otherwise rewrite the content. Output the "
        "complete updated student-facing section.\n\n"
        f"Current student-facing content:\n{state['draft_student_content']}\n\n"
        f"QA findings:\n{json.dumps(state['qa_findings'], indent=2)}\n\n"
        f"Human review decisions (which issues to actually fix, or added notes):\n"
        f"{json.dumps(human_decisions, indent=2)}",
        max_tokens=8192,
    )
    updated_teacher = ask_text(
        "Resolve the following confirmed QA issues in the teacher-facing content, keeping it "
        "consistent with the updated student-facing content below. Only change what is necessary. "
        "Output the complete updated teacher-facing section.\n\n"
        f"Current teacher-facing content:\n{state['draft_teacher_content']}\n\n"
        f"Updated student-facing content:\n{updated_student}\n\n"
        f"QA findings:\n{json.dumps(state['qa_findings'], indent=2)}\n\n"
        f"Human review decisions:\n{json.dumps(human_decisions, indent=2)}",
        max_tokens=8192,
    )
    return {
        "updated_student_content": updated_student,
        "updated_teacher_content": updated_teacher,
        "phase": "Finalization",
        "step": 24,
    }


def re_review(state: ScenarioState) -> dict:
    finding = ask_structured(
        "Conduct a targeted re-review of the updated lesson components below. Confirm that "
        "resolving the prior QA issues has not introduced any new inconsistency, scientific "
        "inaccuracy, or coherence problem. Set category to 're_review'.\n\n"
        f"Updated student-facing content:\n{state['updated_student_content']}\n\n"
        f"Updated teacher-facing content:\n{state['updated_teacher_content']}\n\n"
        f"Prior QA findings that were being resolved:\n{json.dumps(state['qa_findings'], indent=2)}",
        QAFindingModel,
    )
    return {
        "final_validation_status": finding.model_dump(),
        "phase": "Finalization",
        "step": 25,
    }


def finalize(state: ScenarioState) -> dict:
    return {
        "final_student_content": state["updated_student_content"],
        "final_teacher_content": state["updated_teacher_content"],
        "phase": "Finalization",
        "step": 26,
    }


def produce_final_package(state: ScenarioState) -> dict:
    lesson_id = state["selected_combination"]["lesson_id"]
    package = ask_structured(
        "Create a concise final record for Discovery Education's review showing: the original "
        "lesson location/content that was changed, the selected literacy strategy, a summary of "
        "the revised content, the reason for the change, the literacy benefit, the science-learning "
        "benefit, and any timing or instructional impact.\n\n"
        f"Original lesson:\n{state['documents'][lesson_id]['text']}\n\n"
        f"Selected combination: {json.dumps(state['selected_combination'], indent=2)}\n"
        f"Selected integration point: {json.dumps(state['selected_integration_point'], indent=2)}\n"
        f"Final student-facing content:\n{state['final_student_content']}\n\n"
        f"Final teacher-facing content:\n{state['final_teacher_content']}\n\n"
        f"Rationale document:\n{state['rationale_doc']}",
        FinalPackage,
    )
    final_package = {
        **package.model_dump(),
        "lesson_id": lesson_id,
        "student_content": state["final_student_content"],
        "teacher_content": state["final_teacher_content"],
        "rationale_doc": state["rationale_doc"],
        "connected_updates": state["connected_updates"],
        "qa_findings": state["qa_findings"],
        "final_validation_status": state["final_validation_status"],
    }
    return {
        "final_package": final_package,
        "phase": "Finalization",
        "step": 27,
        "status": "complete",
    }
