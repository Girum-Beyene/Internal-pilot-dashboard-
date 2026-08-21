# Master task for a high-intelligence coding agent

Design and implement a production-quality, near-real-time **DEC Internal Pilot Analytics & Decision Dashboard** from this repository.

Before coding, inspect every authoritative source file in `docs/`, `forms/` and `analysis/`. Derive the exact field/data map, skip logic, scales, critical checks, six quality domains, course-specific HRBA/PM indicators, Finding-to-Action structure, Decision Horizons and readiness logic. Do not turn this into a generic survey dashboard and do not modify the source documents/workbooks.

First return a concise implementation plan covering: exact Kobo fields to ingest; current official Kobo integration approach; normalized/raw/action data model; application stack and deployment; page/navigation map; readiness-rule implementation; qualitative-evidence approach; security/access model; contradictions/version issues; and credentials/configuration required later. Then proceed to scaffold and implement the application unless a genuinely required credential or destructive infrastructure decision requires input.

Preferred starting architecture is secure server-side Kobo API integration -> normalized application store -> Next.js/TypeScript dashboard -> Vercel, with Supabase as a practical normalized/action store. Verify current official Kobo documentation before committing. Keep all Kobo/service-role secrets server-side. Sync must be idempotent, support pagination and edited submissions, prevent duplicates, preserve source identifiers, expose last-sync status and offer manual refresh. Keep the dashboard isolated from DEC Learning Hub learner/auth/progress data.

The landing page must answer: Do we have enough evidence? Is anything blocking the selected-CSO pilot? Where is experience fragile? What must DEC act on before the next stage? What can wait? Build focused drill-down pages for coverage/progress, practical checks, quality review, Learning & Better Decisions, context/application/transfer, findings/blockers, Finding-to-Action, qualitative evidence, and readiness/decision record.

Preserve the evidence architecture exactly and never collapse it into one score. Keep separate readiness for Learning Hub, HRBA and Project Management. Historical blockers remain visible; verified-closed blockers stop counting unresolved. Missing evidence must not become a pass. DEC makes the final readiness decision.

Use DEC brand assets and tokens in `assets/brand/`. Build a clear, purpose-driven, accessible analytics product rather than a generic admin template. Treat qualitative open-text evidence as first-class: searchable source excerpts, KEEP, priority improvements, possible blockers, practical-use examples, support needs and promote-to-finding workflow. AI-assisted thematic summaries, if added, are optional and must never replace source evidence or human readiness decisions.

Read `AGENTS.md` and all files in `specs/` as implementation requirements and acceptance criteria.
