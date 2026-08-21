# Tester identity, private findings and ingestion

## Identity contract

The Learning Hub (or approved DEC identity broker) signs short-lived HS256 handoff tokens. A tester handoff has audience `dec-tester-handoff`, a stable opaque `tester_id`, optional `display_name`, and allowed `courses` (`hrba`, `pm`). `/api/auth/tester-handoff` verifies it and immediately replaces it with an eight-hour, HttpOnly, SameSite=Lax `dec_tester_session` cookie before redirecting to `/my-findings`. Prefer POST handoff; GET is supported for a Hub link and immediately removes the token from the visible URL. Set `Referrer-Policy: no-referrer` on the Hub launch page too.

The tester page derives the database filter only from the verified cookie. It never accepts a tester ID in a query parameter or browser identity header. It returns only Quick Findings, and the attachment proxy repeats the same ownership check.

DEC analyst handoff uses audience `dec-analyst-handoff`, an allowlisted `email`, and role `analyst` or `admin`. It becomes an HttpOnly `dec_analyst_session`. API bearer JWTs use audience `dec-analyst`. A raw `x-authenticated-user-email` header is never trusted.

Generate handoffs in the authenticated Hub/server environment, never in browser JavaScript. Keep `TESTER_SESSION_SECRET`, `ANALYST_SESSION_SECRET`, `APP_ADMIN_EMAILS` and the optional `SESSION_ISSUER` server-side.

## Kobo links

`KOBO_REVIEW_FORM_URL` is transformed into an Enketo link with `d[tester_id]`, `d[course]`, and `return_url` parameters. This matches Kobo's documented web-form prefill syntax. The two local XLSForms currently make tester/course values editable, so deployed-form verification or an approved hidden-field revision remains an activation gate.

## Ingestion paths

- `POST /api/kobo/rest/quick` and `/api/kobo/rest/review`: HTTP Basic-authenticated Kobo REST Service destinations for new submissions. Each immediately upserts raw and normalized data using `(source_asset_uid, source_submission_id)`.
- `GET|POST /api/sync`: paginated Kobo v2 reconciliation. It retrieves the current asset form hash, reprocesses all records idempotently, and applies edits to the same stable `_id` record. `_uuid` is retained as changing source metadata, not used as the conflict key.
- Daily Vercel Hobby cron at 01:00 UTC plus analyst **Refresh now**. REST delivery does not replace v2 reconciliation because Kobo REST Services do not propagate edits.

Kobo REST Services should be configured with distinct random Basic credentials for each environment. Kobo, Supabase and session secrets belong only in Vercel's encrypted environment configuration, not source files or chat.

## Attachment boundary

The database stores the screenshot filename/reference and raw Kobo `_attachments` metadata. `/api/attachments/{sourceSubmissionId}` checks analyst authorization or exact tester ownership, resolves the matching attachment server-side, restricts upstream retrieval to the configured Kobo origin, streams image MIME types only, and uses private/no-store headers. It never exposes the Kobo token or raw download URL.
