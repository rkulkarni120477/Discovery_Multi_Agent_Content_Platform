"""Independent manual Scenario 3 graph: every node requires approval before execution."""

from __future__ import annotations

from langgraph.graph import END, START, StateGraph

from app import manual_store
from app.nodes.scenario3 import checkpoints, phase1_gather, phase2_map, phase3_gap, phase4_revision, phase5_content, phase6_qa
from app.state_scenario3 import ScenarioState3


def build_graph() -> StateGraph:
    graph = StateGraph(ScenarioState3)

    def add(name: str, step: int, label: str, fn: object) -> None:
        graph.add_node(name, manual_store.manual_step(step, label, fn))

    add("identify_grade_level", 1, "Identify grade level", phase1_gather.identify_grade_level)
    add("acquire_standards", 2, "Acquire state standards", phase1_gather.acquire_standards)
    add("extract_c3_alignment", 3, "Extract C3 alignment", phase1_gather.extract_c3_alignment)
    add("build_crosswalk", 4, "Build standards crosswalk", phase1_gather.build_crosswalk)
    add("review_crosswalk", 4, "Review crosswalk", checkpoints.review_crosswalk)
    add("summarize_lessons", 6, "Summarize lesson content", phase2_map.summarize_lessons)
    add("map_to_standards", 7, "Map lessons to state standards", phase2_map.map_to_standards)
    add("review_alignment_map", 7, "Review alignment map", checkpoints.review_alignment_map)
    add("compile_gap_list", 9, "Compile gap list", phase3_gap.compile_gap_list)
    add("identify_surplus", 10, "Identify surplus content", phase3_gap.identify_surplus)
    add("plan_and_place_revisions", 11, "Plan and place revisions", phase4_revision.plan_and_place_revisions)
    add("review_revision_plan", 11, "Review revision plan", checkpoints.review_revision_plan)
    add("draft_content", 13, "Draft revised content", phase5_content.draft_content)
    add("write_rationale", 14, "Write revision rationale", phase5_content.write_rationale)
    add("update_scope_sequence", 15, "Update scope and sequence", phase5_content.update_scope_sequence)
    add("coherence_review", 16, "Complete quality assurance", phase6_qa.coherence_review)
    add("final_coverage_verification", 16, "Verify final coverage", phase6_qa.final_coverage_verification)
    add("editorial_review", 16, "Complete editorial review", phase6_qa.editorial_review)
    add("produce_final_package", 16, "Produce final package", phase6_qa.produce_final_package)

    edges = [
        (START, "identify_grade_level"), ("identify_grade_level", "acquire_standards"),
        ("acquire_standards", "extract_c3_alignment"), ("extract_c3_alignment", "build_crosswalk"),
        ("build_crosswalk", "review_crosswalk"), ("review_crosswalk", "summarize_lessons"),
        ("summarize_lessons", "map_to_standards"), ("map_to_standards", "review_alignment_map"),
        ("review_alignment_map", "compile_gap_list"), ("compile_gap_list", "identify_surplus"),
        ("identify_surplus", "plan_and_place_revisions"), ("plan_and_place_revisions", "review_revision_plan"),
        ("review_revision_plan", "draft_content"), ("draft_content", "write_rationale"),
        ("write_rationale", "update_scope_sequence"), ("update_scope_sequence", "coherence_review"),
        ("coherence_review", "final_coverage_verification"), ("final_coverage_verification", "editorial_review"),
        ("editorial_review", "produce_final_package"), ("produce_final_package", END),
    ]
    for source, target in edges:
        graph.add_edge(source, target)
    return graph


_compiled = None


def get_compiled_graph():
    global _compiled
    if _compiled is None:
        _compiled = build_graph().compile(checkpointer=manual_store.create_checkpointer("manual_checkpoints_scenario3.db"))
    return _compiled
