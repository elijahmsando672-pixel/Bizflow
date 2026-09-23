"use client";

import { useEffect } from "react";

export function useClickOutside(
  ref: { current: HTMLElement | null },
  onOutside: () => void,
  active = true
) {
  useEffect(() => {
    if (!active) return;
    const handler = (event: MouseEvent | TouchEvent) => {
      const el = ref.current;
      if (el && !el.contains(event.target as Node)) {
        onOutside();
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [ref, onOutside, active]);
}