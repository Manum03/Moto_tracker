import { SemaphoreLevel } from "@/lib/alerts";
import clsx from "clsx";

const STYLES: Record<SemaphoreLevel, string> = {
  green: "bg-emerald-100 text-emerald-800 border-emerald-300",
  yellow: "bg-amber-100 text-amber-800 border-amber-300",
  red: "bg-red-100 text-red-800 border-red-300",
};

const DOT_STYLES: Record<SemaphoreLevel, string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-500",
  red: "bg-red-500",
};

export function SemaphoreDot({ level, className }: { level: SemaphoreLevel; className?: string }) {
  return <span className={clsx("inline-block h-3 w-3 rounded-full", DOT_STYLES[level], className)} />;
}

export function SemaphoreBadge({ level, children }: { level: SemaphoreLevel; children: React.ReactNode }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        STYLES[level]
      )}
    >
      <SemaphoreDot level={level} />
      {children}
    </span>
  );
}
