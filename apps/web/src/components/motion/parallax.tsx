"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";

interface ParallaxProps {
  children: ReactNode;
  /** Äá»™ dá»‹ch chuyá»ƒn tá»‘i Ä‘a (px) khi cuá»™n. DÆ°Æ¡ng = cháº­m hÆ¡n. */
  offset?: number;
  className?: string;
}

/**
 * Hiá»‡u á»©ng parallax nháº¹ theo scroll. DÃ¹ng cho áº£nh hero / khá»‘i trang trÃ­.
 * Compositor-friendly (chá»‰ transform).
 */
export function Parallax({ children, offset = 60, className }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

