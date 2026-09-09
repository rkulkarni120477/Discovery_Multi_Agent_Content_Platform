"""Dynamic manual graphs composed from the existing scenario node functions."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any, TypedDict

from langgraph.graph import END, START, StateGraph

from app import manual_store
from app.nodes import checkpoints as scenario2_checkpoints
from app.nodes import phase1_gather as scenario2_phase1
from app.nodes import phase2_screen as scenario2_phase2
from app.nodes import phase3_deep_analysis as scenario2_phase3
from app.nodes import phase4_revision_planning as scenario2_phase4
from app.nodes import phase5_content_development as scenario2_phase5
from app.nodes import phase6_qa as scenario2_phase6
from app.nodes import phase7_finalization as scenario2_phase7
from app.nodes.scenario1 import checkpoints as scenario1_checkpoints
from app.nodes.scenario1 import phase1_crosswalk as scenario1_phase1
from app.nodes.scenario1 import phase2_targets as scenario1_phase2
from app.nodes.scenario1 import phase3_evidence as scenario1_phase3
from app.nodes.scenario1 import phase4_gap as scenario1_phase4
from app.nodes.scenario1 import phase5_qa_finalize as scenario1_phase5
from app.nodes.scenario3 import checkpoints as scenario3_checkpoints
from app.nodes.scenario3 import phase1_gather as scenario3_phase1
from app.nodes.scenario3 import phase2_map as scenario3_phase2
from app.nodes.scenario3 import phase3_gap as scenario3_phase3
from app.nodes.scenario3 import phase4_revision as scenario3_phase4
from app.nodes.scenario3 import phase5_content as scenario3_phase5
from app.nodes.scenario3 import phase6_qa as scenario3_phase6

NodeFunction = Callable[[dict[str, Any]], dict[str, Any]]


class CustomScenarioState(TypedDict, total=False):
    job_id: str
    status: str
    phase: str
    step: int
    selected_steps: list[dict[str, str]]
    scenario1: dict[str, Any]
    scenario2: dict[str, Any]
    scenario3: dict[str, Any]
    final_package: dict[str, Any]


class SourceNode(TypedDict):
    label: str
    function: NodeFunction
    checkpoint: bool


def _node(label: str, function: NodeFunction, checkpoint: bool = False) -> SourceNode:
    return {"label": label, "function": function, "checkpoint": checkpoint}


# These mappings mirror the source manual graphs. Keep the functions themselves untouched so a
# custom run executes the same automated agent implementation as its source scenario.
SOURCE_NODES: dict[str, dict[str, SourceNode]] = {
    "scenario1": {
        "inventory_ngss_alignment": _node("Inventory existing NGSS alignment", scenario1_phase1.inventory_ngss_alignment),
        "crosswalk_ngss_to_sc": _node("Crosswalk NGSS to South Carolina standards", scenario1_phase1.crosswalk_ngss_to_sc),
        "identify_sc_deltas": _node("Identify South Carolina standards deltas", scenario1_phase1.identify_sc_deltas),
        "map_performance_targets": _node("Map performance targets", scenario1_phase2.map_performance_targets),
        "validate_grade_level_depth": _node("Validate grade-level depth", scenario1_phase2.validate_grade_level_depth),
        "review_grade_level_depth": _node("Review grade-level depth", scenario1_checkpoints.review_grade_level_depth, True),
        "define_alignment_criteria": _node("Define alignment criteria", scenario1_phase3.define_alignment_criteria),
        "review_discovery_evidence": _node("Review content evidence", scenario1_phase3.review_discovery_evidence),
        "classify_strong_partial_gap": _node("Classify alignment coverage", scenario1_phase3.classify_strong_partial_gap),
        "identify_specific_gaps": _node("Identify specific gaps", scenario1_phase4.identify_specific_gaps),
        "recommend_remediation": _node("Recommend remediation", scenario1_phase4.recommend_remediation),
        "review_gap_analysis": _node("Review gap analysis", scenario1_checkpoints.review_gap_analysis, True),
        "qa_and_finalize": _node("QA and finalize", scenario1_phase5.qa_and_finalize),
        "produce_final_package": _node("Produce final package", scenario1_phase5.produce_final_package),
    },
    "scenario2": {
        "intake": _node("Collect and organize materials", scenario2_phase1.intake), "catalog_metadata": _node("Identify lesson metadata", scenario2_phase1.catalog_metadata),
        "extract_strategies": _node("Extract literacy strategies", scenario2_phase1.extract_strategies), "summarize_lessons": _node("Summarize candidate lessons", scenario2_phase2.summarize_lessons),
        "analyze_strategies": _node("Analyze literacy strategies", scenario2_phase2.analyze_strategies), "screen_combinations": _node("Screen lesson-strategy combinations", scenario2_phase2.screen_combinations),
        "select_combination": _node("Select the strongest combination", scenario2_checkpoints.select_combination, True), "deep_review": _node("Conduct detailed lesson review", scenario2_phase3.deep_review),
        "map_literacy_demands": _node("Map literacy demands and supports", scenario2_phase3.map_literacy_demands), "find_integration_points": _node("Identify integration points", scenario2_phase3.find_integration_points),
        "select_integration_point": _node("Select the integration point", scenario2_checkpoints.select_integration_point, True), "plan_revision": _node("Assess timing and plan the revision", scenario2_phase4.plan_revision),
        "draft_student_content": _node("Draft student-facing content", scenario2_phase5.draft_student_content), "draft_teacher_content": _node("Draft teacher guidance", scenario2_phase5.draft_teacher_content),
        "update_connected_components": _node("Update connected components", scenario2_phase5.update_connected_components), "write_rationale": _node("Write revision rationale", scenario2_phase5.write_rationale),
        "qa_literacy_fidelity": _node("Validate literacy fidelity", scenario2_phase6.qa_literacy_fidelity), "qa_science_accuracy": _node("Validate science accuracy", scenario2_phase6.qa_science_accuracy),
        "qa_instructional_integrity": _node("Validate instructional integrity", scenario2_phase6.qa_instructional_integrity), "qa_coherence_pacing": _node("Review coherence and pacing", scenario2_phase6.qa_coherence_pacing),
        "qa_consistency": _node("Check cross-component consistency", scenario2_phase6.qa_consistency), "aggregate_qa": _node("Aggregate quality assurance", scenario2_phase6.aggregate_qa),
        "review_qa_feedback": _node("Review QA feedback", scenario2_checkpoints.review_qa_feedback, True), "incorporate_feedback": _node("Incorporate feedback", scenario2_phase7.incorporate_feedback),
        "re_review": _node("Re-review modified content", scenario2_phase7.re_review), "finalize": _node("Finalize revision package", scenario2_phase7.finalize),
        "produce_final_package": _node("Produce final package", scenario2_phase7.produce_final_package),
    },
    "scenario3": {
        "identify_grade_level": _node("Identify grade level", scenario3_phase1.identify_grade_level), "acquire_standards": _node("Acquire state standards", scenario3_phase1.acquire_standards),
        "extract_c3_alignment": _node("Extract C3 alignment", scenario3_phase1.extract_c3_alignment), "build_crosswalk": _node("Build standards crosswalk", scenario3_phase1.build_crosswalk),
        "review_crosswalk": _node("Review crosswalk", scenario3_checkpoints.review_crosswalk, True), "summarize_lessons": _node("Summarize lesson content", scenario3_phase2.summarize_lessons),
        "map_to_standards": _node("Map lessons to state standards", scenario3_phase2.map_to_standards), "review_alignment_map": _node("Review alignment map", scenario3_checkpoints.review_alignment_map, True),
        "compile_gap_list": _node("Compile gap list", scenario3_phase3.compile_gap_list), "identify_surplus": _node("Identify surplus content", scenario3_phase3.identify_surplus),
        "plan_and_place_revisions": _node("Plan and place revisions", scenario3_phase4.plan_and_place_revisions), "review_revision_plan": _node("Review revision plan", scenario3_checkpoints.review_revision_plan, True),
        "draft_content": _node("Draft revised content", scenario3_phase5.draft_content), "write_rationale": _node("Write revision rationale", scenario3_phase5.write_rationale),
        "update_scope_sequence": _node("Update scope and sequence", scenario3_phase5.update_scope_sequence), "coherence_review": _node("Complete quality assurance", scenario3_phase6.coherence_review),
        "final_coverage_verification": _node("Verify final coverage", scenario3_phase6.final_coverage_verification), "editorial_review": _node("Complete editorial review", scenario3_phase6.editorial_review),
        "produce_final_package": _node("Produce final package", scenario3_phase6.produce_final_package),
    },
}


def resolve_step(scenario: str, node: str) -> SourceNode:
    try:
        return SOURCE_NODES[scenario][node]
    except KeyError as error:
        raise ValueError(f"Unknown custom source step: {scenario}.{node}") from error


def _adapt(scenario: str, position: int, function: NodeFunction) -> Callable[[CustomScenarioState], dict[str, Any]]:
    def adapted(state: CustomScenarioState) -> dict[str, Any]:
        source_state = state.get(scenario, {})
        update = function(source_state)
        return {scenario: {**source_state, **update}, "phase": "Custom scenario", "step": position}

    return adapted


def build_graph(selected_steps: list[dict[str, str]]) -> StateGraph:
    graph = StateGraph(CustomScenarioState)
    previous = START

    for position, selection in enumerate(selected_steps, start=1):
        source = resolve_step(selection["scenario"], selection["node"])
        node_id = f"step_{position}_{selection['scenario']}_{selection['node']}"
        adapted = _adapt(selection["scenario"], position, source["function"])
        graph.add_node(node_id, adapted)
        graph.add_edge(previous, node_id)
        previous = node_id

    def complete(state: CustomScenarioState) -> dict[str, Any]:
        packages = {
            name: source_state.get("final_package")
            for name in ("scenario1", "scenario2", "scenario3")
            if (source_state := state.get(name, {})).get("final_package")
        }
        return {"status": "complete", "phase": "Complete", "step": len(selected_steps), "final_package": packages}

    graph.add_node("complete", complete)
    graph.add_edge(previous, "complete")
    graph.add_edge("complete", END)
    return graph


def compile_graph(selected_steps: list[dict[str, str]]):
    return build_graph(selected_steps).compile(checkpointer=manual_store.create_checkpointer("manual_checkpoints_custom.db"))