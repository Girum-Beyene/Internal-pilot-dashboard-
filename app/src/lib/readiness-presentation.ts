import type { ReadinessDecision } from "./evidence-model";

const displayLabels: Record<ReadinessDecision, string> = {
  READY: "READY",
  "READY WITH MINOR IMPROVEMENTS": "READY WITH MINOR IMPROVEMENTS",
  "HOLD - CORRECT IMPORTANT ISSUE(S) FIRST": "HOLD — CORRECT IMPORTANT ISSUE(S) FIRST",
  "INSUFFICIENT EVIDENCE - NEED MORE TESTING": "INSUFFICIENT EVIDENCE / NEED MORE TESTING",
};

// Presentation wording only. The stored evidence-model values remain unchanged.
export function readinessDisplayLabel(decision: ReadinessDecision) {
  return displayLabels[decision];
}
