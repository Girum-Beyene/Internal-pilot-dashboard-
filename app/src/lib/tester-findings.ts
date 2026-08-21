import type { QuickFinding } from "./evidence-model";

export function findingsForTester(findings: QuickFinding[], testerId: string) {
  return findings.filter((finding) => finding.testerId === testerId).sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt));
}

export function buildFinalReviewUrl(formUrl: string | undefined, testerId: string, course: "hrba" | "pm", returnUrl?: string) {
  if (!formUrl) return null;
  const url = new URL(formUrl);
  url.searchParams.set("d[tester_id]", testerId);
  url.searchParams.set("d[course]", course);
  if (returnUrl) url.searchParams.set("return_url", returnUrl);
  return url.toString();
}
