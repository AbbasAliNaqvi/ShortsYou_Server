"use client";

import { animate } from "animejs";
import { useEffect, useRef } from "react";

export function CreatorPointer() {
  const pointerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const targetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const pointer = pointerRef.current;
    if (!pointer || window.matchMedia("(pointer: coarse)").matches) return;

    const move = (event: PointerEvent) => {
      targetRef.current = { x: event.clientX, y: event.clientY };
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        animate(pointer, {
          translateX: targetRef.current.x,
          translateY: targetRef.current.y,
          duration: 420,
          ease: "out(3)",
        });
      });
    };

    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return <div ref={pointerRef} className="creator-pointer" aria-hidden="true" />;
}
