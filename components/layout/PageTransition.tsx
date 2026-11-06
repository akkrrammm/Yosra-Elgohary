"use client";

import { m, useReducedMotion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";

let hasEnteredSite = false;

/** Between pages a purple curtain lifts off the new page. The first load has its own loader. */
export function PageTransition({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const [playCurtain] = useState(() => hasEnteredSite);

  useEffect(() => {
    hasEnteredSite = true;
  }, []);

  return (
    <>
      {playCurtain && !reduced && (
        <m.div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[90] origin-top bg-brand"
          initial={{ scaleY: 1 }}
          animate={{ scaleY: 0 }}
          transition={{ duration: 0.75, ease: [0.76, 0, 0.24, 1], delay: 0.05 }}
        />
      )}
      {children}
    </>
  );
}
