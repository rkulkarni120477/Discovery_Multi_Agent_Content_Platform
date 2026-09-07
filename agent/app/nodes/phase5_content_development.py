"""Phase 5 — Content Development (Scenario 2, steps 15-18).

Steps:
  15. Draft student-facing revisions.
  16. Draft teacher-facing guidance.
  17. Update connected lesson components.
  18. Write rationale documentation.
"""

from __future__ import annotations

import json

from app.llm import ask_structured, ask_text
from app.schemas import RevisionPlan  # noqa: F401 (kept for type context in docstrings)
from app.state import ScenarioState


def draft_student_content(state: ScenarioState) -> dict:
    lesson_id = state["selected_combination"]["lesson_id"]
    content = ask_text(
        "Develop the student-facing revisions needed to integrate the literacy strategy "
        "meaningfully into this lesson at the selected integration point: revised instructions, "
        "new prompts/questions, reading/vocabulary/writing supports, discussion prompts, and/or "
        "graphic-organizer directions as appropriate to the strategy. Maintain grade "
        "appropriateness, science accuracy, an appropriate reading level, and Discovery "
        "Education's instructional voice. Output the complete revised student-facing section, not "
        "just the diff.\n\n"
        f"Original lesson:\n{state['documents'][lesson_id]['text']}\n\n"
        f"Selected strategy + lesson: {json.dumps(state['selected_combination'], indent=2)}\n"
        f"Selected integration point: {json.dumps(state['selected_integration_point'], indent=2)}\n"
        f"Purpose statement: {state['purpose_statement']}\n"
        f"Revision-impact list: {json.dumps(state['revision_impact_list'], indent=2)}",
        max_tokens=8192,
    )
    return {
        "draft_student_content": content,
        "phase": "Content Development",
        "step": 15,
    }


def draft_teacher_content(state: ScenarioState) -> dict:
    lesson_id = state["selected_combination"]["lesson_id"]
    content = ask_text(
        "Develop or revise the teacher-facing guidance so an educator can implement the literacy "
        "strategy successfully at the selected integration point: purpose, facilitation guidance, "
        "modeling directions, suggested prompts, expected student responses, scaffolding, "
        "differentiation, timing, and transition guidance. Output the complete revised "
        "teacher-facing section.\n\n"
        f"Original teacher-facing content (from full lesson):\n{state['documents'][lesson_id]['text']}\n\n"
        f"Student-facing revision just drafted:\n{state['draft_student_content']}\n\n"
        f"Purpose statement: {state['purpose_statement']}",
        max_tokens=8192,
    )
    return {
        "draft_teacher_content": content,
        "phase": "Content Development",
        "step": 16,
    }


def update_connected_components(state: ScenarioState) -> dict:
    updates = ask_text(
        "Given all drafted revisions below, review whether learning-target language, vocabulary, "
        "differentiation, materials, timing, assessments, sample responses, teacher preparation, "
        "transitions, or student tools/resources are affected elsewhere in the lesson. List only "
        "the connected updates actually necessary for consistency — one bullet per update, each "
        "naming the component and the specific change. Do not restate the revisions themselves.\n\n"
        f"Revision-impact list: {json.dumps(state['revision_impact_list'], indent=2)}\n"
        f"Student-facing revision:\n{state['draft_student_content']}\n\n"
        f"Teacher-facing revision:\n{state['draft_teacher_content']}",
    )
    connected_updates = [line.strip("- ").strip() for line in updates.splitlines() if line.strip()]
    return {
        "connected_updates": connected_updates,
        "phase": "Content Development",
        "step": 17,
    }


def write_rationale(state: ScenarioState) -> dict:
    rationale = ask_text(
        "Write a clear rationale document explaining: which literacy strategy was selected and "
        "why, where and why it was integrated, what changed, how the change strengthens literacy "
        "development, how it supports the science-learning outcome, how it preserves scientific "
        "accuracy and instructional intent, and why the integration is meaningful rather than "
        "additive (bolted-on).\n\n"
        f"Selected combination: {json.dumps(state['selected_combination'], indent=2)}\n"
        f"Selected integration point: {json.dumps(state['selected_integration_point'], indent=2)}\n"
        f"Purpose statement: {state['purpose_statement']}\n"
        f"Student-facing revision:\n{state['draft_student_content']}\n\n"
        f"Teacher-facing revision:\n{state['draft_teacher_content']}",
    )
    return {
        "rationale_doc": rationale,
        "phase": "Content Development",
        "step": 18,
    }
