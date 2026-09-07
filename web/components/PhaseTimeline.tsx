import type { RunStatus } from "@/lib/types";

function phaseState(
  phase: string,
  currentPhaseIndex: number,
  phaseIndex: number
): "done" | "current" | "pending" {
  if (phaseIndex < currentPhaseIndex) return "done";
  if (phaseIndex === currentPhaseIndex) return "current";
  return "pending";
}

const DOT_STYLES: Record<string, string> = {
  done: "bg-green-500",
  current: "bg-blue-500 animate-pulse",
  pending: "bg-neutral-300 dark:bg-neutral-700",
};

export function PhaseTimeline({
  phases,
  phaseStepRanges,
  currentPhase,
  currentStep,
  status,
}: {
  phases: string[];
  phaseStepRanges: Record<string, [number, number]>;
  currentPhase: string | null;
  currentStep: number | null;
  status: RunStatus;
}) {
  const currentPhaseIndex = currentPhase ? phases.indexOf(currentPhase) : -1;

  return (
    <ol className="flex flex-col gap-0">
      {phases.map((phase, index) => {
        const [start, end] = phaseStepRanges[phase] ?? [0, 0];
        const state =
          status === "complete"
            ? "done"
            : phaseState(phase, currentPhaseIndex, index);
        const stepLabel =
          state === "current" && currentStep
            ? `step ${currentStep} of ${end} (phase steps ${start}–${end})`
            : `steps ${start}–${end}`;

        return (
          <li key={phase} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className={`w-3 h-3 rounded-full mt-1.5 ${DOT_STYLES[state]}`} />
              {index < phases.length - 1 && (
                <span className="w-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
              )}
            </div>
            <div className="pb-6">
              <p
                className={`text-sm font-medium ${
                  state === "pending" ? "text-neutral-400 dark:text-neutral-600" : ""
                }`}
              >
                {phase}
              </p>
              <p className="text-xs text-neutral-500">{stepLabel}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
