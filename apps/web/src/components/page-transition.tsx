"use client";

import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { usePathname } from "next/navigation";

const EASE = [0.2, 0.8, 0.2, 1] as const;

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Nếu đang ở trong admin hoặc account, giữ nguyên chung 1 key để Layout không bị unmount (reload)
  const transitionKey = pathname.startsWith("/admin") 
    ? "admin" 
    : pathname.startsWith("/account") 
      ? "account" 
      : pathname;

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={transitionKey}
          initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8, filter: "blur(2px)" }}
          transition={{ duration: 0.32, ease: EASE }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
  );
}

