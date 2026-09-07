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

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-orange-200 bg-white/95 px-6 py-3 backdrop-blur dark:border-orange-900 dark:bg-neutral-950/95">
      <div className="mx-auto max-w-5xl">
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
    </div>
  );
}