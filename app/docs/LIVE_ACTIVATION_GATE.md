# LIVE ACTIVATION GATE — 21 August 2026

**Current operational status: LIVE RUNTIME CONFIGURED; CONTROLLED REHEARSAL PENDING.** Production `NEXT_PUBLIC_DATA_MODE` is `live`; the public real dashboard remains empty until authenticated Kobo submissions are received. `/simulation` remains a separately routed synthetic dataset. No secret or authorization value is recorded in this file.

## 21 August 2026 operational activation update

- Verified the required Vercel account (`tbeyene972-6860`), team (`internal-pilot-dashboard`) and linked Production project before configuration.
- Verified both deployed EU Kobo v2.1 assets by their locked UIDs. Each now has one active JSON REST Service using Basic authentication and targeting only its approved Production ingestion route: Quick Finding → `/api/kobo/rest/quick`; Final Review → `/api/kobo/rest/review`.
- Created/rotated the REST credentials directly into the Production Vercel environment as sensitive variables and patched both Kobo service settings in the same private process. Values were neither displayed nor committed.
- Pushed the Production configuration activation through `main`; Vercel automatically deployed it successfully to the Production aliases.
- Production smoke check PASS: public real route returns its zero-evidence shell with no fixture record; `/simulation` retains its simulation banner; desktop and 390px mobile widths have no horizontal overflow or browser runtime errors. The service-role `dec_pilot` path returns HTTP 200 and all four live-ingestion tables checked are presently empty.
- Controlled data submission, attachment verification, reconciliation-after-edit, duplicate verification and dashboard evidence confirmation were pending before Kobo public-submission access was enabled; the subsequent browser-form result is recorded below.

## Controlled live rehearsal result — 21 August 2026

- Kobo public-submission access was subsequently enabled and the Quick Finding web form was submitted through its normal browser flow with a harmless PNG attachment. Kobo assigned `_id` `811536188`; the configured Quick REST Service recorded a single successful delivery (HTTP 202, one try), and `dec_pilot.raw_kobo_submissions` plus `dec_pilot.quick_findings` contain one record for the locked Quick asset UID. Screenshot metadata is retained in `quick_findings.screenshot_ref`.
- This is **not an acceptable completed pilot record**: the deployed Quick form ignored its documented `d[tester_id]` URL prefill, displayed its own identity-missing warning, and serialized `tester_id` as null. The controlled observation, location, recommendation, stable Kobo `_id`, and attachment metadata are present, but stable tester identity is not.
- The deployed Final Review web form was independently checked with the documented `d[tester_id]` and `d[course]` parameters. It displayed its identity/course-missing warning and did not receive either hidden value. No Final Review was submitted, because doing so would create invalid readiness evidence.
- Consequently, do not treat this as a completed end-to-end rehearsal. Do not submit additional pilot evidence through these web-form URLs until the Kobo prefill behavior is corrected and the corrected deployment is reverified. The controlled Quick record is retained and clearly identifiable for auditability; no deletion was attempted.

## Prefill diagnosis — 21 August 2026

- The Quick Finding deployment has a top-level hidden `tester_id`; its Collect Data entry URL is `https://ee-eu.kobotoolbox.org/a8OBAHax` (the `/x/` URL is the offline-capable route). Direct prefill at the Collect Data URL succeeds.
- The Final Review deployment has hidden `tester_id` and `course` within `sec_a`, not at the form root. Its Collect Data entry URL is `https://ee-eu.kobotoolbox.org/61nQdMoN`; the correct deployed prefill keys are `d[sec_a/tester_id]` and `d[sec_a/course]`. Direct qualified prefill succeeds and activates the PM branch.
- The dashboard link builder is corrected to preserve existing query parameters, convert an accidental Kobo `/x/` URL to the data-entry route, and use the deployed `sec_a` names. No XLSForm revision or redeployment is required.

## Frozen baseline

- Workspace: `D:\Internal-pilot-dashboard`; application: `D:\Internal-pilot-dashboard\app`.
- Version control: this folder is not a Git repository, so there is no branch or SHA to record.
- Authoritative source state: all 12 manifest hashes match. The two dated v2.1 XLSForms are current; original v2.0 files are immutable historical traceability records.
- Pre-change verification: lint PASS; 7/7 tests PASS; production build PASS.
- v2.1 alignment verification: XLSForm contract test PASS (11 Quick rows, 203 Final Review rows, 43 blocked/fragile comment rules); 14/14 application tests PASS; lint PASS; production build PASS.
- 21 August Supabase pass: configured API and database targets both match required project ref `xkmkowmigupwotuphels`; migrations 001 and 002 were applied in order with `ON_ERROR_STOP=1`; remote catalog and security verification PASS. Static migration/security contract PASS; XLSForm contract PASS; 14/14 application integration tests PASS; lint PASS. The production build failed only because outbound access to Google Fonts was denied while fetching Geist, not because of an application-code error.
- Responsive browser check: all ten analyst pages at 1440×900 and 390×844 PASS with zero horizontal overflow. Tester view at 390×844 PASS, including own-record display, PM empty state, prefilled Final Review links and no aggregate/readiness content.
- Screenshot baseline:
  - `C:\Users\Omen\.codex\visualizations\2026\08\18\01a01718-62ce-7161-935c-17276f9fab5c\dec-overview-final.png` — SHA-256 `2b1663492bc9ad8db2d2383689cba01edce3d561009af7caecc512e91853a0fa`.
  - `C:\Users\Omen\.codex\visualizations\2026\08\18\01a01718-62ce-7161-935c-17276f9fab5c\dec-mobile-final.png` — SHA-256 `9c53a4d7ee6da44a101ddc2da51ed4f7ac524212b0b9daf544865c2816662d79`.

## Requirement status

| Activation requirement | Status | Evidence / remaining work |
|---|---|---|
| Baseline frozen; build/lint/tests/responsive | PASS | Results above; form contract test is `../scripts/test_form_contract_v2_1.py`; repeatable browser script is `scripts/activation-browser-check.cjs`. |
| Evidence constitution remains separate | PASS | Practical enum, Quality enum, Action Decision and human Readiness Decision remain distinct in model/schema/UI. Readiness rules explicitly short-circuit on critical failures/blockers; no average/composite is used. Sync writes no readiness-decision table. |
| Local authoritative XLSForms and field map audited | PASS | Both approved `20260819_v2_1` workbooks match their deployed definitions exactly: zero named-row, type, choice, required/relevant/calculation, version or form-ID differences. |
| Deployed Kobo Quick Finding asset identity | PASS | Authenticated v2 API confirms UID `au2BW5m74k5xkhuu4fQ7zA`, exact title, EU deployment, Enketo code and status `deployed`; deployed version is `20260819_v2_1`, content hash `cc01c0cf2c8835199625403dd0afab5792297808`. |
| Deployed Quick Finding field-map compatibility | PASS | v2.1 is authoritative and intentionally minimal. Hidden `tester_id`, location codes, stable ID, observation, recommendation and screenshot are normalized. Retired v2.0 fields are absent from the current model/schema. Quick Findings carry no participant blocker classification and cannot generate a possible blocker automatically. |
| Deployed Kobo Final Review asset identity | PASS | Authenticated v2 API confirms UID `aEzv42W4Ki9uB9hA8esyAC`, exact title, EU deployment, Enketo code and status `deployed`; deployed version is `20260819_v2_1`, content hash `f7f600283e56609bde2ab45837d1cee4dbc30856`. |
| Deployed Final Review field-map compatibility | PASS | The approved v2.1 workbook and deployment match exactly. Hidden identity/course, B01–B16, NOT TESTED, Quality codes and HRBA/PM branches are compatible. Comments intentionally appear only for blocked/fragile; workable requires no comment and separate open text remains preserved. |
| Stable non-editable tester/course identity in deployed forms | PASS (definition) | Quick/Final `tester_id` and Final `course` are hidden and required; Final `review_key` is unchanged. Exact `d[tester_id]` / `d[course]` Hub prefill is compatible, but a controlled launch/submission rehearsal remains pending. |
| Tester My Pilot Findings implementation | PASS | Dedicated private route, own Quick Findings only, All/HRBA/PM filters, ordered cards, time/location/text/recommendation, conditional screenshot link, empty state and course review links. |
| Analyst authorization boundary | PASS (code) | Signed analyst/admin session with optional email allowlist; untrusted identity headers are ignored. Production identity handoff still needs configuration. |
| Tester authorization/isolation boundary | PASS (controlled) | Signed HttpOnly tester session; four controlled tester identities passed exact separation; repeated records stay independent. Production Hub handoff still needs rehearsal. |
| Kobo REST new-submission ingestion | PASS (code) | Basic-auth endpoint is idempotent and tested. Kobo-side REST Service configuration is pending. |
| Kobo v2 edit/miss reconciliation | PASS (code) | Pagination and conflict upsert tests pass; stable key is asset UID + `_id`; latest Final Review per tester/course is used while history remains stored. A real Kobo edit rehearsal is pending. |
| Hobby-compatible scheduling | PASS (configuration) | Connected Vercel team plan is Hobby. Unsupported two-minute cron was replaced by daily 01:00 UTC; REST delivery and Refresh now provide faster paths. Folder is not yet linked to a Vercel project. |
| Supabase project identity/configuration | PASS (target locked) | `SUPABASE_URL` and `SUPABASE_DB_URL` independently resolve to required project ref `xkmkowmigupwotuphels`. The service-role key and database URL remain private. `NEXT_PUBLIC_DATA_MODE=sample`. |
| Supabase project application connection | PASS | `dec_pilot` Data API exposure is active: the authenticated server-side service-role path returned HTTP 200 for all 11 expected tables. An unauthenticated Data API request was denied with HTTP 401. No live mode was enabled. |
| Supabase migration 001 | PASS (applied) | Applied `database/001_dec_pilot_schema.sql` to the initially empty `dec_pilot` namespace with PostgreSQL 17 `psql`, `ON_ERROR_STOP=1`, and a single transaction. |
| Supabase migration 002 / browser-role security | PASS (applied and verified) | Applied after 001. Remote checks confirm no schema/table/sequence access for `anon` or `authenticated`, no public schema/table/sequence access, no browser-role default grants, both hardening indexes, and retained service-role schema/table/sequence access with RLS bypass. |
| Supabase `dec_pilot` objects | PASS (verified) | Remote catalog contains exactly 11 tables, five enums, nine sequences, zero views and zero functions; all 11 tables have RLS enabled and no browser policies. |
| Project account boundary lock | PASS (local) | Root `AGENTS.md` and `app/docs/PROJECT_ACCOUNT_LOCK.md` enforce the dedicated Supabase, GitHub and Vercel identities and the prohibition on inherited DEC/CSO Learning Hub credentials. Current GitHub CLI identity is `essetlab`, so all future GitHub action is stopped pending a human switch to `Girum-Beyene`. No Git repository/remote exists; Vercel identity/team was not detectable. |
| Local secret Git exclusion | PASS | Root and app ignore rules exclude `app/.env.local`, `.env`, `.env.*`, Supabase CLI state and common secret/key files. Verification used an isolated temporary Git repository; the workspace remains uninitialized. |
| Screenshot/attachment authorization | PASS (code) | Cross-tester denial is tested; server proxy enforces ownership/analyst access and Kobo-origin/image restrictions. Real Kobo attachment metadata/download is unverified. |
| Clean live-data rehearsal | FAIL | No real Kobo/Supabase/Vercel configuration or controlled live submissions are available. |
| Failed sync and recovery rehearsal | FAIL | Degraded UI state exists; real failure/recovery has not been exercised against deployed services. |
| Fixture isolation | PASS | Live-mode state initializes empty and never falls back to fixtures; sample banner appears only in test mode; fixture data remains client/test-only. |
| Dashboard semantics | PASS | Quick Findings are neutral event-level observations. Possible-blocker reporting uses only explicit Final Review responses or DEC analyst classifications; null/missing Quick legacy fields are not represented or counted. Historical/closed distinctions and “Final reviews” labeling remain explicit. |

## Required human configuration (enter directly in service consoles)

Do not send these values in chat. Configure them in the linked Vercel project/environment and the corresponding service consoles:

- Kobo: the non-secret EU base URL, both asset UIDs and both Enketo URLs are recorded, the private API token is configured, and both deployed v2.1 definitions are accepted as compatible. No Kobo form change is required.
- Kobo REST Services: destinations `/api/kobo/rest/quick` and `/api/kobo/rest/review`, with `KOBO_REST_USERNAME` and `KOBO_REST_PASSWORD`.
- Supabase: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_DB_URL` are privately configured and match project ref `xkmkowmigupwotuphels`; migrations, database security, explicit `dec_pilot` Data API exposure and server-side application access are verified. Automatic exposure of new tables is disabled. Do not send credentials in chat.
- Sessions/identity: high-entropy `TESTER_SESSION_SECRET`, `ANALYST_SESSION_SECRET`, `SESSION_ISSUER`, `APP_ADMIN_EMAILS`; configure the authenticated Hub/DEC identity provider to create signed handoffs.
- Vercel: link the intended project, configure `APP_BASE_URL`, `CRON_SECRET`, and keep `NEXT_PUBLIC_DATA_MODE=sample` through rehearsal.

## Required concise gate answers

- Detected Vercel plan and sync approach: **Hobby — Kobo REST Services for new submissions; manual Refresh plus daily Kobo v2 reconciliation for edits/misses.**
- Kobo Quick Finding asset UID verified: **YES**
- Kobo Quick Finding deployed field map verified compatible: **YES — intentional v2.1 minimal schema; no automatic blocker inference**
- Kobo Final Review asset UID verified: **YES**
- Kobo Final Review deployed field map verified compatible: **YES — blocked/fragile-only comments formally accepted**
- Tester My Findings view verified: **YES (controlled fixture/browser test)**
- Supabase migration 001 applied: **YES**
- Supabase migration 002 applied: **YES**
- Supabase `dec_pilot` schema verified: **YES**
- Supabase browser-role/security restrictions verified: **YES**
- Application Supabase connection verified: **YES**
- Supabase activation gate: **CLEAR**
- Live data rehearsal verified: **NO**
- Attachments verified: **NO (authorization code tested; real Kobo media path pending)**
- Edit reconciliation verified: **NO for live Kobo (automated reconciliation tests PASS)**
- Tester isolation verified: **YES (four controlled identities; production Hub handoff pending)**
- Fixture isolation verified: **YES**

## Blocking conditions

The Supabase activation gate is clear: target identity, both migrations, remote schema/security, explicit Data API exposure and server-side application access are verified. Migration 002 restrictions remain intact after exposure: `anon` and `authenticated` retain no schema/table access, public access and browser-role default grants remain absent, all tables retain RLS, and service-role access remains available. Overall live activation still awaits the separately gated production identity, attachment, REST Service and rehearsal work. GitHub action remains locked pending a human account switch from `essetlab` to `Girum-Beyene`. `NEXT_PUBLIC_DATA_MODE` remains `sample`; Vercel, REST Services and live mode were not configured in this pass.
