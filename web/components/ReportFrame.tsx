import type { ReactNode } from "react";

type Metric = {
  label: string;
  value: string | number;
  tone?: "orange" | "teal" | "red";
};

export function ReportFrame({
  scenario,
  title,
  summary,
  metrics,
  children,
}: {
  scenario: string;
  title: string;
  summary: string;
  metrics: Metric[];
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
      <header className="border-b border-neutral-200 bg-neutral-50 px-5 py-6 dark:border-neutral-800 dark:bg-neutral-900 sm:px-7">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-orange-700 dark:text-orange-400">
          {scenario}
        </p>
        <h2 className="mt-2 text-xl font-semibold text-neutral-950 dark:text-white">{title}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-600 dark:text-neutral-300">{summary}</p>
      </header>
      <div className="grid grid-cols-2 divide-x divide-y divide-neutral-200 border-b border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800 sm:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="min-w-0 px-4 py-4 sm:px-5">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{metric.label}</p>
            <p
              className={`mt-1 truncate text-lg font-semibold ${
                metric.tone === "orange"
                  ? "text-orange-700 dark:text-orange-400"
                  : metric.tone === "teal"
                    ? "text-teal-700 dark:text-teal-400"
                    : metric.tone === "red"
                      ? "text-red-700 dark:text-red-400"
                      : "text-neutral-950 dark:text-white"
              }`}
            >
              {metric.value}
            </p>
          </div>
        ))}
      </div>
      <div className="p-5 sm:p-7">{children}</div>
    </section>
  );
}