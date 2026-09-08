"""Independent manual Scenario 1 graph: every node requires approval before execution."""

from __future__ import annotations

from langgraph.graph import END, START, StateGraph

from app import manual_store
from app.nodes.scenario1 import checkpoints, phase1_crosswalk, phase2_targets, phase3_evidence, phase4_gap, phase5_qa_finalize
from app.state_scenario1 import ScenarioState1


def build_graph() -> StateGraph:
    graph = StateGraph(ScenarioState1)

    def add(name: str, step: int, label: str, fn: object) -> None:
        graph.add_node(name, manual_store.manual_step(step, label, fn))

    add("inventory_ngss_alignment", 1, "Inventory existing NGSS alignment", phase1_crosswalk.inventory_ngss_alignment)
    add("crosswalk_ngss_to_sc", 2, "Crosswalk NGSS to South Carolina standards", phase1_crosswalk.crosswalk_ngss_to_sc)
    add("identify_sc_deltas", 3, "Identify South Carolina standards deltas", phase1_crosswalk.identify_sc_deltas)
    add("map_performance_targets", 4, "Map performance targets", phase2_targets.map_performance_targets)
    add("validate_grade_level_depth", 5, "Validate grade-level depth", phase2_targets.validate_grade_level_depth)
    add("review_grade_level_depth", 5, "Review grade-level depth", checkpoints.review_grade_level_depth)
    add("define_alignment_criteria", 6, "Define alignment criteria", phase3_evidence.define_alignment_criteria)
    add("review_discovery_evidence", 7, "Review content evidence", phase3_evidence.review_discovery_evidence)
    add("classify_strong_partial_gap", 8, "Classify alignment coverage", phase3_evidence.classify_strong_partial_gap)
    add("identify_specific_gaps", 9, "Identify specific gaps", phase4_gap.identify_specific_gaps)
    add("recommend_remediation", 10, "Recommend remediation", phase4_gap.recommend_remediation)
    add("review_gap_analysis", 10, "Review gap analysis", checkpoints.review_gap_analysis)
    add("qa_and_finalize", 11, "QA and finalize", phase5_qa_finalize.qa_and_finalize)
    add("produce_final_package", 11, "Produce final package", phase5_qa_finalize.produce_final_package)

    edges = [
        (START, "inventory_ngss_alignment"),
        ("inventory_ngss_alignment", "crosswalk_ngss_to_sc"),
        ("crosswalk_ngss_to_sc", "identify_sc_deltas"),
        ("identify_sc_deltas", "map_performance_targets"),
        ("map_performance_targets", "validate_grade_level_depth"),
        ("validate_grade_level_depth", "review_grade_level_depth"),
        ("review_grade_level_depth", "define_alignment_criteria"),
        ("define_alignment_criteria", "review_discovery_evidence"),
        ("review_discovery_evidence", "classify_strong_partial_gap"),
        ("classify_strong_partial_gap", "identify_specific_gaps"),
        ("identify_specific_gaps", "recommend_remediation"),
        ("recommend_remediation", "review_gap_analysis"),
        ("review_gap_analysis", "qa_and_finalize"),
        ("qa_and_finalize", "produce_final_package"),
        ("produce_final_package", END),
    ]
    for source, target in edges:
        graph.add_edge(source, target)
    return graph


_compiled = None


def get_compiled_graph():
    global _compiled
    if _compiled is None:
        _compiled = build_graph().compile(checkpointer=manual_store.create_checkpointer("manual_checkpoints_scenario1.db"))
    return _compiled
