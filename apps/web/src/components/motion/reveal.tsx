"use client";

import { motion, type Variants } from "framer-motion";
import { type ReactNode } from "react";

const EASE_LUXURY = [0.2, 0.8, 0.2, 1] as const;

type Direction = "up" | "down" | "left" | "right" | "none";

const offset: Record<Direction, { x?: number; y?: number }> = {
  up: { y: 28 },
  down: { y: -28 },
  left: { x: 28 },
  right: { x: -28 },
  none: {},
};

interface RevealProps {
  children: ReactNode;
  /** HÆ°á»›ng trÆ°á»£t vÃ o. Máº·c Ä‘á»‹nh "up". */
  direction?: Direction;
  /** Delay (giÃ¢y) trÆ°á»›c khi animate. */
  delay?: number;
  /** Thá»i lÆ°á»£ng (giÃ¢y). Máº·c Ä‘á»‹nh 0.6s. */
  duration?: number;
  className?: string;
  /** Pháº§n tá»­ HTML render. Máº·c Ä‘á»‹nh "div". */
  as?: "div" | "section" | "article" | "li" | "span";
  /** Animate láº¡i má»—i láº§n vÃ o viewport thay vÃ¬ 1 láº§n. */
  once?: boolean;
}

/**
 * Scroll-reveal element. Animate khi cuá»™n vÃ o táº§m nhÃ¬n.
 * Tá»± tÃ´n trá»ng prefers-reduced-motion (qua MotionConfig á»Ÿ PageTransition).
 */
export function Reveal({
  children,
  direction = "up",
  delay = 0,
  duration = 0.6,
  className,
  as = "div",
  once = true,
}: RevealProps) {
  const MotionTag = motion[as];
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, ...offset[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, amount: 0.2, margin: "0px 0px -80px 0px" }}
      transition={{ duration, delay, ease: EASE_LUXURY }}
    >
      {children}
    </MotionTag>
  );
}

const staggerParent: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const staggerChild: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_LUXURY } },
};

interface StaggerProps {
  children: ReactNode;
  className?: string;
  once?: boolean;
}

/** Container cho hiá»‡u á»©ng láº§n lÆ°á»£t (stagger) cÃ¡c child lÃ  <RevealItem>. */
export function StaggerGroup({ children, className, once = true }: StaggerProps) {
  return (
    <motion.div
      className={className}
      variants={staggerParent}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.15 }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={staggerChild}>
      {children}
    </motion.div>
  );
}

