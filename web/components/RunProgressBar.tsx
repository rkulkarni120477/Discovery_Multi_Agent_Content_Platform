"use client";

import { useEffect, useRef, useState } from "react";
import type { RunStatus, ScenarioKey } from "@/lib/types";

const AGENT_NAMES: Record<ScenarioKey, Record<number, string>> = {
  scenario1: {
    1: "NGSS Alignment Inventory Agent",
    2: "Standards Crosswalk Agent",
    3: "Standards Delta Agent",
    4: "Performance Target Agent",
    5: "Grade-Level Depth Agent",
    6: "Evidence Criteria Agent",
    7: "Evidence Review Agent",
    8: "Alignment Classification Agent",
    9: "Gap Analysis Agent",
    10: "Remediation Agent",
    11: "QA and Finalization Agent",
  },
  scenario2: {
    1: "Intake Agent",
    2: "Lesson Metadata Agent",
    3: "Literacy Strategy Agent",
    4: "Lesson Summary Agent",
    5: "Strategy Analysis Agent",
    6: "Combination Screening Agent",
    7: "Combination Review Agent",
    8: "Deep Review Agent",
    9: "Literacy Demand Agent",
    10: "Integration Point Agent",
    11: "Integration Review Agent",
    14: "Revision Planning Agent",
    15: "Student Content Agent",
    16: "Teacher Content Agent",
    17: "Connected Components Agent",
    18: "Rationale Agent",
    23: "Quality Assurance Agent",
    24: "QA Review Agent",
    27: "Finalization Agent",
  },
  scenario3: {
    1: "Grade Identification Agent",
    2: "Standards Acquisition Agent",
    3: "C3 Alignment Agent",
    4: "Crosswalk Agent",
    5: "Crosswalk Review Agent",
    6: "Lesson Summary Agent",
    7: "Standards Mapping Agent",
    8: "Alignment Review Agent",
    9: "Gap Analysis Agent",
    10: "Surplus Content Agent",
    11: "Revision Planning Agent",
    12: "Revision Review Agent",
    13: "Content Drafting Agent",
    14: "Rationale Agent",
    15: "Scope and Sequence Agent",
    16: "Quality Assurance Agent",
  },
};

const STEP_NAMES: Record<ScenarioKey, Record<number, string>> = {
  scenario1: {
    1: "Inventory existing NGSS alignment",
    2: "Crosswalk NGSS to South Carolina standards",
    3: "Identify South Carolina standards deltas",
    4: "Map performance targets",
    5: "Validate grade-level depth",
    6: "Define alignment criteria",
    7: "Review content evidence",
    8: "Classify alignment coverage",
    9: "Identify specific gaps",
    10: "Recommend remediation",
    11: "QA and finalize",
  },
  scenario2: {
    1: "Collect and organize materials",
    2: "Identify lesson metadata",
    3: "Extract literacy strategies",
    4: "Summarize candidate lessons",
    5: "Analyze literacy strategies",
    6: "Screen lesson-strategy combinations",
    7: "Select the strongest combination",
    8: "Conduct detailed lesson review",
    9: "Map literacy demands and supports",
    10: "Identify integration points",
    11: "Select the integration point",
    12: "Define instructional purpose",
    13: "Identify affected components",
    14: "Assess timing and lesson flow",
    15: "Draft student-facing content",
    16: "Draft teacher guidance",
    17: "Update connected components",
    18: "Write revision rationale",
    19: "Validate literacy fidelity",
    20: "Validate science accuracy",
    21: "Validate instructional integrity",
    22: "Review coherence and pacing",
    23: "Check cross-component consistency",
    24: "Review QA feedback",
    25: "Incorporate feedback",
    26: "Re-review modified content",
    27: "Finalize revision package",
  },
  scenario3: {
    1: "Identify grade level",
    2: "Acquire state standards",
    3: "Extract C3 alignment",
    4: "Build standards crosswalk",
    5: "Review crosswalk",
    6: "Summarize lesson content",
    7: "Map lessons to state standards",
    8: "Review alignment map",
    9: "Compile gap list",
    10: "Identify surplus content",
    11: "Plan and place revisions",
    12: "Review revision plan",
    13: "Draft revised content",
    14: "Write revision rationale",
    15: "Update scope and sequence",
    16: "Complete quality assurance",
  },
};

const STEP_DESCRIPTIONS: Record<ScenarioKey, Record<number, string>> = {
  scenario1: {
    1: "Parse the existing product content and identify which NGSS standards and practices are already aligned.",
    2: "Create a detailed mapping between the NGSS-aligned content and the target state standards.",
    3: "Identify which South Carolina standards are not yet covered by the NGSS content.",
    4: "Map the identified state performance targets to lessons and specific content locations.",
    5: "Review and validate that content addresses standards at the appropriate grade level depth.",
    6: "Establish criteria for what counts as strong, partial, or no alignment.",
    7: "Review the actual lesson content to find evidence supporting or refuting alignment claims.",
    8: "Classify each standard as Strong Alignment, Partial Alignment, or Gap.",
    9: "Compile all gaps into a structured analysis showing what's missing.",
    10: "Generate specific, actionable recommendations for remediating identified gaps.",
    11: "Run quality checks on the full analysis and prepare final deliverables.",
  },
  scenario2: {
    1: "Organize and prepare the lesson and literacy strategy resource for analysis.",
    2: "Extract key metadata from each lesson (objectives, duration, grade level, topic).",
    3: "Parse the literacy strategy resource to identify strategies and their characteristics.",
    4: "Create concise summaries of each candidate lesson's content and learning objectives.",
    5: "Analyze the literacy strategy to understand its demands and pedagogical value.",
    6: "Evaluate all combinations of lessons with the literacy strategy for fit and impact.",
    7: "Review the top combination and select the strongest match based on analysis.",
    8: "Conduct a comprehensive review of the selected lesson to understand its full structure.",
    9: "Map where literacy demands exist in the lesson and where the strategy can add support.",
    10: "Identify specific moments in the lesson where the strategy could be meaningfully integrated.",
    11: "Review candidates and select the integration point that best enhances learning.",
    12: "Define the specific instructional purpose for integrating the strategy at this point.",
    13: "Identify all lesson components (student activities, assessments, teacher guides) that need updates.",
    14: "Assess how the integration affects timing and verify lesson flow remains coherent.",
    15: "Write or revise student-facing content to reflect the literacy strategy integration.",
    16: "Write or revise teacher guidance to support implementation of the strategy.",
    17: "Update all other lesson components for consistency with the integrated strategy.",
    18: "Document the rationale and evidence supporting the revision choices made.",
    19: "Verify that the literacy strategy is implemented with full fidelity in the revised lesson.",
    20: "Check that science learning objectives and content remain accurate and rigorous.",
    21: "Ensure instructional design principles are maintained and learning outcomes are preserved.",
    22: "Review the overall coherence of the revised lesson and verify pacing is appropriate.",
    23: "Check for consistency across all lesson components and eliminated contradictions.",
    24: "Review feedback from five independent QA passes covering different quality dimensions.",
    25: "Incorporate feedback and make necessary adjustments to the revised content.",
    26: "Re-review modified content against QA criteria to ensure all issues are resolved.",
    27: "Compile the final revision package with all content, rationale, and documentation.",
  },
  scenario3: {
    1: "Extract the grade level from the unit's scope-and-sequence documentation.",
    2: "Acquire and parse the state standards reference for the identified grade level.",
    3: "Extract C3 Framework alignment information from the scope-and-sequence.",
    4: "Build a detailed crosswalk between the unit's existing standards and state standards.",
    5: "Review and validate the crosswalk for accuracy and completeness.",
    6: "Create summaries of lesson content and connection to standards.",
    7: "Map each lesson's content against the state standards to identify coverage.",
    8: "Review the alignment map and validate standards coverage is accurate.",
    9: "Identify state standards that are not covered by unit lessons.",
    10: "Identify content in lessons that exceeds state standards requirements.",
    11: "Create a plan for revising lessons to address gaps and/or reallocate surplus content.",
    12: "Review the revision plan and validate that it will address identified issues.",
    13: "Draft revised content based on the revision plan.",
    14: "Write rationale documenting why revisions were made and how they improve alignment.",
    15: "Update the scope-and-sequence document to reflect revised content and standards mapping.",
    16: "Run comprehensive quality checks on the alignment package and finalize deliverables.",
  },
};

function agentName(scenario: ScenarioKey, step: number | null, status: RunStatus): string {
  if (status === "complete") return "Finalization Agent";
  if (status === "error") return "Run stopped";
  const agents = AGENT_NAMES[scenario];
  if (step && agents?.[step]) return agents[step];
  return "Preparing workflow";
}

function stepName(scenario: ScenarioKey, step: number | null, status: RunStatus): string {
  if (status === "complete") return "Final package complete";
  if (status === "error") return "Run stopped";
  const name = step ? STEP_NAMES[scenario]?.[step] : undefined;
  return name ? `Step ${step}: ${name}` : "Preparing workflow";
}

function stepDescription(scenario: ScenarioKey, step: number | null, status: RunStatus): string {
  if (status === "complete") return "All steps completed successfully. The final package is ready for review.";
  if (status === "error") return "The workflow encountered an error and stopped.";
  const description = step ? STEP_DESCRIPTIONS[scenario]?.[step] : undefined;
  return description || "Preparing the workflow for execution.";
}

function stepDetailsTitle(
  scenario: ScenarioKey,
  step: number | null,
  status: RunStatus,
  totalSteps: number
): string {
  const displayedStep = step ?? (status === "complete" ? totalSteps : 1);
  const name = STEP_NAMES[scenario]?.[displayedStep];
  return name ? `Step ${displayedStep}: ${name}` : `Step ${displayedStep}`;
}

export function RunProgressBar({
  scenario,
  status,
  step,
  totalSteps,
}: {
  scenario: ScenarioKey;
  status: RunStatus;
  step: number | null;
  totalSteps: number;
}) {
  const percentage = status === "complete" ? 100 : Math.round(((step ?? 0) / totalSteps) * 100);
  const [height, setHeight] = useState(120);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const minHeight = 80;
      const maxHeight = 400;

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const newHeight = window.innerHeight - e.clientY;
        const constrainedHeight = Math.min(Math.max(newHeight, minHeight), maxHeight);
        setHeight(constrainedHeight);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-x-0 bottom-0 z-20 border-t border-orange-200 bg-white/95 px-6 backdrop-blur dark:border-orange-900 dark:bg-neutral-950/95 transition-all ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      style={{ height: `${height}px` }}
    >
      <div
        onMouseDown={handleMouseDown}
        className="mx-auto max-w-5xl h-1 cursor-grab hover:bg-orange-300 bg-orange-200 dark:bg-orange-800 dark:hover:bg-orange-700 rounded-full -mx-6 mb-3 transition-colors active:cursor-grabbing"
        title="Drag to resize"
      />
      <div className="mx-auto max-w-5xl overflow-y-auto" style={{ maxHeight: `${height - 20}px` }}>
        <div className="flex gap-4 pb-3">
          <div className="flex-1">
            <p className="mb-2 text-xs font-medium text-neutral-800 dark:text-neutral-100">
              {stepName(scenario, step, status)}
            </p>
            <div
              className="h-2 overflow-hidden rounded-full bg-orange-100 dark:bg-orange-950"
              aria-label={`Run progress: ${percentage}%`}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percentage}
            >
              <div className="h-full bg-orange-500 transition-[width] duration-500" style={{ width: `${percentage}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-300">
              <span>{agentName(scenario, step, status)}</span>
              <span>{percentage}%</span>
            </div>
          </div>
          <div className="w-64 flex-shrink-0">
            <div className="rounded-lg bg-green-50 p-3 dark:bg-green-950">
              <p className="text-xs font-semibold text-green-900 dark:text-green-100">
                {stepDetailsTitle(scenario, step, status, totalSteps)}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-green-800 dark:text-green-200">
                {stepDescription(scenario, step, status)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}