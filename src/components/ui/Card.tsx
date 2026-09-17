import clsx from "clsx";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx("rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={clsx("mb-3 text-sm font-semibold text-zinc-500 uppercase tracking-wide", className)}>{children}</h2>;
}
