"""End-to-end smoke test for Scenario 3: drives the compiled graph through all 16 steps using the
synthetic fixtures, auto-confirming the AI's recommendation at each of the 3 human checkpoints, and
asserts a non-empty final package comes out the other end.

Requires a real OPENAI_API_KEY (this test makes real model calls) — skipped otherwise.
"""

from __future__ import annotations

import os
import uuid
from pathlib import Path

import pytest
from langgraph.types import Command

from app.graph_scenario3 import get_compiled_graph
from app.store import NO_OVERRIDE

FIXTURES = Path(__file__).parent / "fixtures_scenario3"

pytestmark = pytest.mark.skipif(
    not os.environ.get("OPENAI_API_KEY"),
    reason="OPENAI_API_KEY not set; skipping live-model smoke test",
)


def _doc(name: str) -> dict:
    path = FIXTURES / name
    return {"filename": name, "text": path.read_text(encoding="utf-8")}


def test_full_run_reaches_final_package():
    graph = get_compiled_graph()
    run_id = f"smoke3-{uuid.uuid4()}"
    config = {"configurable": {"thread_id": run_id}}

    initial_state = {
        "job_id": run_id,
        "status": "running",
        "documents": {
            "scope_sequence": _doc("scope_sequence.txt"),
            "standards_reference": _doc("standards_reference.txt"),
            "lesson_files": [_doc("lesson_2.txt"), _doc("lesson_2_support.txt")],
        },
    }

    graph.invoke(initial_state, config=config)

    safety_counter = 0
    while graph.get_state(config).next:
        graph.invoke(Command(resume=NO_OVERRIDE), config=config)
        safety_counter += 1
        assert safety_counter < 10, "too many resume cycles; graph likely stuck"

    final_state = graph.get_state(config).values
    assert final_state["status"] == "complete"
    assert final_state["final_package"]
    assert final_state["final_package"]["unit_summary"]
    assert final_state["updated_scope_sequence"]
