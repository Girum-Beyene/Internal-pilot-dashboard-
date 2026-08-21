import { PRACTICAL_CHECKS, QUALITY_INDICATORS } from "../evidence-model";

export type KoboPayload = Record<string, unknown>;

// Kobo may prefix XML names with group paths. Exact leaf names remain the source contract.
export function leafFields(payload: KoboPayload) {
  return Object.fromEntries(Object.entries(payload).map(([key, value]) => [key.split("/").at(-1) ?? key, value]));
}

const text = (value: unknown) => value === null || value === undefined ? null : String(value);

export function normalizedRows(sourceForm: "quick" | "review", assetUid: string, payload: KoboPayload) {
  const f = leafFields(payload);
  const sourceId = String(f._id ?? f._uuid ?? "");
  const uuid = String(f._uuid ?? f._root_uuid ?? sourceId);
  const base = { source_form: sourceForm, source_submission_id: sourceId, source_uuid: uuid, source_asset_uid: assetUid, submitted_at: f._submission_time ?? f.end ?? null, edited_at: f._last_edited ?? f._submission_time ?? null };
  if (sourceForm === "quick") {
    return {
      parent: { table: "quick_findings", conflict: "source_asset_uid,source_submission_id", row: { ...base, tester_id: text(f.tester_id), observation_location: text(f.observation_location), stable_id: text(f.stable_id), what_happened: text(f.what_happened), recommendation: text(f.recommendation), screenshot_ref: text(f.screenshot) } },
      practical: [], quality: [], qualitative: [],
    };
  }
  const course = text(f.course);
  const parent = { ...base, review_key: text(f.review_key), tester_id: text(f.tester_id), course, testing_role: text(f.testing_role), main_device: text(f.main_device), internet_experience: text(f.internet_experience), completion_amount: text(f.completion_amount), learner_status: text(f.learner_status), possible_blocker: text(f.j_possible_blocker), action_recommendation: text(f.k_action), readiness_recommendation: text(f.l_readiness), readiness_reason: text(f.l_readiness_reason) };
  const assigned: Record<string, boolean> = {
    b01_account_activation: f.assigned_activation_check === "yes", b04_course_separation: f.assigned_course_separation_check === "yes", b13_return_completed: f.assigned_post_completion_check === "yes", b14_cross_user: f.assigned_cross_user_check === "yes", b16_second_device: f.assigned_second_device_check === "yes",
  };
  const practical = PRACTICAL_CHECKS.map(([xmlName, label, coverage, scope]) => ({ source_asset_uid: assetUid, source_submission_id: sourceId, xml_name: xmlName, label, result: text(f[xmlName]), applicable: coverage === "core" || Boolean(assigned[xmlName]), critical_scope: scope, what_happened: text(f[`${xmlName}_what`]), recommendation: text(f[`${xmlName}_recommend`]) }));
  const quality = QUALITY_INDICATORS.filter((i) => i.appliesTo === "all" || i.appliesTo === course).map((i) => ({ source_asset_uid: assetUid, source_submission_id: sourceId, xml_name: i.xmlName, label: i.label, domain: i.domain, applies_to: i.appliesTo, rating: text(f[i.xmlName]), comment: text(f[`${i.xmlName}_comment`]) }));
  const openText: [string, string, string][] = [
    ["b_critical_not_tested_reason", "Missing Critical Evidence", "Cross-cutting"], ["c_access_improvement", "Priority Improvement", "Access & Entry"], ["d_difficult_screen", "Difficult Activity", "Learning Experience"], ["e_best_decision_activity", "Best Decision Activity", "Learning & Better Decisions"], ["f_realistic_relevant", "KEEP", "Context & Relevance"], ["f_unrealistic_unclear", "Priority Improvement", "Context & Relevance"], ["g_practical_example", "Workplace Use", "Application & Transfer"], ["g_support_needs", "Support Need", "Application & Transfer"], ["g_support_other", "Support Need", "Application & Transfer"], ["h_staff_support_improvement", "Recommendation", "DEC Operational Readiness"], ["i_missing_add", "Instrument Feedback", "Cross-cutting"], ["i_confusing_change", "Instrument Feedback", "Cross-cutting"], ["i_rating_explain", "Instrument Feedback", "Cross-cutting"], ["j_keep", "KEEP", "Cross-cutting"], ["j_priority_improvement", "Priority Improvement", "Cross-cutting"], ["j_blocker_explain", "Possible Blocker", "Cross-cutting"], ["l_readiness_reason", "Readiness Reason", "Cross-cutting"],
  ];
  for (const i of QUALITY_INDICATORS) openText.push([`${i.xmlName}_comment`, "Indicator Comment", i.domain]);
  for (const [xmlName] of PRACTICAL_CHECKS) { openText.push([`${xmlName}_what`, "Practical Observation", "Cross-cutting"]); openText.push([`${xmlName}_recommend`, "Recommendation", "Cross-cutting"]); }
  const qualitative = openText.filter(([xmlName]) => text(f[xmlName])?.trim()).map(([xmlName, evidenceType, domain]) => ({ source_asset_uid: assetUid, source_submission_id: sourceId, tester_id: text(f.tester_id), course, source_field: xmlName, evidence_type: evidenceType, domain, excerpt: text(f[xmlName]) }));
  return { parent: { table: "final_reviews", conflict: "source_asset_uid,source_submission_id", row: parent }, practical, quality, qualitative };
}
