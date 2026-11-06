"use client";

import { m, useMotionValue, useSpring } from "motion/react";
import { useEffect, useState } from "react";

/** A lime disc that follows the pointer over anything marked data-cursor="Label". */
export function CursorLabel() {
  const [label, setLabel] = useState<string | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const smoothX = useSpring(x, { stiffness: 420, damping: 38, mass: 0.5 });
  const smoothY = useSpring(y, { stiffness: 420, damping: 38, mass: 0.5 });

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const move = (event: PointerEvent) => {
      x.set(event.clientX);
      y.set(event.clientY);
      const target = (event.target as Element | null)?.closest?.("[data-cursor]");
      setLabel(target ? target.getAttribute("data-cursor") : null);
    };

    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [x, y]);

  return (
    <m.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[80] -ml-14 -mt-14 hidden size-28 place-items-center rounded-full bg-lime text-center text-sm font-semibold leading-tight text-ink lg:grid"
      style={{ x: smoothX, y: smoothY }}
      initial={false}
      animate={{ scale: label ? 1 : 0, opacity: label ? 1 : 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className="px-3">{label}</span>
    </m.div>
  );
}
