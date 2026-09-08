"""Builds the Scenario 3 LangGraph StateGraph: 6 phases, 16 steps, 3 human checkpoints.

Kept as a fully separate compiled graph (own nodes, own checkpointer file) from Scenario 2's graph
in graph.py -- the two workflows share no state and there is no benefit to coupling them, only risk.
"""

from __future__ import annotations

import os
import sqlite3

from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.graph import END, START, StateGraph

from app import store
from app.nodes.scenario3 import (
    checkpoints,
    phase1_gather,
    phase2_map,
    phase3_gap,
    phase4_revision,
    phase5_content,
    phase6_qa,
)
from app.state_scenario3 import ScenarioState3


def build_graph() -> StateGraph:
    graph = StateGraph(ScenarioState3)

    def add_node(name: str, fn: object) -> None:
        graph.add_node(name, store.workflow_step(fn))

    # Phase 1 -- Gather & Organize
    add_node("identify_grade_level", phase1_gather.identify_grade_level)
    add_node("acquire_standards", phase1_gather.acquire_standards)
    add_node("extract_c3_alignment", phase1_gather.extract_c3_alignment)
    add_node("build_crosswalk", phase1_gather.build_crosswalk)
    add_node("review_crosswalk", checkpoints.review_crosswalk)

    # Phase 2 -- Read & Map
    add_node("summarize_lessons", phase2_map.summarize_lessons)
    add_node("map_to_standards", phase2_map.map_to_standards)
    add_node("review_alignment_map", checkpoints.review_alignment_map)

    # Phase 3 -- Gap Analysis
    add_node("compile_gap_list", phase3_gap.compile_gap_list)
    add_node("identify_surplus", phase3_gap.identify_surplus)

    # Phase 4 -- Revision Planning
    add_node("plan_and_place_revisions", phase4_revision.plan_and_place_revisions)
    add_node("review_revision_plan", checkpoints.review_revision_plan)

    # Phase 5 -- Content Drafting
    add_node("draft_content", phase5_content.draft_content)
    add_node("write_rationale", phase5_content.write_rationale)
    add_node("update_scope_sequence", phase5_content.update_scope_sequence)

    # Phase 6 -- Quality Assurance
    add_node("coherence_review", phase6_qa.coherence_review)
    add_node("final_coverage_verification", phase6_qa.final_coverage_verification)
    add_node("editorial_review", phase6_qa.editorial_review)
    add_node("produce_final_package", phase6_qa.produce_final_package)

    # Wiring
    graph.add_edge(START, "identify_grade_level")
    graph.add_edge("identify_grade_level", "acquire_standards")
    graph.add_edge("acquire_standards", "extract_c3_alignment")
    graph.add_edge("extract_c3_alignment", "build_crosswalk")
    graph.add_edge("build_crosswalk", "review_crosswalk")
    graph.add_edge("review_crosswalk", "summarize_lessons")
    graph.add_edge("summarize_lessons", "map_to_standards")
    graph.add_edge("map_to_standards", "review_alignment_map")
    graph.add_edge("review_alignment_map", "compile_gap_list")
    graph.add_edge("compile_gap_list", "identify_surplus")
    graph.add_edge("identify_surplus", "plan_and_place_revisions")
    graph.add_edge("plan_and_place_revisions", "review_revision_plan")
    graph.add_edge("review_revision_plan", "draft_content")
    graph.add_edge("draft_content", "write_rationale")
    graph.add_edge("write_rationale", "update_scope_sequence")
    graph.add_edge("update_scope_sequence", "coherence_review")
    graph.add_edge("coherence_review", "final_coverage_verification")
    graph.add_edge("final_coverage_verification", "editorial_review")
    graph.add_edge("editorial_review", "produce_final_package")
    graph.add_edge("produce_final_package", END)

    return graph


_compiled = None


def get_compiled_graph():
    """Compile once per process, with its own SQLite checkpointer file (kept separate from
    Scenario 2's) so runs survive across requests."""
    global _compiled
    if _compiled is None:
        db_path = os.environ.get("CHECKPOINT_DB_PATH_SCENARIO3", "./data/checkpoints_scenario3.db")
        os.makedirs(os.path.dirname(db_path) or ".", exist_ok=True)
        conn = sqlite3.connect(db_path, check_same_thread=False)
        checkpointer = SqliteSaver(conn)
        _compiled = build_graph().compile(checkpointer=checkpointer)
    return _compiled
