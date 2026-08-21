import { SAMPLE_FINDINGS, SAMPLE_QUICK_FINDINGS, SAMPLE_REVIEWS } from "./fixtures";
import type { DashboardEvidence } from "./dashboard-evidence";

export function simulationDashboardEvidence(): DashboardEvidence {
  return {
    reviews: structuredClone(SAMPLE_REVIEWS),
    quick: structuredClone(SAMPLE_QUICK_FINDINGS),
    findings: structuredClone(SAMPLE_FINDINGS),
  };
}
