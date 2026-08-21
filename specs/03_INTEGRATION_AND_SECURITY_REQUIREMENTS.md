# Kobo integration and security requirements

## Integration objective
Choose the simplest reliable way to make the two Kobo forms available in a near-real-time dashboard while preserving source traceability and supporting edits/corrections to submissions.

## Preferred implementation hypothesis
- KoboToolbox current supported API -> server-side sync worker/API route -> normalized application store -> dashboard.
- Next.js/TypeScript + Supabase + Vercel is the preferred starting hypothesis because it is fast to build and maintain, but the agent must verify current official Kobo documentation and confirm that this is still the simplest reliable architecture.

## Required sync properties
- API token never exposed in browser JavaScript.
- Idempotent upsert keyed by stable Kobo submission identity.
- Handle pagination.
- Detect/update edited submissions rather than assuming append-only data.
- Keep raw source identifiers and source timestamps.
- Manual `Refresh now` plus visible `Last synced` state.
- Near-real-time target around 1-2 minutes where deployment limits make this practical.
- Retry/backoff and visible degraded-sync state if Kobo is unavailable.
- No duplicate records after repeated sync.
- Schema/field mapping is versioned so form changes are detectable.
- Screenshot/media access should be authorized and handled securely; do not make private attachments public by default.

## Data separation
Do not modify DEC Learning Hub learner/auth/progress tables. If the existing Supabase project is reused, create isolated dashboard tables/schema, service credentials and access policies.

## Access
Start with DEC internal staff. Build a clean authorization boundary so a later stakeholder-summary role can see aggregated evidence without tester identifiers, internal triage notes or sensitive operational records.

## Secrets
Use `.env.local` or deployment environment variables. Never commit Kobo token, service-role key or other credentials.
