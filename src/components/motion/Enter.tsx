"use client";

import { motion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import { EASE_OUT_EXPO } from "@/components/motion/easing";
import { usePageRevealed } from "@/components/motion/PageTransitions";

const VARIANTS = {
  rise: { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } },
  /** Uncovers top to bottom, like a line being drawn down the page. */
  draw: { hidden: { clipPath: "inset(0% 0% 100% 0%)" }, show: { clipPath: "inset(0% 0% 0% 0%)" } },
  pop: { hidden: { opacity: 0, scale: 0.5 }, show: { opacity: 1, scale: 1 } },
};

type EnterProps = {
  as?: "div" | "li";
  variant?: keyof typeof VARIANTS;
  /** Seconds after the page is revealed. */
  delay?: number;
  duration?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

/** Plays an entrance once the page is uncovered, so it isn't spent behind a page transition. */
export function Enter({ as = "div", variant = "rise", delay = 0, duration = 0.7, className, style, children }: EnterProps) {
  const revealed = usePageRevealed();
  const Component = as === "li" ? motion.li : motion.div;
  return (
    <Component
      className={className}
      style={style}
      initial="hidden"
      animate={revealed ? "show" : "hidden"}
      variants={VARIANTS[variant]}
      transition={{ delay, duration, ease: EASE_OUT_EXPO }}
    >
      {children}
    </Component>
  );
}
