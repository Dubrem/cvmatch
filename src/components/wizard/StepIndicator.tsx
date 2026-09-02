import { Check } from "lucide-react";
import clsx from "clsx";

const STEPS = ["Tu perfil", "Vacante objetivo", "Resultados"];

export default function StepIndicator({ current }: { current: number }) {
  return (
    <div className="mx-auto flex max-w-xl items-center justify-center gap-2 py-8">
      {STEPS.map((label, i) => {
        const stepNumber = i + 1;
        const isDone = stepNumber < current;
        const isActive = stepNumber === current;
        return (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div className="flex flex-col items-center gap-2">
              <span
                className={clsx(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition",
                  isDone && "bg-mint text-white",
                  isActive && "bg-navy text-white",
                  !isDone && !isActive && "bg-slate-200 text-muted"
                )}
              >
                {isDone ? <Check size={16} /> : stepNumber}
              </span>
              <span
                className={clsx(
                  "hidden text-xs font-medium sm:block",
                  isActive ? "text-navy" : "text-muted"
                )}
              >
                {label}
              </span>
            </div>
            {stepNumber < STEPS.length && (
              <div
                className={clsx(
                  "h-0.5 flex-1",
                  isDone ? "bg-mint" : "bg-slate-200"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
