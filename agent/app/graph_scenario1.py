"""Builds the Scenario 1 LangGraph StateGraph: 5 phases, 11 steps, 2 human checkpoints.

Kept as a fully separate compiled graph (own nodes, own checkpointer file) from Scenario 2's and
Scenario 3's graphs -- the three workflows share no state and there is no benefit to coupling them,
only risk.
"""

from __future__ import annotations

import os
import sqlite3

from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.graph import END, START, StateGraph

from app.nodes.scenario1 import (
    checkpoints,
    phase1_crosswalk,
    phase2_targets,
    phase3_evidence,
    phase4_gap,
    phase5_qa_finalize,
)
from app.state_scenario1 import ScenarioState1


def build_graph() -> StateGraph:
    graph = StateGraph(ScenarioState1)

    # Phase 1 -- Standards Crosswalk
    graph.add_node("inventory_ngss_alignment", phase1_crosswalk.inventory_ngss_alignment)
    graph.add_node("crosswalk_ngss_to_sc", phase1_crosswalk.crosswalk_ngss_to_sc)
    graph.add_node("identify_sc_deltas", phase1_crosswalk.identify_sc_deltas)

    # Phase 2 -- Performance Target Mapping & Validation
    graph.add_node("map_performance_targets", phase2_targets.map_performance_targets)
    graph.add_node("validate_grade_level_depth", phase2_targets.validate_grade_level_depth)
    graph.add_node("review_grade_level_depth", checkpoints.review_grade_level_depth)

    # Phase 3 -- Content Alignment Review
    graph.add_node("define_alignment_criteria", phase3_evidence.define_alignment_criteria)
    graph.add_node("review_discovery_evidence", phase3_evidence.review_discovery_evidence)
    graph.add_node("classify_strong_partial_gap", phase3_evidence.classify_strong_partial_gap)

    # Phase 4 -- Gap Analysis & Remediation
    graph.add_node("identify_specific_gaps", phase4_gap.identify_specific_gaps)
    graph.add_node("recommend_remediation", phase4_gap.recommend_remediation)
    graph.add_node("review_gap_analysis", checkpoints.review_gap_analysis)

    # Phase 5 -- QA & Finalization
    graph.add_node("qa_and_finalize", phase5_qa_finalize.qa_and_finalize)
    graph.add_node("produce_final_package", phase5_qa_finalize.produce_final_package)

    # Wiring
    graph.add_edge(START, "inventory_ngss_alignment")
    graph.add_edge("inventory_ngss_alignment", "crosswalk_ngss_to_sc")
    graph.add_edge("crosswalk_ngss_to_sc", "identify_sc_deltas")
    graph.add_edge("identify_sc_deltas", "map_performance_targets")
    graph.add_edge("map_performance_targets", "validate_grade_level_depth")
    graph.add_edge("validate_grade_level_depth", "review_grade_level_depth")
    graph.add_edge("review_grade_level_depth", "define_alignment_criteria")
    graph.add_edge("define_alignment_criteria", "review_discovery_evidence")
    graph.add_edge("review_discovery_evidence", "classify_strong_partial_gap")
    graph.add_edge("classify_strong_partial_gap", "identify_specific_gaps")
    graph.add_edge("identify_specific_gaps", "recommend_remediation")
    graph.add_edge("recommend_remediation", "review_gap_analysis")
    graph.add_edge("review_gap_analysis", "qa_and_finalize")
    graph.add_edge("qa_and_finalize", "produce_final_package")
    graph.add_edge("produce_final_package", END)

    return graph


_compiled = None


def get_compiled_graph():
    """Compile once per process, with its own SQLite checkpointer file (kept separate from
    Scenario 2's and Scenario 3's) so runs survive across requests."""
    global _compiled
    if _compiled is None:
        db_path = os.environ.get("CHECKPOINT_DB_PATH_SCENARIO1", "./data/checkpoints_scenario1.db")
        os.makedirs(os.path.dirname(db_path) or ".", exist_ok=True)
        conn = sqlite3.connect(db_path, check_same_thread=False)
        checkpointer = SqliteSaver(conn)
        _compiled = build_graph().compile(checkpointer=checkpointer)
    return _compiled
