"""End-to-end smoke test: drives the compiled graph through all 27 steps using the synthetic
fixtures, auto-confirming the AI's recommendation at each of the 3 human checkpoints, and asserts a
non-empty final package comes out the other end.

Requires a real OPENAI_API_KEY (this test makes real model calls) — skipped otherwise.
"""

from __future__ import annotations

import os
import uuid
from pathlib import Path

import pytest
from langgraph.types import Command

from app.graph import get_compiled_graph
from app.store import NO_OVERRIDE

FIXTURES = Path(__file__).parent / "fixtures"

pytestmark = pytest.mark.skipif(
    not os.environ.get("OPENAI_API_KEY"),
    reason="OPENAI_API_KEY not set; skipping live-model smoke test",
)


def _doc(name: str) -> dict:
    path = FIXTURES / name
    return {"filename": name, "text": path.read_text(encoding="utf-8")}


def test_full_run_reaches_final_package():
    graph = get_compiled_graph()
    run_id = f"smoke-{uuid.uuid4()}"
    config = {"configurable": {"thread_id": run_id}}

    initial_state = {
        "job_id": run_id,
        "status": "running",
        "documents": {
            "lesson_1": _doc("lesson_1.txt"),
            "lesson_2": _doc("lesson_2.txt"),
            "lesson_3": _doc("lesson_3.txt"),
            "literacy_strategy": _doc("literacy_strategy.txt"),
        },
    }

    graph.invoke(initial_state, config=config)

    # Auto-confirm the AI's recommendation at each human checkpoint until the graph has no more
    # pending nodes. NO_OVERRIDE (not None -- see app/store.py) tells each checkpoint node to keep
    # the AI's recommendation as-is.
    safety_counter = 0
    while graph.get_state(config).next:
        graph.invoke(Command(resume=NO_OVERRIDE), config=config)
        safety_counter += 1
        assert safety_counter < 10, "too many resume cycles; graph likely stuck"

    final_state = graph.get_state(config).values
    assert final_state["status"] == "complete"
    assert final_state["final_package"]
    assert final_state["final_package"]["selected_literacy_strategy"]
    assert final_state["final_student_content"]
    assert final_state["final_teacher_content"]
