# DEC Internal Pilot Analytics Dashboard - Initial Repository

This repository is the implementation starting point for a real-time / near-real-time analytics and decision dashboard for the **DEC CSO Learning Hub Internal Pilot and Course Validation process**.

The repository intentionally contains the authoritative pilot documents, Kobo XLSForms, analysis/coordination workbooks, brand assets and implementation specifications **before application code is scaffolded**. A coding agent should study these sources first, propose the smallest reliable architecture, then implement the dashboard in `app/`, database assets in `database/`, and synchronization/import utilities in `scripts/`.

## Start here

1. Read `AGENTS.md`.
2. Read `docs/DEC_Internal_Pilot_Implementation_and_Course_Validation_Guide.docx` and `docs/DEC_Internal_Pilot_Quick_Reference.docx`.
3. Inspect both XLSForms in `forms/`, including exact XML/question names, choices and skip logic.
4. Inspect `analysis/DEC_Internal_Pilot_Analysis_Action.xlsx` for the Finding-to-Action, Decision Horizon and readiness logic.
5. Inspect `analysis/DEC_Internal_Pilot_Coordination_Tracker.xlsx` for tester coverage/progress/support coordination.
6. Use the two Capacity-to-Action annexes to understand course-specific interpretation, especially Learning & Better Decisions and Application & Transfer.
7. Read all files in `specs/` before coding.
8. Produce a short architecture/data-map/UI plan and contradiction/version report; then implement unless a genuine credential or destructive infrastructure decision requires user input.

## Authoritative source files

### Pilot implementation and course design
- `docs/DEC_Internal_Pilot_Implementation_and_Course_Validation_Guide.docx`
- `docs/DEC_Internal_Pilot_Quick_Reference.docx`
- `docs/Annex_A_HRBA_Capacity_to_Action_Needs_Analysis_and_Design_Framework.docx`
- `docs/Annex_B_Project_Management_Capacity_to_Action_Design_Brief.docx`

### Kobo forms
- `forms/DEC_Internal_Pilot_Final_Course_Review_XLSForm_v2_1_20260819.xlsx` (current authoritative)
- `forms/DEC_Internal_Pilot_Quick_Finding_XLSForm_v2_1_20260819.xlsx` (current authoritative)
- Original v2.0 workbooks remain in `forms/` for historical traceability only.

### Analysis and coordination
- `analysis/DEC_Internal_Pilot_Analysis_Action.xlsx`
- `analysis/DEC_Internal_Pilot_Coordination_Tracker.xlsx`

### Brand assets
- `assets/brand/dec-logo.png`
- `assets/brand/LOGO_STRIP_P_MED.png`
- `assets/brand/brand-tokens.json`

## Core principle

**Kobo supplies evidence -> the dashboard organises and analyses it -> DEC records findings/actions and makes readiness decisions. The application must never replace DEC's decision-making with one automated score.**

## Suggested implementation direction

Preferred starting hypothesis: secure server-side Kobo API integration, normalized application data store, Next.js/TypeScript dashboard, and Vercel deployment. Supabase is a practical candidate for the normalized/action store. This is a recommendation, not a blind requirement: verify current official Kobo API capabilities and confirm the simplest reliable stack before committing.
