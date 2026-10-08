"use client";

import type { ReactNode } from "react";
import { useTheme } from "next-themes";

export function ThemeToggleButton({ children }: { children: ReactNode }) {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
      aria-label="Toggle theme"
    >
      {children}
    </button>
  );
}
