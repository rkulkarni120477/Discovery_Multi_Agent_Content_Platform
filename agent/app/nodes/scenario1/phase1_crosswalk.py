"""Phase 1 -- Standards Crosswalk (Scenario 1, steps 1-3).

Steps:
  1. Inventory Existing NGSS Alignment.
  2. NGSS-to-SC Performance Expectation Crosswalk.
  3. Identify SC Standards Deltas.
"""

from __future__ import annotations

import json
import re

from app.llm import ask_structured
from app.schemas_scenario1 import Crosswalk1, DeltaList
from app.state_scenario1 import ScenarioState1


def _relevant_standard_excerpts(standards_text: str, ngss_codes: list[str]) -> str:
    excerpts: list[str] = []
    for code in ngss_codes:
        match = re.search(rf"\b{re.escape(code)}\b", standards_text)
        if match:
            excerpt = " ".join(standards_text[match.start() : match.start() + 1_500].split())
            excerpts.append(excerpt)
    if excerpts:
        return "\n\n".join(excerpts)
    return " ".join(standards_text[:20_000].split())


def inventory_ngss_alignment(state: ScenarioState1) -> dict:
    content = state["documents"]["existing_product_content"]["text"]
    citations_by_code: dict[str, dict[str, str]] = {}
    pattern = re.compile(r"\b(?:K|[1-5]|3-5)-(?:PS|LS|ESS|ETS)\d+-\d+\b")

    for match in pattern.finditer(content):
        ngss_code = match.group(0)
        if ngss_code in citations_by_code:
            continue
        page_matches = list(re.finditer(r"--\s*(\d+)\s+of\s+\d+\s*--", content[: match.start()]))
        page = page_matches[-1].group(1) if page_matches else "unknown"
        excerpt = " ".join(content[match.start() : match.start() + 600].split())
        citations_by_code[ngss_code] = {
            "ngss_code": ngss_code,
            "ngss_text": excerpt,
            "citation_location": f"Page {page}; text beginning with {ngss_code}",
        }

    return {
        "ngss_alignment_inventory": list(citations_by_code.values()),
        "phase": "Standards Crosswalk",
        "step": 1,
    }


def crosswalk_ngss_to_sc(state: ScenarioState1) -> dict:
    sc_standards = state["documents"]["sc_standards_reference"]["text"]
    inventory = state["ngss_alignment_inventory"]
    relevant_standards = _relevant_standard_excerpts(
        sc_standards, [citation["ngss_code"] for citation in inventory]
    )
    result = ask_structured(
        "Crosswalk every NGSS Performance Expectation identified in the uploaded Discovery "
        "Education product content below to its South Carolina counterpart. The extracted "
        "inventory is the authoritative NGSS source for this run; do not infer standards absent "
        "from it. "
        "Focus especially on anywhere South Carolina's standards add, modify, or reframe the "
        "underlying NGSS logic -- South Carolina's science standards are NGSS-like but carry a "
        "state-specific implementation layer. For each pairing, classify the relationship as "
        "'Same', 'SC adds', 'SC modifies', 'SC reframes', or 'No SC counterpart', with notes.\n\n"
        f"Relevant South Carolina Science Standards excerpts:\n{relevant_standards}\n\n"
        f"NGSS alignment inventory extracted from the product content:\n"
        f"{json.dumps(inventory, indent=2)}",
        Crosswalk1,
    )
    return {
        "crosswalk": [r.model_dump() for r in result.rows],
        "phase": "Standards Crosswalk",
        "step": 2,
    }


def identify_sc_deltas(state: ScenarioState1) -> dict:
    result = ask_structured(
        "Using the crosswalk below, identify where South Carolina adds, modifies, emphasizes, or "
        "reframes requirements compared with the NGSS Performance Expectations implemented in the "
        "uploaded product content (clarification statements and assessment boundaries count too). "
        "For each delta, classify it as an "
        "addition, modification, emphasis, or reframe, with a description.\n\n"
        f"{json.dumps(state['crosswalk'], indent=2)}",
        DeltaList,
    )
    return {
        "sc_deltas": [d.model_dump() for d in result.deltas],
        "phase": "Standards Crosswalk",
        "step": 3,
    }
