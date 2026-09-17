import clsx from "clsx";
import { InputHTMLAttributes, SelectHTMLAttributes } from "react";

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-zinc-700">{label}</span>
      {children}
    </label>
  );
}

const baseInputClass =
  "rounded-xl border border-zinc-300 px-3 py-2.5 text-base text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx(baseInputClass, props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={clsx(baseInputClass, "bg-white", props.className)} />;
}
