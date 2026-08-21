# Data and decision model

## Source layers

### Kobo - Quick Finding
Short repeated incident/observation capture. One submission = one important observation. Core source fields include tester identifier, observation location, screen/activity/stable ID, optional device/browser, what happened, recommendation, optional category, optional screenshot and possible-blocker flag.

### Kobo - Final Internal Pilot Review
One course-level review per tester/course. Contains test context, practical learner-journey checks, six quality domains, HRBA/PM-specific decision indicators, application/transfer, DEC operational readiness, instrument feedback, final reflection, action recommendation and readiness recommendation.

### DEC Coordination Tracker
Tester assignments, progress monitoring and support patterns. It is operational coordination evidence, not a quality score.

### DEC Analysis & Action
Current analytical reference: Indicator Summary, Finding-to-Action, separate Readiness Summary and Instrument Feedback. Use it to reproduce the intended logic in the application, not to create a live Excel dependency.

## Recommended application storage layers
1. `raw_kobo_submissions` - immutable-ish source snapshots/payloads and source metadata.
2. `quick_findings` - normalized Quick Finding records.
3. `final_reviews` - normalized review/test-context records.
4. `practical_checks` - one row per review/check with exact practical result.
5. `quality_ratings` - one row per review/indicator/domain rating with course-specific applicability.
6. `qualitative_evidence` - normalized open text with source field, domain/category and source record id.
7. `findings` + `finding_sources` - DEC's significant Finding-to-Action layer.
8. `actions` / finding action fields - owner, timing, status and verification.
9. `readiness_decisions` - separate human decisions for Hub, HRBA and PM.
10. optional coordination/support tables if the app replaces spreadsheet coordination later.

## Non-negotiable scales

### Practical Check
- PASS
- PASS WITH ISSUE
- FAIL
- NOT TESTED

### Quality Review
- 0 BLOCKED
- 1 FRAGILE
- 2 WORKABLE
- 3 STRONG
- NOT TESTED / N/A

### Action Decision
- Fix Now
- Improve Before Wider Use
- Retain as Designed
- Investigate Further
- Consider for a Later Phase

### Readiness Decision
- READY
- READY WITH MINOR IMPROVEMENTS
- HOLD - CORRECT IMPORTANT ISSUE(S) FIRST
- INSUFFICIENT EVIDENCE - NEED MORE TESTING

## Finding-to-Action fields
- Finding ID
- Course / Hub
- Domain
- Evidence
- Source record IDs
- Number of testers / records
- Pattern / recurrence
- Severity
- Blocker classification
- Interpretation
- Decision category
- Recommended action
- Priority
- Responsible person / unit
- Target timing
- Status
- Verification / result
- Response area
- Finding type
- Decision horizon

## Decision Horizon
- During internal pilot
- Before selected-CSO pilot
- Validate during selected-CSO pilot
- Before wider release
- Later programme / phase
- Retain / no change

## Readiness behavior
- Calculated evidence signals may support review but do not replace DEC's final decision.
- Keep Hub/HRBA/PM separate.
- Historical blocker reports stay visible.
- Verified Closed critical actions no longer count unresolved.
- Unresolved confirmed critical actions, untriaged critical evidence and unresolved High actions due now/before selected-CSO pilot may affect the signal.
- Missing required evidence produces insufficient-evidence behavior, not an implicit pass.
