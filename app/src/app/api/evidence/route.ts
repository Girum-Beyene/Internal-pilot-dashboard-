/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { ACTION_DECISIONS, Finding, FinalReview, PracticalResult, QualityRating, QuickFinding, READINESS_DECISIONS, QualitativeEvidence } from "@/lib/evidence-model";
import { currentFinalReviews } from "@/lib/analytics";
import { authorizedInternal } from "@/lib/server/auth";
import { getRows } from "@/lib/server/supabase-rest";

const practicalMap: Record<string, PracticalResult> = { pass: "PASS", pass_issue: "PASS WITH ISSUE", fail: "FAIL", not_tested: "NOT TESTED" };
const qualityMap: Record<string, QualityRating> = { blocked_0: "0 BLOCKED", fragile_1: "1 FRAGILE", workable_2: "2 WORKABLE", strong_3: "3 STRONG", not_tested: "NOT TESTED / N/A" };
const actionMap = Object.fromEntries(["fix_now", "improve_before_wider", "retain", "investigate", "later_phase"].map((x, i) => [x, ACTION_DECISIONS[i]]));
const readinessMap = Object.fromEntries(["ready", "ready_minor", "hold", "insufficient"].map((x, i) => [x, READINESS_DECISIONS[i]]));
const evidenceKinds = new Set(["KEEP", "Priority Improvement", "Possible Blocker", "Difficult Activity", "Best Decision Activity", "Workplace Use", "Support Need", "Recommendation"]);

export async function GET(request: NextRequest) {
  // The public real dashboard may render its zero-data shell before an analyst
  // session exists. Return no rows rather than exposing any dec_pilot record.
  if (!authorizedInternal(request)) return NextResponse.json({ reviews: [], quick: [], findings: [], sample: false, archivedReviewVersions: 0, lastSync: null, access: "Internal DEC access required for pilot evidence." });
  try {
    const [reviewRows, practicalRows, qualityRows, textRows, quickRows, findingRows, sourceRows, syncRows] = await Promise.all([
      getRows("final_reviews"), getRows("practical_checks"), getRows("quality_ratings"), getRows("qualitative_evidence"), getRows("quick_findings"), getRows("findings"), getRows("finding_sources"), getRows("sync_runs", "select=completed_at,status,error_message&order=completed_at.desc&limit=1"),
    ]);
    const allReviews: FinalReview[] = reviewRows.map((r: any) => {
      const id = String(r.source_submission_id);
      const course = r.course as "hrba" | "pm";
      const qualitative: QualitativeEvidence[] = textRows.filter((x: any) => x.source_asset_uid === r.source_asset_uid && x.source_submission_id === r.source_submission_id).map((x: any) => ({ id: String(x.id), reviewId: id, testerId: String(x.tester_id ?? r.tester_id), course, kind: evidenceKinds.has(x.evidence_type) ? x.evidence_type : "Recommendation", domain: x.domain, sourceField: x.source_field, excerpt: x.excerpt }));
      return { id, sourceId: String(r.source_submission_id), sourceUuid: String(r.source_uuid ?? ""), submittedAt: r.submitted_at, editedAt: r.edited_at, testerId: r.tester_id, course, device: r.main_device, internet: r.internet_experience, completion: r.completion_amount,
        practical: practicalRows.filter((x: any) => x.source_asset_uid === r.source_asset_uid && x.source_submission_id === r.source_submission_id).map((x: any) => ({ xmlName: x.xml_name, result: practicalMap[x.result], applicable: x.applicable, what: x.what_happened, recommendation: x.recommendation })),
        quality: qualityRows.filter((x: any) => x.source_asset_uid === r.source_asset_uid && x.source_submission_id === r.source_submission_id).map((x: any) => ({ xmlName: x.xml_name, rating: qualityMap[x.rating], comment: x.comment })), qualitative,
        possibleBlocker: r.possible_blocker, actionRecommendation: actionMap[r.action_recommendation] ?? "Investigate Further", readinessRecommendation: readinessMap[r.readiness_recommendation] ?? "INSUFFICIENT EVIDENCE - NEED MORE TESTING" };
    });
    const reviews = currentFinalReviews(allReviews);
    const quick: QuickFinding[] = quickRows.map((q: any) => ({ id: String(q.source_submission_id), sourceId: String(q.source_submission_id), submittedAt: q.submitted_at, testerId: q.tester_id, course: q.observation_location, stableId: q.stable_id, whatHappened: q.what_happened, recommendation: q.recommendation, screenshot: q.screenshot_ref }));
    const findings: Finding[] = findingRows.map((f: any) => ({ id: f.finding_id, course: f.course_hub, domain: f.domain, evidence: f.evidence, sourceRecordIds: sourceRows.filter((s: any) => s.finding_id === f.id).map((s: any) => s.source_record_id), recordCount: f.evidence_count, recurrence: f.recurrence, severity: f.severity, blockerClassification: f.blocker_classification, interpretation: f.interpretation, actionDecision: f.action_decision, recommendedAction: f.recommended_action, priority: f.priority, owner: f.responsible_person_unit, targetTiming: f.target_timing, status: f.status, verification: f.verification_result, responseArea: f.response_area, findingType: f.finding_type, decisionHorizon: f.decision_horizon, history: [] }));
    return NextResponse.json({ reviews, quick, findings, sample: false, archivedReviewVersions: allReviews.length - reviews.length, lastSync: syncRows[0] ?? null });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Evidence read failed" }, { status: 503 }); }
}
