import { useCallback } from "react";

// Tiny wrapper over the Vibration API. No-op on unsupported devices (desktop,
// iOS Safari) — the streak-free app leans on FEEL for reward, so a short tick
// on completing something is the dopamine substitute for shame-based streaks.
type Pattern = "tick" | "success" | "undo";

const PATTERNS: Record<Pattern, number | number[]> = {
  tick: 12,
  success: [10, 40, 18],
  undo: [8, 30, 8],
};

export function useHaptics() {
  return useCallback((pattern: Pattern = "tick") => {
    try {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(PATTERNS[pattern]);
      }
    } catch {
      // ignore — unsupported
    }
  }, []);
}
