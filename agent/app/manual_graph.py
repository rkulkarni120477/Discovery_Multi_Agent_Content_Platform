"""Independent manual Scenario 2 graph: every node requires approval before execution."""

from __future__ import annotations

from langgraph.graph import END, START, StateGraph

from app import manual_store
from app.nodes import checkpoints, phase1_gather, phase2_screen, phase3_deep_analysis, phase4_revision_planning, phase5_content_development, phase6_qa, phase7_finalization
from app.state import ScenarioState

QA_NODES = [
    ("qa_literacy_fidelity", 19, "Validate literacy fidelity", phase6_qa.qa_literacy_fidelity),
    ("qa_science_accuracy", 20, "Validate science accuracy", phase6_qa.qa_science_accuracy),
    ("qa_instructional_integrity", 21, "Validate instructional integrity", phase6_qa.qa_instructional_integrity),
    ("qa_coherence_pacing", 22, "Review coherence and pacing", phase6_qa.qa_coherence_pacing),
    ("qa_consistency", 23, "Check cross-component consistency", phase6_qa.qa_consistency),
]


def build_graph() -> StateGraph:
    graph = StateGraph(ScenarioState)

    def add(name: str, step: int, label: str, fn: object) -> None:
        graph.add_node(name, manual_store.manual_step(step, label, fn))

    add("intake", 1, "Collect and organize materials", phase1_gather.intake)
    add("catalog_metadata", 2, "Identify lesson metadata", phase1_gather.catalog_metadata)
    add("extract_strategies", 3, "Extract literacy strategies", phase1_gather.extract_strategies)
    add("summarize_lessons", 4, "Summarize candidate lessons", phase2_screen.summarize_lessons)
    add("analyze_strategies", 5, "Analyze literacy strategies", phase2_screen.analyze_strategies)
    add("screen_combinations", 6, "Screen lesson-strategy combinations", phase2_screen.screen_combinations)
    add("select_combination", 7, "Select the strongest combination", checkpoints.select_combination)
    add("deep_review", 8, "Conduct detailed lesson review", phase3_deep_analysis.deep_review)
    add("map_literacy_demands", 9, "Map literacy demands and supports", phase3_deep_analysis.map_literacy_demands)
    add("find_integration_points", 10, "Identify integration points", phase3_deep_analysis.find_integration_points)
    add("select_integration_point", 11, "Select the integration point", checkpoints.select_integration_point)
    add("plan_revision", 14, "Assess timing and plan the revision", phase4_revision_planning.plan_revision)
    add("draft_student_content", 15, "Draft student-facing content", phase5_content_development.draft_student_content)
    add("draft_teacher_content", 16, "Draft teacher guidance", phase5_content_development.draft_teacher_content)
    add("update_connected_components", 17, "Update connected components", phase5_content_development.update_connected_components)
    add("write_rationale", 18, "Write revision rationale", phase5_content_development.write_rationale)
    for name, step, label, fn in QA_NODES:
        add(name, step, label, fn)
    add("aggregate_qa", 23, "Aggregate quality assurance", phase6_qa.aggregate_qa)
    add("review_qa_feedback", 24, "Review QA feedback", checkpoints.review_qa_feedback)
    add("incorporate_feedback", 25, "Incorporate feedback", phase7_finalization.incorporate_feedback)
    add("re_review", 26, "Re-review modified content", phase7_finalization.re_review)
    add("finalize", 27, "Finalize revision package", phase7_finalization.finalize)
    add("produce_final_package", 27, "Produce final package", phase7_finalization.produce_final_package)

    edges = [
        (START, "intake"), ("intake", "catalog_metadata"), ("catalog_metadata", "extract_strategies"),
        ("extract_strategies", "summarize_lessons"), ("summarize_lessons", "analyze_strategies"),
        ("analyze_strategies", "screen_combinations"), ("screen_combinations", "select_combination"),
        ("select_combination", "deep_review"), ("deep_review", "map_literacy_demands"),
        ("map_literacy_demands", "find_integration_points"), ("find_integration_points", "select_integration_point"),
        ("select_integration_point", "plan_revision"), ("plan_revision", "draft_student_content"),
        ("draft_student_content", "draft_teacher_content"), ("draft_teacher_content", "update_connected_components"),
        ("update_connected_components", "write_rationale"),
        ("write_rationale", "qa_literacy_fidelity"), ("qa_literacy_fidelity", "qa_science_accuracy"),
        ("qa_science_accuracy", "qa_instructional_integrity"), ("qa_instructional_integrity", "qa_coherence_pacing"),
        ("qa_coherence_pacing", "qa_consistency"), ("qa_consistency", "aggregate_qa"),
        ("aggregate_qa", "review_qa_feedback"), ("review_qa_feedback", "incorporate_feedback"),
        ("incorporate_feedback", "re_review"), ("re_review", "finalize"),
        ("finalize", "produce_final_package"), ("produce_final_package", END),
    ]
    for source, target in edges:
        graph.add_edge(source, target)
    return graph


_compiled = None


def get_compiled_graph():
    global _compiled
    if _compiled is None:
        _compiled = build_graph().compile(checkpointer=manual_store.create_checkpointer("manual_checkpoints_scenario2.db"))
    return _compiled
