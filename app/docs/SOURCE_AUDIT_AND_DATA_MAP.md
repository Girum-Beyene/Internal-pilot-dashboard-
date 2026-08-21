# Source audit and exact Kobo data map

Audited 19 August 2026 against the approved attached v2.1 XLSForms, authenticated deployed Kobo definitions, the Implementation Guide, Quick Reference, HRBA/PM Capacity-to-Action annexes, Analysis & Action workbook, and Coordination Tracker. The current authoritative instruments are `DEC_Internal_Pilot_Quick_Finding_XLSForm_v2_1_20260819.xlsx` and `DEC_Internal_Pilot_Final_Course_Review_XLSForm_v2_1_20260819.xlsx`, both version `20260819_v2_1`. Field names, types, choices, required/relevant/calculation rules and form IDs match their deployed assets exactly. `SOURCE_MANIFEST.json` records their hashes. Original v2.0 XLSForms remain unchanged for historical traceability only.

## Authenticated deployed-definition verification

### Quick Finding deployment — content hash `cc01c0cf2c8835199625403dd0afab5792297808`

Authoritative fields: hidden required `tester_id`; required `observation_location` with exact codes `hub`, `hrba`, `pm`; required `stable_id`; required `what_happened`; required `recommendation`; optional image `screenshot`. `identity_missing` is shown when the hidden tester ID is empty, so Hub URL prefilling of `d[tester_id]` is required. `urgent_note` is guidance only.

Quick Finding v2.1 intentionally contains no participant blocker/category/device fields. The retired v2.0 fields are `issue_device_browser`, `finding_category`, `finding_category_other`, `blocker_flag`, and `blocker_note`. Their absence means “not collected,” never `yes`, `not_sure`, or any inferred classification. A Quick Finding is event-level qualitative evidence. Possible-blocker evidence comes only from Final Review `j_possible_blocker` or a DEC analyst Finding/Blocker classification.

### Final Review deployment — content hash `f7f600283e56609bde2ab45837d1cee4dbc30856`

All 203 authoritative v2.1 named rows match the deployment. `tester_id` and `course` are hidden and required; `review_key` remains `concat(${tester_id}, '-', ${course})`; course codes remain `hrba`, `pm`. Hub prefilling of both `d[tester_id]` and `d[course]` is required.

All B01–B16 practical XML names, assigned-check relevance, `pass`, `pass_issue`, `fail`, `not_tested`, critical NOT TESTED explanation logic, Quality Judgment XML names/codes, action codes and readiness codes match. HRBA fields remain inside `sec_e_hrba` with `${course} = 'hrba'`; PM fields remain inside `sec_e_pm` with `${course} = 'pm'`.

All 43 Quality Judgment comment fields intentionally appear only for `blocked_0` or `fragile_1`. A `workable_2` rating does not require or expose an indicator comment. This burden-reduction rule is authoritative; separate open-text fields remain available and are preserved as qualitative evidence.

## Kobo system fields

For both assets ingest `_id`, `_uuid`, `_root_uuid` when present, `_submission_time`, `_last_edited`, `start`, `end`, form/asset UID and asset `version__content_hash`. Stable database identity is `(source_asset_uid, _id)`; UUIDs, timestamps, payload hash and raw payload are retained.

## Quick Finding — `dec_internal_pilot_quick_finding`

| XML name | Normalized destination | Meaning |
|---|---|---|
| `tester_id` | `quick_findings.tester_id` | agreed tester identifier |
| `observation_location` | `observation_location` | `hub`, `hrba`, `pm` |
| `stable_id` | `stable_id` | module/screen/activity/stable ID |
| `what_happened` | `what_happened` | exact event-level observation |
| `recommendation` | `recommendation` | tester recommendation |
| `screenshot` | `screenshot_ref` | private media reference only |

No Quick Finding field supplies participant blocker classification. Missing/absent legacy blocker data is not a negative or positive value; it is simply not collected.

## Final Review — `dec_internal_pilot_final_review_readiness`

Context: `review_key`, `tester_id`, `course`, `testing_role`, `assigned_activation_check`, `assigned_course_separation_check`, `assigned_second_device_check`, `assigned_post_completion_check`, `assigned_cross_user_check`, `main_device`, `additional_check`, `additional_device_browser`, `internet_experience`, `completion_amount`, `learner_status`.

Practical checks become one `practical_checks` row per applicable review/check. Each result XML name also maps its exact `${name}_what` and `${name}_recommend` text. Assigned relevance is preserved for B01, B04, B13, B14 and B16; blank hidden checks are not interpreted as NOT TESTED.

| ID | XML name | Coverage | Critical allocation |
|---|---|---|---|
| B01 | `b01_account_activation` | assigned | Hub |
| B02 | `b02_sign_in` | core | Hub |
| B03 | `b03_course_access` | core | Hub |
| B04 | `b04_course_separation` | assigned | Hub |
| B05 | `b05_start_resume` | core | Course |
| B06 | `b06_required_gating` | core | Course |
| B07 | `b07_correct_progression` | core | Course |
| B08 | `b08_progress_persistence` | core | Hub |
| B09 | `b09_device_use` | core | development evidence |
| B10 | `b10_media` | core | development evidence |
| B11 | `b11_final_assessment` | core | Course |
| B12 | `b12_completion_certificate` | core | Hub and course journey |
| B13 | `b13_return_completed` | assigned | Hub |
| B14 | `b14_cross_user` | assigned | Hub |
| B15 | `b15_feedback_support` | core | operational evidence |
| B16 | `b16_second_device` | assigned | development evidence |

`b_critical_not_tested_reason` is normalized as qualitative evidence and attached to the source review.

Quality ratings become one `quality_ratings` row per applicable indicator. Exact rating codes are retained (`blocked_0`, `fragile_1`, `workable_2`, `strong_3`, `not_tested`) and displayed as the authoritative labels. A `${name}_comment` becomes linked qualitative evidence when collected for `blocked_0` or `fragile_1`; `workable_2` requires no comment.

| Domain | Exact rating XML names |
|---|---|
| Access & Entry | `c01_enter_hub`, `c02_activation_signin`, `c03_find_continue`, `c04_progress_learner`, `c05_leave_return`, `c06_device_browser` |
| Learning Experience | `d01_instructions`, `d02_navigation`, `d03_required_optional`, `d04_readability`, `d05_pacing`, `d06_corrective_feedback`, `d07_mobile_learning` |
| Learning & Better Decisions — common | `e01_understanding`, `e02_judgment`, `e03_feedback_decisions`, `e04_progressive_application`, `e05_assessment_alignment` |
| HRBA only (`course='hrba'`) | `eh01_roles`, `eh02_power_inclusion`, `eh03_design`, `eh04_implementation`, `eh05_meal` |
| PM only (`course='pm'`) | `ep01_purpose_results`, `ep02_roles`, `ep03_planning`, `ep04_risk_change`, `ep05_monitor_adapt`, `ep06_closure` |
| Context & Relevance | `f01_language`, `f02_cases`, `f03_adaptability`, `f04_respectful_inclusion`, `f05_realistic_constraints` |
| Application & Transfer | `g01_workplace_use`, `g02_tool_adapt`, `g03_decision_connection` |
| DEC Operational Readiness | `h01_support`, `h02_records`, `h03_feedback_route`, `h04_common_difficulties`, `h05_manageability`, `h06_evidence_use` |

Standalone open text: `c_access_improvement`, `d_difficult_screen`, `e_best_decision_activity`, `f_realistic_relevant`, `f_unrealistic_unclear`, `g_practical_example`, `g_support_needs`, `g_support_other`, `h_staff_support_improvement`, `i_missing_add`, `i_confusing_change`, `i_rating_explain`, `j_keep`, `j_priority_improvement`, `j_blocker_explain`, `l_readiness_reason`. Instrument flags: `i_missing_issue`, `i_confusing_question`, `i_difficult_rating`. Final evidence/recommendations: `j_possible_blocker`, `k_action`, `l_readiness`.

## DEC action and decision layer

`findings`: Finding ID, Course/Hub, Domain, Evidence, evidence count, recurrence, Severity, Blocker Classification, Interpretation, Action Decision, Recommended Action, Priority, Responsible Person/Unit, Target Timing, Status, Verification/Result, Response Area, Finding Type and Decision Horizon. `finding_sources` supports multiple immutable source links; `finding_history` stores status/action snapshots. `readiness_decisions` stores separate Hub/HRBA/PM human decisions.

## Coordination mapping

The optional future import maps Tester Plan fields (tester ID/name, organisation/unit, assigned course, learner type, primary/secondary device assignment, additional focus, target completion, status, note), Progress Monitor fields (registration through certificate, Quick Finding activity, Final Review receipt and unresolved possible blocker), and Support Log fields. They remain operational coverage/support evidence and never become a quality score.

## Contradictions and implementation decisions

1. The task brief says `KOBO_QUICK_FORM_UID`; repository configuration says `KOBO_QUICK_FINDING_FORM_UID`. The latter is canonical; the former is accepted only as an alias.
2. The workbook's Hub panel counts all Final Reviews as Hub evidence. The app documents this dependency and evaluates Hub learner-journey checks across course reviews; it never implies a separate Hub review exists.
3. Workbook formulas allocate activation/sign-in/separation/learner-linked records mainly to Hub and course progression/assessment mainly to course panels; B12 participates in both. The normalized check catalog makes this allocation explicit.
4. `Indicator_Summary` includes an average (0–3). It is descriptive workbook support, not a readiness score. The UI uses labeled distributions and denominators and does not expose a composite pilot score.
5. Source documents use typographic em dashes in readiness wording while XLSForm/database-safe values use hyphens. Display text follows the required authoritative decision labels; source codes remain traceable.
6. The connected Vercel team (`esset-lab`) reports the Hobby plan, and this folder is not linked to a Vercel project. The unsupported two-minute cron was replaced with a daily 01:00 UTC reconciliation schedule. Kobo REST Services deliver new submissions; manual Refresh and the Kobo v2 worker reconcile edits/misses.
7. v2.1 makes Quick/Final `tester_id` and Final `course` hidden and required. The identity architecture is compatible with dashboard keys when Hub links prefill the exact fields. The former visible v2.0 fields remain documented only through the historical workbooks.
8. `review_key=concat(tester_id, '-', course)` expresses one current Final Review per tester/course but does not prevent repeat submissions. Raw and normalized versions remain preserved; current dashboard calculations select the latest edited/submitted review for each stable tester/course pair.
9. Quick Finding v2.1 deliberately removed five v2.0 fields. The dashboard v2.1 model does not normalize or count them; blocker classification must be explicit in Final Review or recorded by DEC after evidence review.
10. Final Review v2.1 deliberately narrows Quality Judgment comment relevance to blocked/fragile. This is accepted as the current burden-reduction method; workable ratings remain valid evidence without a comment.
