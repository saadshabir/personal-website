"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createLabState, inspectedPacket, labReducer, type LabAction, type LabState } from "@/lib/network-demo";

type Paint = (state: LabState) => void;
const VISUAL_SPEED = 0.75;

export function useNetworkLab() {
  const [state, setState] = useState(createLabState);
  const [reducedMotion, setReducedMotion] = useState(true);
  const model = useRef(state);
  const published = useRef(state);
  const paint = useRef<Paint>(() => {});
  const dispatch = useCallback((action: LabAction) => {
    const next = labReducer(model.current, action);
    model.current = next;
    paint.current(next);
    published.current = next;
    setState(next);
  }, []);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReducedMotion(motion.matches);
      dispatch({ type: "set-running", running: !motion.matches });
    };
    update();
    motion.addEventListener("change", update);
    return () => motion.removeEventListener("change", update);
  }, [dispatch]);

  useEffect(() => {
    if (!state.running) return;
    let frame = 0;
    let last: number | null = null;
    let publishedAt = model.current.now;
    function animate(time: number) {
      if (document.hidden) { last = null; return; }
      if (last !== null && model.current.running) {
        const next = labReducer(model.current, { type: "tick", ms: Math.min(time - last, 100) * VISUAL_SPEED });
        model.current = next;
        paint.current(next);
        // Packet motion is painted directly. React only needs a new snapshot
        // when the inspector's visible outcome changes, at the same cadence.
        if (next.now - publishedAt >= 120 || next.now < publishedAt) {
          publishedAt = next.now;
          if (inspectedPacket(next)?.status !== inspectedPacket(published.current)?.status) {
            published.current = next;
            setState(next);
          }
        }
      }
      last = time;
      frame = window.requestAnimationFrame(animate);
    }
    const onVisibility = () => {
      last = null;
      window.cancelAnimationFrame(frame);
      if (!document.hidden) frame = window.requestAnimationFrame(animate);
    };
    document.addEventListener("visibilitychange", onVisibility);
    if (!document.hidden) frame = window.requestAnimationFrame(animate);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [state.running]);

  return { state, model, paint, dispatch, reducedMotion };
}
