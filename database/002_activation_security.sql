-- Activation hardening for the server-mediated access model.
-- Apply after 001_dec_pilot_schema.sql in the dedicated pilot Supabase project.

revoke all on schema dec_pilot from public, anon, authenticated;
revoke all on all tables in schema dec_pilot from public, anon, authenticated;
revoke all on all sequences in schema dec_pilot from public, anon, authenticated;

-- Prevent future tables/sequences from becoming browser-readable by default.
alter default privileges in schema dec_pilot revoke all on tables from public, anon, authenticated;
alter default privileges in schema dec_pilot revoke all on sequences from public, anon, authenticated;

-- The application server is the only data access layer. It verifies signed analyst
-- or tester sessions before using the service role; browser clients receive no key.
grant usage on schema dec_pilot to service_role;
grant all on all tables in schema dec_pilot to service_role;
grant usage, select on all sequences in schema dec_pilot to service_role;

create index if not exists quick_findings_tester_submitted_idx
  on dec_pilot.quick_findings(tester_id, submitted_at desc);
create index if not exists final_reviews_tester_course_edited_idx
  on dec_pilot.final_reviews(tester_id, course, edited_at desc, submitted_at desc);

comment on table dec_pilot.quick_findings is
  'Server-only pilot evidence. Tester reads must be filtered by verified session tester_id.';
comment on table dec_pilot.raw_kobo_submissions is
  'Restricted raw source and attachment metadata; never grant to browser roles.';
