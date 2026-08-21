# Implementation acceptance criteria

## Source fidelity
- Exact XLSForm/XML field names are mapped and documented.
- HRBA and PM skip logic is respected.
- Practical Check, Quality Review, Action Decision and Readiness Decision remain separate.
- No overall pilot score exists.
- Decision Horizon is first-class in findings and analysis.

## Data integration
- A Kobo-shaped synthetic submission can sync without duplication.
- Edited submissions update correctly.
- Pagination is handled.
- Failed Kobo access produces a visible error/degraded state, not silent stale data.
- Manual refresh and last-sync time work.
- No secret is exposed to the browser or committed to git.

## Analytics
- Executive page answers the five core decision questions.
- Hub, HRBA and PM readiness are separate.
- Critical evidence gaps are visible.
- Practical checks drill through to source records.
- Six quality domains drill through to indicators and comments.
- HRBA/PM course-specific indicators are separated appropriately.
- Qualitative evidence is searchable/filterable and linked to source records.
- Important evidence can be promoted into Finding-to-Action with source links.

## Finding-to-Action
- User can create/update a finding, set severity/blocker/finding type/response area/Decision Horizon/action/owner/timing/status and verification.
- Verified Closed critical issues remain in history but no longer count unresolved.
- Human DEC final readiness decision is stored separately from calculated evidence signals.

## UX/accessibility
- DEC branding is correctly applied without logo-heavy layout.
- Desktop/laptop experience is polished; tablet/mobile remain usable.
- Keyboard navigation, focus visibility, semantic structure and sufficient contrast are verified.
- Color is never the only status signal.
- No-data states are useful and do not imply success.

## End-to-end test
Demonstrate: synthetic Kobo submission -> sync -> normalization -> visualization -> drill-through -> promote to Finding-to-Action -> assign Decision Horizon -> verify/close finding -> readiness evidence signal updates.
