# Instructions for coding agents

## Mission
Build a polished, accessible, decision-oriented DEC Internal Pilot Analytics Dashboard from the evidence model in this repository.

## Non-negotiable source discipline
- Treat the files in `docs/`, `forms/` and `analysis/` as the authoritative functional source.
- Do not replace the pilot method with a generic survey/dashboard model.
- Do not rename Kobo/XML variables casually; preserve traceability to source records.
- Do not modify source DOCX/XLSX files as part of application implementation.
- Report contradictions/version issues instead of silently reconciling them.

## Evidence architecture - preserve exactly
- Practical Check: `PASS | PASS WITH ISSUE | FAIL | NOT TESTED`
- Quality Review: `0 BLOCKED | 1 FRAGILE | 2 WORKABLE | 3 STRONG | NOT TESTED / N/A`
- Action Decision: `Fix Now | Improve Before Wider Use | Retain as Designed | Investigate Further | Consider for a Later Phase`
- Readiness Decision: `READY | READY WITH MINOR IMPROVEMENTS | HOLD - CORRECT IMPORTANT ISSUE(S) FIRST | INSUFFICIENT EVIDENCE - NEED MORE TESTING`

Never merge these into one score. Do not calculate one overall pilot score.

## Readiness rules
- Readiness means readiness to proceed to the **selected-CSO pilot**, not permanent/final release.
- Keep Learning Hub, HRBA Course and Project Management Course readiness separate.
- Critical evidence includes access, account/learner separation, progression, persistence, assessment, completion and certificate.
- Historical blockers remain visible.
- A blocker verified closed no longer counts as unresolved.
- Positive visual/context ratings cannot offset a critical learner-journey failure.
- DEC's final readiness decision remains human and separately recorded.

## Decision Horizon - first-class dimension
- During internal pilot
- Before selected-CSO pilot
- Validate during selected-CSO pilot
- Before wider release
- Later programme / phase
- Retain / no change

## Data integration
- Verify current official KoboToolbox API documentation before implementation.
- Kobo credentials/tokens must remain server-side.
- Sync must be idempotent, support pagination and edited submissions, prevent duplicates, and expose last-sync state plus manual refresh.
- Prefer a normalized data layer rather than charting directly from Excel exports.
- Preserve raw source identifiers and source-text evidence for drill-through.
- Do not write dashboard data into the DEC Learning Hub learner/auth/progress tables. If shared infrastructure is used, isolate the dashboard schema/tables.

## UX
- Landing page is a decision-focused executive overview, not a wall of charts.
- Every metric/visual must answer a pilot decision question and provide drill-through to evidence.
- Show denominators/evidence counts with percentages.
- Distinguish no evidence from a positive result.
- Give qualitative evidence equal status: searchable/filterable source excerpts, KEEP, priority improvement, possible blocker, practical-use examples and support needs.
- Avoid generic admin-template aesthetics, decorative charts, word clouds as the primary qualitative method, 3D charts and gauges without decision value.
- Use DEC brand assets/tokens from `assets/brand/`.
- Accessibility: keyboard, screen-reader-friendly semantics, sufficient contrast, not color-only, responsive layouts and readable chart alternatives.

## Required first response before major coding
Return a concise plan covering:
1. exact form fields/data mapping;
2. proposed integration architecture;
3. database/raw-normalized/action model;
4. page/navigation map;
5. readiness-rule implementation;
6. qualitative-data treatment;
7. source contradictions/version issues;
8. credentials/configuration needed later.

Then proceed to implementation unless blocked by a genuinely required credential or destructive infrastructure decision.

## Project account and infrastructure identity lock

This repository is the `Internal-pilot-dashboard` project and must use only the following project-owned identities and targets:

- Primary project email and required Git email: `tbeyene972@gmail.com`
- Supabase project ref: `xkmkowmigupwotuphels`
- Supabase project URL: `https://xkmkowmigupwotuphels.supabase.co`
- Required GitHub account: `Girum-Beyene`
- Required GitHub repository: `Girum-Beyene/Internal-pilot-dashboard-`
- Required Git remote: `https://github.com/Girum-Beyene/Internal-pilot-dashboard-.git`
- Required Vercel account: `tbeyene972-6860`
- Required Vercel team: `internal-pilot-dashboard`

Before any Supabase, GitHub, Vercel, browser-authenticated, or deployment action, verify the visible/configured target and authenticated account. Continue only on an exact match. If the identity differs or cannot be verified, stop and request human authentication or account switching; never select a previously signed-in identity for convenience. Never request secrets in chat or print, log, commit, or document secret values.

Before any GitHub initialization, remote change, branch creation, push, pull request, or repository action, inspect repository state, `git remote -v`, and the authenticated GitHub identity when available. Require account `Girum-Beyene` and require `origin` to point only to `Girum-Beyene/Internal-pilot-dashboard-`.

Before any Vercel link, project creation, environment-variable change, deployment, or domain action, require account `tbeyene972-6860`, team `internal-pilot-dashboard`, and a project owned by that team.

Do not use credentials, accounts, organizations, teams, repositories, Supabase projects or Vercel projects inherited from other DEC/CSO Learning Hub work. This project has its own account boundary.
