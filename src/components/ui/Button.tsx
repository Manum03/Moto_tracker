import clsx from "clsx";
import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-zinc-900 text-white hover:bg-zinc-700",
  secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
        VARIANTS[variant],
        className
      )}
      {...props}
    />
  );
}
