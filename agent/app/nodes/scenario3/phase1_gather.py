"""Phase 1 -- Gather & Organize (Scenario 3, steps 1-4).

Steps:
  1. Identify the grade level from provided materials.
  2. Acquire the state's standards for the identified grade.
  3. Extract the existing C3 alignment from DE's scope and sequence.
  4. Build the C3 -> state-standards crosswalk.

Step 2 in the spreadsheet is described as an external acquisition step (source the standards from
the state education department's website). This agent has no web-browsing tool wired in, so instead
of letting the model hallucinate official standards from training data, the workflow requires the
caller to upload an authoritative standards-reference document (``documents.standards_reference``)
-- the same "supplied reference resource" pattern Scenario 2 uses for its literacy-strategy
document. This node's job is exactly what step 2 asks of the AI: parse and structure that source
into a clean, ID'd, domain-tagged reference -- not to go find the source itself.
"""

from __future__ import annotations

import json
import re

from app.llm import ask_structured, ask_text
from app.schemas_scenario3 import C3StandardsTable, Crosswalk, OregonStandardsDoc
from app.state_scenario3 import ScenarioState3

MAX_STANDARDS_CHUNK_CHARS = 12_000


def _split_standards_text(text: str) -> list[str]:
    pages = re.split(r"(?=--\s*\d+\s+of\s+\d+\s*--)", text)
    chunks: list[str] = []
    current = ""

    for page in pages:
        if len(page) > MAX_STANDARDS_CHUNK_CHARS:
            if current:
                chunks.append(current)
                current = ""
            chunks.extend(
                page[index : index + MAX_STANDARDS_CHUNK_CHARS]
                for index in range(0, len(page), MAX_STANDARDS_CHUNK_CHARS)
            )
        elif current and len(current) + len(page) > MAX_STANDARDS_CHUNK_CHARS:
            chunks.append(current)
            current = page
        else:
            current += page

    if current:
        chunks.append(current)
    return chunks


def identify_grade_level(state: ScenarioState3) -> dict:
    docs = state["documents"]
    lesson_files = docs.get("lesson_files", [])
    filenames = ", ".join(f["filename"] for f in lesson_files) or "(none provided)"
    scope_sequence_name = docs["scope_sequence"]["filename"]
    grade = ask_text(
        "Confirm the grade level this unit targets, based on the scope-and-sequence title and the "
        "lesson filenames/content below. Respond with just the grade level (e.g. 'Grade 2') and a "
        "one-sentence justification.\n\n"
        f"Scope and sequence file: {scope_sequence_name}\n"
        f"Lesson files: {filenames}\n\n"
        f"Scope and sequence excerpt:\n{docs['scope_sequence']['text'][:3000]}",
    )
    return {
        "confirmed_grade": grade,
        "phase": "Gather & Organize",
        "step": 1,
    }


def acquire_standards(state: ScenarioState3) -> dict:
    reference_text = state["documents"]["standards_reference"]["text"]
    standards_by_id: dict[str, dict] = {}
    chunks = _split_standards_text(reference_text)
    for index, chunk in enumerate(chunks, start=1):
        result = ask_structured(
            "The document excerpt below is part of an authoritative state-standards reference. "
            "Extract only the standards present in this excerpt that apply to the confirmed grade "
            f"level ({state['confirmed_grade']}). For each, give it a standard_id, its full text, "
            "and a domain/strand tag. Do not infer standards that do not appear in this excerpt.\n\n"
            f"Excerpt {index} of {len(chunks)}:\n{chunk}",
            OregonStandardsDoc,
        )
        for standard in result.standards:
            standards_by_id.setdefault(standard.standard_id, standard.model_dump())
    return {
        "oregon_standards": list(standards_by_id.values()),
        "phase": "Gather & Organize",
        "step": 2,
    }


def extract_c3_alignment(state: ScenarioState3) -> dict:
    scope_sequence_text = state["documents"]["scope_sequence"]["text"]
    result = ask_structured(
        "Pull out every C3 Framework standard code listed across this scope-and-sequence document, "
        "each with its full C3 standard text. Focus especially on the unit that is the subject of "
        "this revision (infer which unit from context/headings), but include every C3 code found.\n\n"
        f"{scope_sequence_text}",
        C3StandardsTable,
    )
    return {
        "c3_standards": [s.model_dump() for s in result.standards],
        "phase": "Gather & Organize",
        "step": 3,
    }


def build_crosswalk(state: ScenarioState3) -> dict:
    result = ask_structured(
        "Build a two-directional crosswalk between the C3 standards claimed by this unit and the "
        "state standards reference below. For each C3 standard, find its closest state-standard "
        "equivalent and classify the match as Direct match, Partial overlap, state-standard "
        "broader, state-standard narrower, or No match, with notes explaining the classification. "
        "Then reverse-scan the full state standards list for any standard with no C3 counterpart "
        "among the claimed C3 standards, and list those standard_ids separately.\n\n"
        f"C3 standards claimed:\n{json.dumps(state['c3_standards'], indent=2)}\n\n"
        f"State standards reference:\n{json.dumps(state['oregon_standards'], indent=2)}",
        Crosswalk,
    )
    return {
        "crosswalk": [r.model_dump() for r in result.rows],
        "unmatched_oregon_standards": result.unmatched_oregon_standards,
        "phase": "Gather & Organize",
        "step": 4,
    }
