"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ModeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="size-8 rounded-md" aria-label="Theme">
        <Sun className="size-4 opacity-0" />
      </Button>
    );
  }
  const isDark = resolvedTheme === "dark" || theme === "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8 rounded-md"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
