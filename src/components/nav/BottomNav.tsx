"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const ITEMS = [
  { href: "/", label: "Inicio", icon: "🏠" },
  { href: "/vehicle", label: "Vehículo", icon: "🏍️" },
  { href: "/documents", label: "Documentos", icon: "📄" },
  { href: "/maintenance", label: "Mantenimiento", icon: "🔧" },
  { href: "/credit", label: "Crédito", icon: "💳" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-10 border-t border-zinc-200 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <ul className="flex justify-between">
        {ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={clsx(
                  "flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium",
                  active ? "text-zinc-900" : "text-zinc-400"
                )}
              >
                <span className="text-lg leading-none">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
