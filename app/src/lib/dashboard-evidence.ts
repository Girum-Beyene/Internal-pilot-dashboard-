import type { FinalReview, Finding, QuickFinding } from "./evidence-model";

export type DashboardEvidence = {
  reviews: FinalReview[];
  quick: QuickFinding[];
  findings: Finding[];
};

// The real dashboard always starts empty and receives records only from the
// server-side dec_pilot evidence API. Fixtures belong exclusively to /simulation.
export function emptyDashboardEvidence(): DashboardEvidence {
  return { reviews: [], quick: [], findings: [] };
}
