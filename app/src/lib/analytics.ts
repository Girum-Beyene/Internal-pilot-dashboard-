import { COURSE_LABELS, Course, FinalReview, Finding, PRACTICAL_CHECKS, PracticalResult, QUALITY_INDICATORS, QualityRating, ReadinessDecision } from "./evidence-model";

export const practicalLabel = (xmlName: string) => PRACTICAL_CHECKS.find((c) => c[0] === xmlName)?.[1] ?? xmlName;
export const indicator = (xmlName: string) => QUALITY_INDICATORS.find((i) => i.xmlName === xmlName);

export function countPractical(reviews: FinalReview[], xmlName: string) {
  const counts = Object.fromEntries(["PASS", "PASS WITH ISSUE", "FAIL", "NOT TESTED"].map((key) => [key, 0])) as Record<PracticalResult, number>;
  let assigned = 0;
  for (const review of reviews) {
    const item = review.practical.find((p) => p.xmlName === xmlName);
    if (!item?.applicable) continue;
    assigned++;
    counts[item.result]++;
  }
  return { counts, assigned, tested: assigned - counts["NOT TESTED"] };
}

export function countQuality(reviews: FinalReview[], xmlName: string) {
  const keys: QualityRating[] = ["0 BLOCKED", "1 FRAGILE", "2 WORKABLE", "3 STRONG", "NOT TESTED / N/A"];
  const counts = Object.fromEntries(keys.map((key) => [key, 0])) as Record<QualityRating, number>;
  for (const review of reviews) {
    const item = review.quality.find((q) => q.xmlName === xmlName);
    if (item) counts[item.rating]++;
  }
  return { counts, valid: counts["0 BLOCKED"] + counts["1 FRAGILE"] + counts["2 WORKABLE"] + counts["3 STRONG"], total: Object.values(counts).reduce((a, b) => a + b, 0) };
}

const hubCritical = new Set(["b01_account_activation", "b02_sign_in", "b03_course_access", "b04_course_separation", "b08_progress_persistence", "b12_completion_certificate", "b13_return_completed", "b14_cross_user"]);
const courseCritical = new Set(["b05_start_resume", "b06_required_gating", "b07_correct_progression", "b11_final_assessment", "b12_completion_certificate"]);

export interface ReadinessSignal {
  course: Course;
  label: string;
  decision: ReadinessDecision;
  finalReviews: number;
  unresolvedCritical: number;
  historicalBlockers: number;
  criticalGaps: string[];
  highActions: number;
  reason: string;
}

export function readinessSignal(course: Course, allReviews: FinalReview[], findings: Finding[]): ReadinessSignal {
  const reviews = course === "hub" ? allReviews : allReviews.filter((r) => r.course === course);
  const scopeFindings = findings.filter((f) => f.course === course);
  const linkedSources = new Set(scopeFindings.flatMap((f) => f.sourceRecordIds));
  const unresolvedCritical = scopeFindings.filter((f) => f.severity === "Critical" && f.blockerClassification === "Confirmed blocker" && !["Verified Closed", "Not an Issue"].includes(f.status)).length;
  // Quick Finding v2.1 collects no participant blocker classification. Only the
  // Final Review's explicit answer or a DEC-classified Finding can affect blocker state.
  const explicitBlockerReviews = course === "hub" ? [] : reviews.filter((review) => review.possibleBlocker === "yes");
  const untriagedBlockers = explicitBlockerReviews.filter((review) => !linkedSources.has(review.id) && !linkedSources.has(review.sourceId)).length;
  const historicalBlockers = explicitBlockerReviews.length + scopeFindings.filter((f) => f.severity === "Critical" && f.blockerClassification === "Confirmed blocker").length;
  const criticalSet = course === "hub" ? hubCritical : courseCritical;
  const criticalGaps = [...criticalSet].filter((xmlName) => {
    const { tested } = countPractical(reviews, xmlName);
    return tested === 0;
  }).map(practicalLabel);
  const untriagedFails = reviews.flatMap((r) => r.practical.map((p) => ({ ...p, reviewId: r.id }))).filter((p) => criticalSet.has(p.xmlName) && p.result === "FAIL" && !linkedSources.has(p.reviewId)).length;
  const highActions = scopeFindings.filter((f) => f.priority === "High" && !["Verified Closed", "Not an Issue"].includes(f.status) && ["During internal pilot", "Before selected-CSO pilot"].includes(f.decisionHorizon)).length;
  const passWithIssue = reviews.some((r) => r.practical.some((p) => criticalSet.has(p.xmlName) && p.result === "PASS WITH ISSUE"));
  const weakQuality = reviews.some((r) => r.quality.some((q) => q.rating === "0 BLOCKED" || q.rating === "1 FRAGILE"));
  let decision: ReadinessDecision;
  let reason: string;
  if (unresolvedCritical + untriagedBlockers + untriagedFails > 0) {
    decision = "HOLD - CORRECT IMPORTANT ISSUE(S) FIRST";
    reason = `${unresolvedCritical + untriagedBlockers + untriagedFails} unresolved or untriaged critical evidence item(s) require correction and recheck.`;
  } else if (reviews.length === 0 || criticalGaps.length > 0) {
    decision = "INSUFFICIENT EVIDENCE - NEED MORE TESTING";
    reason = reviews.length === 0 ? "No Final Review evidence is available." : `${criticalGaps.length} critical check(s) have no tested evidence.`;
  } else if (highActions > 0 || passWithIssue || weakQuality) {
    decision = "READY WITH MINOR IMPROVEMENTS";
    reason = "No unresolved confirmed blocker; manageable improvement evidence remains scheduled for action.";
  } else {
    decision = "READY";
    reason = "Critical learner journeys have tested evidence and no unresolved critical blocker is recorded.";
  }
  return { course, label: COURSE_LABELS[course], decision, finalReviews: reviews.length, unresolvedCritical, historicalBlockers, criticalGaps, highActions, reason };
}

export function allReadiness(reviews: FinalReview[], findings: Finding[]) {
  return (["hub", "hrba", "pm"] as Course[]).map((course) => readinessSignal(course, reviews, findings));
}

// Preserve every raw Final Review, but use only the latest edited/submitted record
// for each stable tester/course pair in current-state calculations.
export function currentFinalReviews(reviews: FinalReview[]) {
  const current = new Map<string, FinalReview>();
  for (const review of reviews) {
    const key = review.testerId ? `${review.testerId}\u0000${review.course}` : `source\u0000${review.sourceId}`;
    const candidateTime = Date.parse(review.editedAt ?? review.submittedAt) || 0;
    const existing = current.get(key);
    const existingTime = existing ? Date.parse(existing.editedAt ?? existing.submittedAt) || 0 : -1;
    if (!existing || candidateTime >= existingTime) current.set(key, review);
  }
  return [...current.values()];
}

export function possibleBlockerSummary(reviews: FinalReview[], findings: Finding[]) {
  const historical = reviews.filter((review) => review.possibleBlocker === "yes" || review.possibleBlocker === "not_sure");
  const closed = new Set(["Verified Closed", "Not an Issue"]);
  const unresolved = historical.filter((review) => {
    const linked = findings.filter((finding) => finding.sourceRecordIds.includes(review.id) || finding.sourceRecordIds.includes(review.sourceId));
    return linked.length === 0 || linked.some((finding) => !closed.has(finding.status));
  });
  return { historical, unresolved, closedCount: historical.length - unresolved.length };
}

export const percent = (part: number, total: number) => total ? `${Math.round((part / total) * 100)}%` : "—";
