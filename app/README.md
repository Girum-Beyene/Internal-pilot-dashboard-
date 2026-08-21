# DEC Internal Pilot Analytics & Decision Dashboard

Production-oriented Next.js application for organizing Kobo evidence, preserving the pilot's separate evidence scales, and recording DEC findings/actions/readiness decisions. The default UI uses conspicuously labelled removable sample fixtures until a live store is configured.

## Run locally

```powershell
pnpm install
pnpm dev
```

Open `http://localhost:3000`. Production verification: `pnpm build`.

## Environment

Copy the repository `.env.example` to `app/.env.local`. Required for live sync:

- `KOBO_BASE_URL`, normally `https://kf.kobotoolbox.org` or the EU server origin.
- `KOBO_API_TOKEN` (server only).
- `KOBO_REVIEW_FORM_UID` and `KOBO_QUICK_FINDING_FORM_UID` (`KOBO_QUICK_FORM_UID` is accepted as a compatibility alias).
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (server only), and `SUPABASE_SCHEMA=dec_pilot`.
- `KOBO_REVIEW_FORM_URL`, `KOBO_REST_USERNAME` and `KOBO_REST_PASSWORD` for prefilled Final Review links and new-submission delivery.
- `CRON_SECRET`, a high-entropy value.
- `TESTER_SESSION_SECRET`, `ANALYST_SESSION_SECRET`, optional `SESSION_ISSUER`, and `APP_ADMIN_EMAILS` for signed identity handoffs.
- `NEXT_PUBLIC_DATA_MODE=live` after schema, credentials and identity are verified. Keep `sample` during local fixture testing.

Never prefix a Kobo, Supabase, cron or session credential with `NEXT_PUBLIC_`. The browser receives no Supabase key.

## Database and isolation

Run `../database/001_dec_pilot_schema.sql` and then `../database/002_activation_security.sql` in the intended Supabase project after review. They create only the dedicated `dec_pilot` schema, enable RLS, revoke `public`/`anon`/`authenticated` access, and retain service-role access for the verified application server. No query, foreign key, or trigger touches Learning Hub learner/auth/progress/assessment/completion/certificate tables.

## Kobo synchronization

`POST /api/sync` supports an authorized manual refresh; Vercel Cron uses `GET /api/sync`. The worker:

1. reads asset metadata and stores the Kobo content/version hash;
2. follows every v2 `next` pagination link (page limit 1,000);
3. re-reads current records so edited submissions are detected, hashes payloads, and upserts by `(source_asset_uid, source_submission_id)`;
4. preserves raw JSON and exact XML leaf names, including group-prefixed Kobo keys;
5. replaces/merges normalized review, practical, quality and qualitative rows idempotently;
6. records successful/degraded sync state and retries transient Kobo failures with bounded backoff.

Kobo REST Services send new records to `POST /api/kobo/rest/quick` and `/api/kobo/rest/review` using HTTP Basic authentication. They do not propagate edits, so the v2 worker remains authoritative reconciliation. Private screenshots are streamed through an ownership/analyst-authorized server proxy; raw download URLs and the Kobo token are never exposed.

The authoritative Kobo instruments are version `20260819_v2_1`. Quick Findings are minimal event-level qualitative observations and collect no participant blocker flag, category or device field. Missing legacy Quick fields never imply a blocker. Possible-blocker evidence comes from Final Review `j_possible_blocker` or a DEC analyst classification. Final Review indicator comments are collected only for `blocked_0` and `fragile_1`; `workable_2` requires no comment.

The detected Vercel team plan is Hobby. The included schedule therefore reconciles daily at 01:00 UTC; REST delivery and authorized **Refresh now** cover the faster paths. Do not expose `CRON_SECRET` to the browser.

## Authorization boundary

The sync route accepts either Vercel's `Authorization: Bearer $CRON_SECRET` or a signed DEC analyst/admin session. Analyst and tester handoff routes exchange short-lived signed handoffs for HttpOnly cookies. Client-supplied identity headers are not authorization. `/my-findings` derives an exact tester filter from the verified session and exposes no aggregate evidence, actions or readiness. See `docs/TESTER_IDENTITY_AND_INGESTION.md`.

## Readiness logic

Calculated signals remain separate for Learning Hub, HRBA and Project Management. They are evidence prompts, not DEC decisions:

- HOLD: unresolved confirmed critical blocker, or critical FAIL/blocker evidence not yet triaged into a finding.
- INSUFFICIENT EVIDENCE: no relevant Final Review or a required critical check has no tested evidence.
- READY WITH MINOR IMPROVEMENTS: no critical blocker, but critical PASS WITH ISSUE, fragile/blocked quality evidence, or an open High action due now/before selected-CSO remains.
- READY: required learner journeys have evidence and no blocking/immediate improvement signal remains.

Historical blockers stay visible. `Verified Closed` and `Not an Issue` stop counting as unresolved. Quality ratings never offset a failed critical learner journey. The Readiness page records DEC's human decision, reason, owner/group and date separately.

## Fixtures and removal

`src/lib/fixtures.ts` is synthetic and always accompanied by a SAMPLE DATA banner. Set `NEXT_PUBLIC_DATA_MODE=live` only after the authenticated `/api/evidence` and `/api/findings` routes pass deployment verification. The raw Kobo-shaped samples in `../fixtures/` contain no real tester information.

## Official integration references

- Kobo v2 migration and paginated submission endpoint: https://support.kobotoolbox.org/migrating_api.html
- Kobo API entry point and interactive v2 schema: https://support.kobotoolbox.org/api.html
- Kobo REST Services: https://support.kobotoolbox.org/rest_services.html
- Kobo web-form prefilling: https://support.kobotoolbox.org/data_through_webforms.html
- Kobo edit behavior: https://support.kobotoolbox.org/editing_deleting_data.html
- Vercel Cron authorization: https://vercel.com/docs/cron-jobs/manage-cron-jobs
- Vercel Cron plan limits: https://vercel.com/docs/cron-jobs/usage-and-pricing
