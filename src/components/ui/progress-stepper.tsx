import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProgressStep = {
  id: string;
  label: string;
  description?: string;
  status: "completed" | "current" | "upcoming";
};

export function ProgressStepper({ steps, ariaLabel = "Progress", className }: { steps: ProgressStep[]; ariaLabel?: string; className?: string }) {
  return <nav aria-label={ariaLabel} className={cn("overflow-x-auto pb-2", className)}><ol className="flex min-w-[680px] items-start">{steps.map((step, index) => <li key={step.id} className="relative min-w-0 flex-1 px-2 text-center" aria-current={step.status === "current" ? "step" : undefined}>
    {index < steps.length - 1 && <span aria-hidden="true" className={cn("absolute left-[calc(50%+1.25rem)] right-[calc(-50%+1.25rem)] top-5 h-0.5", step.status === "completed" ? "bg-primary" : "bg-border")} />}
    <span className={cn("relative z-10 mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors", step.status === "completed" && "border-primary bg-primary text-primary-foreground", step.status === "current" && "border-primary bg-background text-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.15)]", step.status === "upcoming" && "border-border bg-muted text-muted-foreground")}>
      {step.status === "completed" ? <Check className="h-4 w-4" aria-hidden="true" /> : index + 1}
    </span>
    <span className={cn("mt-3 block text-xs font-semibold", step.status === "current" ? "text-primary" : step.status === "upcoming" ? "text-muted-foreground" : "text-foreground")}>{step.label}</span>
    {step.description && <span className="mt-1 block text-[10px] leading-tight text-muted-foreground">{step.description}</span>}
  </li>)}</ol></nav>;
}
