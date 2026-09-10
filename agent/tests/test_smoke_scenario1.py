"""End-to-end smoke test for the fully automated Scenario 1 graph using synthetic fixtures.

Requires a real OPENAI_API_KEY (this test makes real model calls) — skipped otherwise.
"""

from __future__ import annotations

import os
import uuid
from pathlib import Path

import pytest
from langgraph.types import Command

from app.graph_scenario1 import get_compiled_graph
from app.store import NO_OVERRIDE

FIXTURES = Path(__file__).parent / "fixtures_scenario1"

pytestmark = pytest.mark.skipif(
    not os.environ.get("OPENAI_API_KEY"),
    reason="OPENAI_API_KEY not set; skipping live-model smoke test",
)


def _doc(name: str) -> dict:
    path = FIXTURES / name
    return {"filename": name, "text": path.read_text(encoding="utf-8")}


def test_full_run_reaches_final_package():
    graph = get_compiled_graph()
    run_id = f"smoke1-{uuid.uuid4()}"
    config = {"configurable": {"thread_id": run_id}}

    initial_state = {
        "job_id": run_id,
        "status": "running",
        "documents": {
            "existing_product_content": _doc("existing_product_content.txt"),
            "sc_standards_reference": _doc("sc_standards_reference.txt"),
            "sc_performance_targets": _doc("sc_performance_targets.txt"),
            "sc_vertical_articulation": _doc("sc_vertical_articulation.txt"),
        },
    }

    graph.invoke(initial_state, config=config)
    assert not graph.get_state(config).next, "automated Scenario 1 must not pause for HITL review"

    safety_counter = 0
    while graph.get_state(config).next:
        graph.invoke(Command(resume=NO_OVERRIDE), config=config)
        safety_counter += 1
        assert safety_counter < 10, "too many resume cycles; graph likely stuck"

    final_state = graph.get_state(config).values
    assert final_state["status"] == "complete"
    assert final_state["final_package"]
    assert final_state["final_package"]["summary"]
    assert final_state["final_package"]["sc_codes_total"] > 0
    assert final_state["final_package"]["final_qa_review"]
    assert final_state["out_of_scope_note"]
