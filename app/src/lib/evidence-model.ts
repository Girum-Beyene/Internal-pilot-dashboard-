export const PRACTICAL_RESULTS = ["PASS", "PASS WITH ISSUE", "FAIL", "NOT TESTED"] as const;
export const QUALITY_RATINGS = ["0 BLOCKED", "1 FRAGILE", "2 WORKABLE", "3 STRONG", "NOT TESTED / N/A"] as const;
export const ACTION_DECISIONS = ["Fix Now", "Improve Before Wider Use", "Retain as Designed", "Investigate Further", "Consider for a Later Phase"] as const;
export const READINESS_DECISIONS = ["READY", "READY WITH MINOR IMPROVEMENTS", "HOLD - CORRECT IMPORTANT ISSUE(S) FIRST", "INSUFFICIENT EVIDENCE - NEED MORE TESTING"] as const;
export const DECISION_HORIZONS = ["During internal pilot", "Before selected-CSO pilot", "Validate during selected-CSO pilot", "Before wider release", "Later programme / phase", "Retain / no change"] as const;

export type Course = "hub" | "hrba" | "pm";
export type PracticalResult = typeof PRACTICAL_RESULTS[number];
export type QualityRating = typeof QUALITY_RATINGS[number];
export type ReadinessDecision = typeof READINESS_DECISIONS[number];
export type DecisionHorizon = typeof DECISION_HORIZONS[number];

export const COURSE_LABELS: Record<Course, string> = {
  hub: "Learning Hub",
  hrba: "HRBA Course",
  pm: "Project Management Course",
};

export const PRACTICAL_CHECKS = [
  ["b01_account_activation", "Account activation / registration", "assigned", "hub"],
  ["b02_sign_in", "Sign in", "core", "hub"],
  ["b03_course_access", "Correct course access", "core", "hub"],
  ["b04_course_separation", "Course entitlement / separation", "assigned", "hub"],
  ["b05_start_resume", "Start / resume", "core", "course"],
  ["b06_required_gating", "Required activity cannot be improperly skipped", "core", "course"],
  ["b07_correct_progression", "Correct completion enables progression", "core", "course"],
  ["b08_progress_persistence", "Exit / reopen progress persistence", "core", "hub"],
  ["b09_device_use", "Meaningful use on assigned device", "core", "course"],
  ["b10_media", "Video / media", "core", "course"],
  ["b11_final_assessment", "Final assessment", "core", "course"],
  ["b12_completion_certificate", "Completion / certificate", "core", "hub"],
  ["b13_return_completed", "Return after completion", "assigned", "hub"],
  ["b14_cross_user", "Cross-user separation", "assigned", "hub"],
  ["b15_feedback_support", "Feedback / support route", "core", "hub"],
  ["b16_second_device", "Second device / browser verification", "assigned", "course"],
] as const;

export type QualityDomain = "Access & Entry" | "Learning Experience" | "Learning & Better Decisions" | "Context & Relevance" | "Application & Transfer" | "DEC Operational Readiness";

const q = (domain: QualityDomain, fields: readonly [string, string][], appliesTo: "all" | "hrba" | "pm" = "all") =>
  fields.map(([xmlName, label]) => ({ xmlName, label, domain, appliesTo }));

export const QUALITY_INDICATORS = [
  ...q("Access & Entry", [["c01_enter_hub", "Entering the Hub and assigned course"], ["c02_activation_signin", "Activation and sign-in are understandable"], ["c03_find_continue", "Find and continue the course"], ["c04_progress_learner", "Progress remains attached to the learner"], ["c05_leave_return", "Leave and return without unnecessary difficulty"], ["c06_device_browser", "Works on the tested device/browser"]]),
  ...q("Learning Experience", [["d01_instructions", "Instructions are clear"], ["d02_navigation", "Navigation and next steps are clear"], ["d03_required_optional", "Required and optional actions are distinct"], ["d04_readability", "Text, visuals and controls support understanding"], ["d05_pacing", "Screen length and pacing are manageable"], ["d06_corrective_feedback", "Corrective feedback is useful"], ["d07_mobile_learning", "Mobile presentation supports learning"]]),
  ...q("Learning & Better Decisions", [["e01_understanding", "Recognise and make better CSO decisions"], ["e02_judgment", "Activities require meaningful realistic choices"], ["e03_feedback_decisions", "Feedback improves weak decisions"], ["e04_progressive_application", "Learning becomes progressively applied"], ["e05_assessment_alignment", "Assessment aligns with practised decisions"]]),
  ...q("Learning & Better Decisions", [["eh01_roles", "Distinguish rights-holders, duty-bearers and CSO roles"], ["eh02_power_inclusion", "Analyse power, participation, inclusion and exclusion"], ["eh03_design", "Use HRBA analysis to improve project design"], ["eh04_implementation", "Make responsible HRBA implementation decisions"], ["eh05_meal", "Use HRBA-informed MEAL evidence"]], "hrba"),
  ...q("Learning & Better Decisions", [["ep01_purpose_results", "Clarify project purpose and results"], ["ep02_roles", "Decide stakeholder involvement and responsibility"], ["ep03_planning", "Connect deliverables, time, resources and budget"], ["ep04_risk_change", "Respond to risks, assumptions, issues and change"], ["ep05_monitor_adapt", "Connect monitoring evidence to adaptation"], ["ep06_closure", "Treat closure, handover and learning as responsibilities"]], "pm"),
  ...q("Context & Relevance", [["f01_language", "Understandable language"], ["f02_cases", "Credible cases and examples"], ["f03_adaptability", "Adaptable across CSO settings"], ["f04_respectful_inclusion", "Respectful treatment of inclusion and power"], ["f05_realistic_constraints", "Reflects realistic CSO constraints"]]),
  ...q("Application & Transfer", [["g01_workplace_use", "A realistic workplace use is identifiable"], ["g02_tool_adapt", "A tool/activity could be adapted"], ["g03_decision_connection", "Connects to a real task or decision"]]),
  ...q("DEC Operational Readiness", [["h01_support", "Learner support is clear and reachable"], ["h02_records", "Progress, completion and certificate are reliable"], ["h03_feedback_route", "Feedback route is practical"], ["h04_common_difficulties", "Common difficulties are supportable"], ["h05_manageability", "Course is manageable for DEC"], ["h06_evidence_use", "Evidence distinguishes immediate and later action"]]),
] as const;

export interface PracticalEvidence {
  xmlName: string;
  result: PracticalResult;
  applicable: boolean;
  what?: string;
  recommendation?: string;
}

export interface QualityEvidence {
  xmlName: string;
  rating: QualityRating;
  comment?: string;
}

export type EvidenceKind = "KEEP" | "Priority Improvement" | "Possible Blocker" | "Difficult Activity" | "Best Decision Activity" | "Workplace Use" | "Support Need" | "Recommendation";

export interface QualitativeEvidence {
  id: string;
  reviewId: string;
  testerId: string;
  course: Course;
  kind: EvidenceKind;
  domain: QualityDomain | "Cross-cutting";
  sourceField: string;
  excerpt: string;
  rating?: QualityRating;
}

export interface FinalReview {
  id: string;
  sourceId: string;
  sourceUuid: string;
  submittedAt: string;
  editedAt?: string;
  testerId: string;
  course: Exclude<Course, "hub">;
  device: string;
  internet: string;
  completion: string;
  practical: PracticalEvidence[];
  quality: QualityEvidence[];
  qualitative: QualitativeEvidence[];
  possibleBlocker: "yes" | "no" | "not_sure";
  actionRecommendation: typeof ACTION_DECISIONS[number];
  readinessRecommendation: ReadinessDecision;
}

export interface QuickFinding {
  id: string;
  sourceId: string;
  submittedAt: string;
  testerId: string;
  course: Course;
  stableId: string;
  whatHappened: string;
  recommendation: string;
  screenshot?: string;
}

export type FindingStatus = "New" | "Under Review" | "Action Agreed" | "In Progress" | "Ready for Verification" | "Verified Closed" | "Not an Issue";

export interface Finding {
  id: string;
  course: Course;
  domain: string;
  evidence: string;
  sourceRecordIds: string[];
  recordCount: number;
  recurrence: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  blockerClassification: "Confirmed blocker" | "Possible blocker" | "Not a blocker" | "Needs triage";
  interpretation: string;
  actionDecision: typeof ACTION_DECISIONS[number];
  recommendedAction: string;
  priority: "Low" | "Medium" | "High";
  owner: string;
  targetTiming: string;
  status: FindingStatus;
  verification: string;
  responseArea: string;
  findingType: string;
  decisionHorizon: DecisionHorizon;
  history: { at: string; event: string }[];
}

export interface HumanReadinessDecision {
  course: Course;
  decision: ReadinessDecision;
  reason: string;
  owner: string;
  date: string;
}
