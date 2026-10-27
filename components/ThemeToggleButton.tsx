"use client";

import type { ReactNode } from "react";
import { useTheme } from "next-themes";

export function ThemeToggleButton({ children }: { children: ReactNode }) {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="theme-toggle"
      aria-label="Toggle theme"
    >
      {children}
    </button>
  );
}
