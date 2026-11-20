import { useEffect, type RefObject } from "react";

/** Calls handler on pointerdown outside every supplied ref. */
export default function useClickOutside(
  refs: RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[],
  handler: () => void,
) {
  useEffect(() => {
    const list = Array.isArray(refs) ? refs : [refs];
    const onDown = (e: PointerEvent) => {
      if (list.some((r) => r.current?.contains(e.target as Node))) return;
      handler();
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [refs, handler]);
}
