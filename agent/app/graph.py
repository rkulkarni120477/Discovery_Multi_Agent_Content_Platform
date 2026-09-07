"""Builds the Scenario 2 LangGraph StateGraph: 7 phases, 27 steps, 3 human checkpoints, and a
5-way parallel fan-out/fan-in for the QA phase.
"""

from __future__ import annotations

import os
import sqlite3

from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.graph import END, START, StateGraph

from app.nodes import (
    checkpoints,
    phase1_gather,
    phase2_screen,
    phase3_deep_analysis,
    phase4_revision_planning,
    phase5_content_development,
    phase6_qa,
    phase7_finalization,
)
from app.state import ScenarioState

QA_NODES = [
    "qa_literacy_fidelity",
    "qa_science_accuracy",
    "qa_instructional_integrity",
    "qa_coherence_pacing",
    "qa_consistency",
]


def build_graph() -> StateGraph:
    graph = StateGraph(ScenarioState)

    # Phase 1 — Gather & Organize
    graph.add_node("intake", phase1_gather.intake)
    graph.add_node("catalog_metadata", phase1_gather.catalog_metadata)
    graph.add_node("extract_strategies", phase1_gather.extract_strategies)

    # Phase 2 — Understand & Screen
    graph.add_node("summarize_lessons", phase2_screen.summarize_lessons)
    graph.add_node("analyze_strategies", phase2_screen.analyze_strategies)
    graph.add_node("screen_combinations", phase2_screen.screen_combinations)
    graph.add_node("select_combination", checkpoints.select_combination)

    # Phase 3 — Deep Instructional Analysis
    graph.add_node("deep_review", phase3_deep_analysis.deep_review)
    graph.add_node("map_literacy_demands", phase3_deep_analysis.map_literacy_demands)
    graph.add_node("find_integration_points", phase3_deep_analysis.find_integration_points)
    graph.add_node("select_integration_point", checkpoints.select_integration_point)

    # Phase 4 — Revision Planning
    graph.add_node("plan_revision", phase4_revision_planning.plan_revision)

    # Phase 5 — Content Development
    graph.add_node("draft_student_content", phase5_content_development.draft_student_content)
    graph.add_node("draft_teacher_content", phase5_content_development.draft_teacher_content)
    graph.add_node("update_connected_components", phase5_content_development.update_connected_components)
    graph.add_node("write_rationale", phase5_content_development.write_rationale)

    # Phase 6 — Quality Assurance (5-way fan-out / fan-in)
    graph.add_node("qa_literacy_fidelity", phase6_qa.qa_literacy_fidelity)
    graph.add_node("qa_science_accuracy", phase6_qa.qa_science_accuracy)
    graph.add_node("qa_instructional_integrity", phase6_qa.qa_instructional_integrity)
    graph.add_node("qa_coherence_pacing", phase6_qa.qa_coherence_pacing)
    graph.add_node("qa_consistency", phase6_qa.qa_consistency)
    graph.add_node("aggregate_qa", phase6_qa.aggregate_qa)
    graph.add_node("review_qa_feedback", checkpoints.review_qa_feedback)

    # Phase 7 — Finalization
    graph.add_node("incorporate_feedback", phase7_finalization.incorporate_feedback)
    graph.add_node("re_review", phase7_finalization.re_review)
    graph.add_node("finalize", phase7_finalization.finalize)
    graph.add_node("produce_final_package", phase7_finalization.produce_final_package)

    # Wiring
    graph.add_edge(START, "intake")
    graph.add_edge("intake", "catalog_metadata")
    graph.add_edge("catalog_metadata", "extract_strategies")
    graph.add_edge("extract_strategies", "summarize_lessons")
    graph.add_edge("summarize_lessons", "analyze_strategies")
    graph.add_edge("analyze_strategies", "screen_combinations")
    graph.add_edge("screen_combinations", "select_combination")
    graph.add_edge("select_combination", "deep_review")
    graph.add_edge("deep_review", "map_literacy_demands")
    graph.add_edge("map_literacy_demands", "find_integration_points")
    graph.add_edge("find_integration_points", "select_integration_point")
    graph.add_edge("select_integration_point", "plan_revision")
    graph.add_edge("plan_revision", "draft_student_content")
    graph.add_edge("draft_student_content", "draft_teacher_content")
    graph.add_edge("draft_teacher_content", "update_connected_components")
    graph.add_edge("update_connected_components", "write_rationale")
    for qa_node in QA_NODES:
        graph.add_edge("write_rationale", qa_node)
        graph.add_edge(qa_node, "aggregate_qa")
    graph.add_edge("aggregate_qa", "review_qa_feedback")
    graph.add_edge("review_qa_feedback", "incorporate_feedback")
    graph.add_edge("incorporate_feedback", "re_review")
    graph.add_edge("re_review", "finalize")
    graph.add_edge("finalize", "produce_final_package")
    graph.add_edge("produce_final_package", END)

    return graph


_compiled = None


def get_compiled_graph():
    """Compile once per process, with a SQLite checkpointer so runs survive across requests."""
    global _compiled
    if _compiled is None:
        db_path = os.environ.get("CHECKPOINT_DB_PATH", "./data/checkpoints.db")
        os.makedirs(os.path.dirname(db_path) or ".", exist_ok=True)
        conn = sqlite3.connect(db_path, check_same_thread=False)
        checkpointer = SqliteSaver(conn)
        _compiled = build_graph().compile(checkpointer=checkpointer)
    return _compiled
