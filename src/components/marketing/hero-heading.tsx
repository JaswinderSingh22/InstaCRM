"use client";

import { motion } from "framer-motion";

export function HeroHeading({ children }: { children: React.ReactNode }) {
  return (
    <motion.h1
      className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.h1>
  );
}
