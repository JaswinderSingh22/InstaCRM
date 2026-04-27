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
      <Button
        variant="ghost"
        size="icon"
        className="size-9 shrink-0 rounded-full text-neutral-500 hover:bg-neutral-100"
        aria-label="Theme"
      >
        <Sun className="size-[18px] opacity-0" />
      </Button>
    );
  }
  const isDark = resolvedTheme === "dark" || theme === "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-9 shrink-0 rounded-full text-neutral-500 hover:bg-neutral-100"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? <Sun className="size-[18px]" strokeWidth={1.75} /> : <Moon className="size-[18px]" strokeWidth={1.75} />}
    </Button>
  );
}
