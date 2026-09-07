"""Phase 5 -- Content Drafting (Scenario 3, steps 11-13).

Steps:
  11. Draft revised or new content.
  12. Write rationale documentation for each revision.
  13. Update the scope and sequence.
"""

from __future__ import annotations

import json

from app.llm import ask_structured, ask_text
from app.schemas_scenario3 import DraftedContentList, RationaleEntryList
from app.state_scenario3 import ScenarioState3


def draft_content(state: ScenarioState3) -> dict:
    lesson_files = state["documents"].get("lesson_files", [])
    format_reference = "\n\n".join(
        f"=== {f['filename']} ===\n{f['text'][:1500]}" for f in lesson_files
    )
    result = ask_structured(
        "Write the actual content for each planned revision below. Every new or revised element "
        "must match the existing lesson files' format for slides, vocabulary, and educator "
        "support, and be age-appropriate, at a comparable reading level, and matched to the same "
        "instructional voice as the source material.\n\n"
        f"Revision plan:\n{json.dumps(state['confirmed_revision_plan'], indent=2)}\n\n"
        f"Original lesson files (format reference):\n{format_reference}",
        DraftedContentList,
    )
    return {
        "drafted_content": [i.model_dump() for i in result.items],
        "phase": "Content Drafting",
        "step": 11,
    }


def write_rationale(state: ScenarioState3) -> dict:
    result = ask_structured(
        "For each revision below, write a clear rationale: which state standard it addresses, "
        "what the gap was, what changed, and why this strengthens alignment without disrupting "
        "the unit's instructional coherence.\n\n"
        f"Revision plan:\n{json.dumps(state['confirmed_revision_plan'], indent=2)}\n\n"
        f"Gap list:\n{json.dumps(state['gap_list'], indent=2)}\n\n"
        f"Drafted content:\n{json.dumps(state['drafted_content'], indent=2)}",
        RationaleEntryList,
    )
    return {
        "rationale_entries": [e.model_dump() for e in result.entries],
        "phase": "Content Drafting",
        "step": 12,
    }


def update_scope_sequence(state: ScenarioState3) -> dict:
    scope_sequence_text = state["documents"]["scope_sequence"]["text"]
    updated = ask_text(
        "Revise this scope-and-sequence document to reflect the new state-standards alignment: "
        "replace or supplement the C3 codes shown with the corresponding state standard IDs from "
        "the crosswalk and revision plan below. Retain the original C3 standards alongside the "
        "state standards (the product still needs to work in states that use the C3 framework "
        "directly). Output the complete revised scope-and-sequence text.\n\n"
        f"Original scope and sequence:\n{scope_sequence_text}\n\n"
        f"Crosswalk:\n{json.dumps(state['confirmed_crosswalk'], indent=2)}\n\n"
        f"Revision plan:\n{json.dumps(state['confirmed_revision_plan'], indent=2)}",
        max_tokens=8192,
    )
    return {
        "updated_scope_sequence": updated,
        "phase": "Content Drafting",
        "step": 13,
    }
