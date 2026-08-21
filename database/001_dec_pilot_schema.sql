-- DEC Internal Pilot dashboard. Run only in the intended Supabase project.
-- This dedicated schema does not read from or write to Learning Hub learner/auth/progress tables.
create schema if not exists dec_pilot;
grant usage on schema dec_pilot to service_role;

create type dec_pilot.practical_result as enum ('PASS','PASS WITH ISSUE','FAIL','NOT TESTED');
create type dec_pilot.quality_rating as enum ('0 BLOCKED','1 FRAGILE','2 WORKABLE','3 STRONG','NOT TESTED / N/A');
create type dec_pilot.action_decision as enum ('Fix Now','Improve Before Wider Use','Retain as Designed','Investigate Further','Consider for a Later Phase');
create type dec_pilot.readiness_decision as enum ('READY','READY WITH MINOR IMPROVEMENTS','HOLD - CORRECT IMPORTANT ISSUE(S) FIRST','INSUFFICIENT EVIDENCE - NEED MORE TESTING');
create type dec_pilot.decision_horizon as enum ('During internal pilot','Before selected-CSO pilot','Validate during selected-CSO pilot','Before wider release','Later programme / phase','Retain / no change');

create table dec_pilot.raw_kobo_submissions (
  id bigint generated always as identity primary key,
  source_form text not null check (source_form in ('quick','review')),
  source_asset_uid text not null,
  source_submission_id text not null,
  source_uuid text,
  source_submitted_at timestamptz,
  source_edited_at timestamptz,
  form_version_hash text,
  payload_hash text not null,
  payload jsonb not null,
  synced_at timestamptz not null default now(),
  unique(source_asset_uid, source_submission_id)
);

create table dec_pilot.sync_runs (
  id bigint generated always as identity primary key,
  started_at timestamptz not null,
  completed_at timestamptz,
  status text not null check (status in ('running','success','failed')),
  submission_count integer,
  assets jsonb,
  error_message text
);

create table dec_pilot.quick_findings (
  id bigint generated always as identity primary key,
  source_form text not null default 'quick', source_asset_uid text not null, source_submission_id text not null, source_uuid text,
  submitted_at timestamptz, edited_at timestamptz, tester_id text, observation_location text, stable_id text,
  what_happened text, recommendation text, screenshot_ref text,
  unique(source_asset_uid, source_submission_id)
);

create table dec_pilot.final_reviews (
  id bigint generated always as identity primary key,
  source_form text not null default 'review', source_asset_uid text not null, source_submission_id text not null, source_uuid text,
  submitted_at timestamptz, edited_at timestamptz, review_key text, tester_id text, course text check (course in ('hrba','pm')),
  testing_role text, main_device text, internet_experience text, completion_amount text, learner_status text,
  possible_blocker text check (possible_blocker in ('yes','no','not_sure')),
  action_recommendation text, readiness_recommendation text, readiness_reason text,
  unique(source_asset_uid, source_submission_id)
);

create table dec_pilot.practical_checks (
  id bigint generated always as identity primary key,
  source_asset_uid text not null, source_submission_id text not null, xml_name text not null, label text not null,
  result text check (result in ('pass','pass_issue','fail','not_tested')), applicable boolean not null,
  critical_scope text check (critical_scope in ('hub','course')), what_happened text, recommendation text,
  unique(source_asset_uid, source_submission_id, xml_name)
);

create table dec_pilot.quality_ratings (
  id bigint generated always as identity primary key,
  source_asset_uid text not null, source_submission_id text not null, xml_name text not null, label text not null,
  domain text not null, applies_to text not null check (applies_to in ('all','hrba','pm')),
  rating text check (rating in ('blocked_0','fragile_1','workable_2','strong_3','not_tested')), comment text,
  unique(source_asset_uid, source_submission_id, xml_name)
);

create table dec_pilot.qualitative_evidence (
  id bigint generated always as identity primary key,
  source_asset_uid text not null, source_submission_id text not null, tester_id text, course text,
  source_field text not null, evidence_type text not null, domain text not null, excerpt text not null,
  unique(source_asset_uid, source_submission_id, source_field)
);

create table dec_pilot.findings (
  id uuid primary key default gen_random_uuid(), finding_id text not null unique, course_hub text not null, domain text not null,
  evidence text not null, evidence_count integer not null default 1, recurrence text, severity text not null check (severity in ('Low','Medium','High','Critical')),
  blocker_classification text not null check (blocker_classification in ('Confirmed blocker','Possible blocker','Not a blocker','Needs triage')),
  interpretation text, action_decision dec_pilot.action_decision not null, recommended_action text, priority text check (priority in ('Low','Medium','High')),
  responsible_person_unit text, target_timing date, status text not null check (status in ('New','Under Review','Action Agreed','In Progress','Ready for Verification','Verified Closed','Not an Issue')),
  verification_result text, response_area text, finding_type text, decision_horizon dec_pilot.decision_horizon not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table dec_pilot.finding_sources (
  finding_id uuid not null references dec_pilot.findings(id) on delete cascade,
  source_type text not null, source_record_id text not null, source_field text,
  primary key(finding_id, source_type, source_record_id, source_field)
);

create table dec_pilot.finding_history (
  id bigint generated always as identity primary key, finding_id uuid not null references dec_pilot.findings(id) on delete cascade,
  changed_at timestamptz not null default now(), changed_by uuid references auth.users(id), event text not null, snapshot jsonb
);

create table dec_pilot.readiness_decisions (
  id bigint generated always as identity primary key, course_hub text not null check (course_hub in ('hub','hrba','pm')),
  decision dec_pilot.readiness_decision not null, reason text not null, decision_owner_group text not null, decision_date date not null,
  recorded_by uuid references auth.users(id), recorded_at timestamptz not null default now()
);

create index on dec_pilot.raw_kobo_submissions(source_edited_at desc);
create index on dec_pilot.final_reviews(course, submitted_at desc);
create index on dec_pilot.practical_checks(xml_name, result);
create index on dec_pilot.quality_ratings(domain, xml_name, rating);
create index on dec_pilot.qualitative_evidence using gin(to_tsvector('english', excerpt));
create index on dec_pilot.findings(decision_horizon, status, priority);

alter table dec_pilot.raw_kobo_submissions enable row level security;
alter table dec_pilot.sync_runs enable row level security;
alter table dec_pilot.quick_findings enable row level security;
alter table dec_pilot.final_reviews enable row level security;
alter table dec_pilot.practical_checks enable row level security;
alter table dec_pilot.quality_ratings enable row level security;
alter table dec_pilot.qualitative_evidence enable row level security;
alter table dec_pilot.findings enable row level security;
alter table dec_pilot.finding_sources enable row level security;
alter table dec_pilot.finding_history enable row level security;
alter table dec_pilot.readiness_decisions enable row level security;

-- Service-role sync bypasses RLS. Add authenticated policies only after DEC's identity provider is configured.
-- Never grant raw payload or tester-level evidence to a future stakeholder-summary role.
grant all on all tables in schema dec_pilot to service_role;
grant usage, select on all sequences in schema dec_pilot to service_role;
