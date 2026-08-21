import {
  ACTION_DECISIONS,
  FinalReview,
  Finding,
  PRACTICAL_CHECKS,
  PracticalResult,
  QUALITY_INDICATORS,
  QualityRating,
  QuickFinding,
  READINESS_DECISIONS,
} from "./evidence-model";

const practical = (overrides: Record<string, PracticalResult> = {}) =>
  PRACTICAL_CHECKS.map(([xmlName, , coverage]) => ({
    xmlName,
    result: overrides[xmlName] ?? (coverage === "assigned" ? "NOT TESTED" : "PASS"),
    applicable: coverage === "core" || xmlName in overrides,
    what: overrides[xmlName] && overrides[xmlName] !== "PASS" ? `Observed ${overrides[xmlName].toLowerCase()} during this check.` : undefined,
    recommendation: overrides[xmlName] && overrides[xmlName] !== "PASS" ? "Clarify the route and verify the corrected learner experience." : undefined,
  }));

const quality = (course: "hrba" | "pm", overrides: Record<string, QualityRating> = {}) =>
  QUALITY_INDICATORS.filter((i) => i.appliesTo === "all" || i.appliesTo === course).map((i) => ({
    xmlName: i.xmlName,
    rating: overrides[i.xmlName] ?? "3 STRONG",
    comment: overrides[i.xmlName] && overrides[i.xmlName] !== "3 STRONG" ? "The route worked, but the learner needed clearer guidance." : undefined,
  }));

function review(input: Pick<FinalReview, "id" | "sourceId" | "sourceUuid" | "submittedAt" | "testerId" | "course" | "device" | "internet" | "completion" | "possibleBlocker"> & {
  practicalOverrides?: Record<string, PracticalResult>;
  qualityOverrides?: Record<string, QualityRating>;
  texts: [string, string, string, string];
}): FinalReview {
  const [keep, priority, best, use] = input.texts;
  const qualitative = [
    { kind: "KEEP" as const, domain: "Cross-cutting" as const, sourceField: "j_keep", excerpt: keep },
    { kind: "Priority Improvement" as const, domain: "Cross-cutting" as const, sourceField: "j_priority_improvement", excerpt: priority },
    { kind: "Best Decision Activity" as const, domain: "Learning & Better Decisions" as const, sourceField: "e_best_decision_activity", excerpt: best },
    { kind: "Workplace Use" as const, domain: "Application & Transfer" as const, sourceField: "g_practical_example", excerpt: use },
  ].map((e, index) => ({ ...e, id: `${input.id}-E${index + 1}`, reviewId: input.id, testerId: input.testerId, course: input.course }));
  return {
    ...input,
    practical: practical(input.practicalOverrides),
    quality: quality(input.course, input.qualityOverrides),
    qualitative,
    actionRecommendation: input.possibleBlocker === "yes" ? ACTION_DECISIONS[0] : ACTION_DECISIONS[1],
    readinessRecommendation: input.possibleBlocker === "yes" ? READINESS_DECISIONS[2] : READINESS_DECISIONS[1],
  };
}

export const SAMPLE_REVIEWS: FinalReview[] = [
  review({
    id: "R-1001", sourceId: "91001", sourceUuid: "f13e-hrba-01", submittedAt: "2026-08-17T09:20:00Z", testerId: "T-04", course: "hrba", device: "Smartphone", internet: "Sometimes interrupted", completion: "Whole course", possibleBlocker: "no",
    practicalOverrides: { b01_account_activation: "PASS", b07_correct_progression: "PASS WITH ISSUE", b13_return_completed: "PASS" },
    qualityOverrides: { d02_navigation: "2 WORKABLE", d07_mobile_learning: "1 FRAGILE", eh03_design: "3 STRONG", g02_tool_adapt: "3 STRONG" },
    texts: ["The project-design repair activity should be retained because it connects analysis to a concrete decision.", "Make the next action more visible on smaller screens before the selected-CSO pilot.", "The Module 3 design repair helped me see how an exclusion finding should change the activity plan.", "A CSO could use the participation checklist before a community consultation."],
  }),
  review({
    id: "R-1002", sourceId: "91002", sourceUuid: "f13e-hrba-02", submittedAt: "2026-08-18T12:05:00Z", testerId: "T-07", course: "hrba", device: "Laptop", internet: "Mostly reliable", completion: "Whole course", possibleBlocker: "no",
    practicalOverrides: { b04_course_separation: "PASS", b16_second_device: "NOT TESTED" },
    qualityOverrides: { c01_enter_hub: "2 WORKABLE", e03_feedback_decisions: "3 STRONG", f03_adaptability: "2 WORKABLE" },
    texts: ["Corrective feedback explains why a choice is weak without giving away the answer.", "Add one concise orientation cue explaining where saved progress appears.", "The responsibility-boundary scenario made the consequence of replacing a duty-bearer clear.", "The team could adapt the actor and responsibility map during project inception."],
  }),
  review({
    id: "R-2001", sourceId: "92001", sourceUuid: "a81c-pm-01", submittedAt: "2026-08-18T15:40:00Z", testerId: "T-11", course: "pm", device: "Laptop", internet: "Frequently interrupted", completion: "Most of the course", possibleBlocker: "yes",
    practicalOverrides: { b06_required_gating: "FAIL", b07_correct_progression: "FAIL", b11_final_assessment: "NOT TESTED", b12_completion_certificate: "NOT TESTED" },
    qualityOverrides: { d06_corrective_feedback: "0 BLOCKED", ep04_risk_change: "1 FRAGILE", e05_assessment_alignment: "NOT TESTED / N/A" },
    texts: ["The continuing project case makes the planning tools feel connected.", "Correct and recheck the risk activity completion rule before the selected-CSO pilot.", "The work-breakdown activity linked deliverables, owners and time in one decision.", "A project team could adapt the responsibility matrix at a kickoff meeting."],
  }),
];

export const SAMPLE_QUICK_FINDINGS: QuickFinding[] = [
  { id: "Q-501", sourceId: "80501", submittedAt: "2026-08-17T08:45:00Z", testerId: "T-04", course: "hrba", stableId: "Module 2 / screen 8", whatHappened: "The Continue action appeared below a long blank area and was easy to miss.", recommendation: "Reduce the empty space or keep the next action visible." },
  { id: "Q-502", sourceId: "80502", submittedAt: "2026-08-17T11:15:00Z", testerId: "T-07", course: "hrba", stableId: "Module 4 / feedback", whatHappened: "The feedback clearly explained why the first response blurred the CSO role.", recommendation: "Retain this feedback pattern." },
  { id: "Q-503", sourceId: "80503", submittedAt: "2026-08-18T14:55:00Z", testerId: "T-11", course: "pm", stableId: "Risk activity / PM-M4-A3", whatHappened: "Progression remained locked after the options consistent with the instructions were selected.", recommendation: "Check answer mapping and make the unresolved choice visible in feedback." },
  { id: "Q-504", sourceId: "80504", submittedAt: "2026-08-18T16:10:00Z", testerId: "T-11", course: "hub", stableId: "Learner dashboard", whatHappened: "The certificate area was not yet available because the course could not be completed.", recommendation: "Recheck after the progression issue is corrected; do not classify separately yet." },
];

export const SAMPLE_FINDINGS: Finding[] = [
  { id: "F-001", course: "hub", domain: "Access & Entry", evidence: "A prior activation link expired before use; the replacement route was tested successfully.", sourceRecordIds: ["Q-490"], recordCount: 1, recurrence: "Isolated", severity: "Critical", blockerClassification: "Confirmed blocker", interpretation: "The original route blocked entry, but the corrected path now works.", actionDecision: "Fix Now", recommendedAction: "Retain replacement-link handling and monitor recurrence.", priority: "High", owner: "Hub administrator", targetTiming: "2026-08-16", status: "Verified Closed", verification: "Retested with a new learner account on 16 Aug; activation and sign-in passed.", responseArea: "Hub improvement", findingType: "Technical defect", decisionHorizon: "During internal pilot", history: [{ at: "2026-08-16T13:00:00Z", event: "Verified Closed after successful retest" }] },
  { id: "F-002", course: "hrba", domain: "Learning Experience", evidence: "On smartphone, the next action can fall below excess whitespace.", sourceRecordIds: ["Q-501", "R-1001-E2"], recordCount: 2, recurrence: "Repeated across two evidence records", severity: "High", blockerClassification: "Not a blocker", interpretation: "Learners can proceed, but the route is fragile on smaller screens.", actionDecision: "Improve Before Wider Use", recommendedAction: "Reduce vertical whitespace and test the next-action position on common phone widths.", priority: "High", owner: "Course production team", targetTiming: "2026-08-24", status: "In Progress", verification: "", responseArea: "Course improvement", findingType: "Usability", decisionHorizon: "Before selected-CSO pilot", history: [{ at: "2026-08-18T10:00:00Z", event: "Action assigned" }] },
  { id: "F-003", course: "pm", domain: "Learning & Better Decisions", evidence: "Required risk activity remains locked after an apparently valid choice; final assessment and certificate were not reached.", sourceRecordIds: ["Q-503", "R-2001"], recordCount: 2, recurrence: "Confirmed in Quick Finding and Final Review", severity: "Critical", blockerClassification: "Confirmed blocker", interpretation: "This is a learner-journey failure; positive course ratings cannot offset it.", actionDecision: "Fix Now", recommendedAction: "Correct answer mapping, improve diagnostic feedback, and recheck progression through certificate.", priority: "High", owner: "Course developer", targetTiming: "2026-08-20", status: "In Progress", verification: "Awaiting corrected build and independent retest.", responseArea: "Course improvement", findingType: "Progression defect", decisionHorizon: "During internal pilot", history: [{ at: "2026-08-18T16:00:00Z", event: "Confirmed blocker; correction assigned" }] },
];
