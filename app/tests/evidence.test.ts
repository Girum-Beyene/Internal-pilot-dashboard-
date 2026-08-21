import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { allReadiness, possibleBlockerSummary, readinessSignal } from "../src/lib/analytics";
import { SAMPLE_FINDINGS, SAMPLE_REVIEWS } from "../src/lib/fixtures";
import { normalizedRows } from "../src/lib/server/normalize";
import { runKoboSync } from "../src/lib/server/kobo-sync";

const fixture = (name: string) => JSON.parse(readFileSync(join(process.cwd(), "..", "fixtures", name), "utf8"));

test("preserves HRBA group-prefixed XML leaves and course skip logic", () => {
  const rows = normalizedRows("review", "REVIEW", fixture("kobo_review_hrba.json"));
  assert.equal((rows.parent.row as Record<string, unknown>).course, "hrba");
  assert.equal(rows.quality.find((x) => x.xml_name === "eh03_design")?.rating, "strong_3");
  assert.equal(rows.quality.some((x) => x.xml_name.startsWith("ep")), false);
  assert.equal(rows.practical.find((x) => x.xml_name === "b04_course_separation")?.applicable, false);
});

test("preserves PM-only indicators and NOT TESTED as evidence state", () => {
  const rows = normalizedRows("review", "REVIEW", fixture("kobo_review_pm.json"));
  assert.equal(rows.quality.find((x) => x.xml_name === "ep04_risk_change")?.rating, "fragile_1");
  assert.equal(rows.quality.some((x) => x.xml_name.startsWith("eh")), false);
  assert.equal(rows.practical.find((x) => x.xml_name === "b11_final_assessment")?.result, "not_tested");
});

test("Final Review v2.1 accepts WORKABLE without an indicator comment and preserves separate open text", () => {
  const payload = { ...fixture("kobo_review_hrba.json"), c01_enter_hub: "workable_2", c_access_improvement: "Keep the separate orientation cue." };
  delete payload.c01_enter_hub_comment;
  const rows = normalizedRows("review", "REVIEW", payload);
  assert.equal(rows.quality.find((item) => item.xml_name === "c01_enter_hub")?.rating, "workable_2");
  assert.equal(rows.quality.find((item) => item.xml_name === "c01_enter_hub")?.comment, null);
  assert.equal(rows.qualitative.some((item) => item.source_field === "c01_enter_hub_comment"), false);
  assert.equal(rows.qualitative.find((item) => item.source_field === "c_access_improvement")?.excerpt, "Keep the separate orientation cue.");
});

test("maps Quick Finding v2.1 without legacy category or blocker fields", () => {
  const page = fixture("kobo_quick_page_1.json");
  const rows = normalizedRows("quick", "QUICK", { ...page.results[0], blocker_flag: null });
  assert.equal(rows.parent.row.source_submission_id, "80503");
  assert.match(String((rows.parent.row as Record<string, unknown>).what_happened), /progression remained locked/);
  assert.equal(Object.hasOwn(rows.parent.row, "blocker_flag"), false);
  assert.equal(Object.hasOwn(rows.parent.row, "finding_category"), false);
  assert.equal(Object.hasOwn(rows.parent.row, "issue_device_browser"), false);
  const reviewsWithNoExplicitReport = SAMPLE_REVIEWS.map((review) => ({ ...review, possibleBlocker: "no" as const }));
  assert.equal(possibleBlockerSummary(reviewsWithNoExplicitReport, []).historical.length, 0);
});

test("keeps Hub, HRBA and PM readiness separate", () => {
  const signals = allReadiness(SAMPLE_REVIEWS, SAMPLE_FINDINGS);
  assert.equal(signals.length, 3);
  assert.equal(signals.find((x) => x.course === "pm")?.decision, "HOLD - CORRECT IMPORTANT ISSUE(S) FIRST");
  assert.equal(signals.find((x) => x.course === "hrba")?.decision, "READY WITH MINOR IMPROVEMENTS");
  assert.equal(signals.find((x) => x.course === "hub")?.decision, "READY WITH MINOR IMPROVEMENTS");
});

test("verified closure removes a blocker from unresolved counts but not history", () => {
  const closed = SAMPLE_FINDINGS.map((f) => f.id === "SIM-F-003" ? { ...f, status: "Verified Closed" as const, verification: "Independent retest passed." } : f);
  const signal = readinessSignal("pm", SAMPLE_REVIEWS, closed);
  assert.equal(signal.unresolvedCritical, 0);
  assert.ok(signal.historicalBlockers > 0);
  assert.equal(signal.decision, "READY WITH MINOR IMPROVEMENTS");
});

test("repeated normalization uses the same stable conflict identity for edited records", () => {
  const original = fixture("kobo_review_hrba.json");
  const edited = { ...original, _last_edited: "2026-08-18T10:20:00Z", j_priority_improvement: "Edited source wording." };
  const a = normalizedRows("review", "REVIEW", original);
  const b = normalizedRows("review", "REVIEW", edited);
  assert.equal(a.parent.row.source_submission_id, b.parent.row.source_submission_id);
  assert.equal(b.qualitative.find((x) => x.source_field === "j_priority_improvement")?.excerpt, "Edited source wording.");
});

test("Kobo sync follows pagination and uses idempotent conflict upserts", async () => {
  const originalFetch = global.fetch;
  const originalEnv = { ...process.env };
  const calls: { url: string; init?: RequestInit }[] = [];
  process.env.KOBO_BASE_URL = "https://kf.example";
  process.env.KOBO_API_TOKEN = "server-only-test-token";
  process.env.KOBO_QUICK_FINDING_FORM_UID = "QUICK";
  process.env.KOBO_REVIEW_FORM_UID = "REVIEW";
  process.env.SUPABASE_URL = "https://db.example";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "server-only-service-key";
  global.fetch = async (input, init) => {
    const url = String(input); calls.push({ url, init });
    if (url.startsWith("https://db.example")) return new Response("[]", { status: 201, headers: { "Content-Type": "application/json" } });
    if (/\/assets\/(QUICK|REVIEW)\/$/.test(url)) return Response.json({ version__content_hash: "form-v2" });
    const isReview = url.includes("/REVIEW/");
    const payload = isReview ? fixture("kobo_review_hrba.json") : fixture("kobo_quick_page_1.json").results[0];
    if (url.includes("page=2")) return Response.json({ count: 2, next: null, previous: null, results: [{ ...payload, _id: Number(payload._id) + 1, _uuid: `${payload._uuid}-page-2` }] });
    return Response.json({ count: 2, next: url.split("?")[0] + "?page=2", previous: null, results: [payload] });
  };
  try {
    const result = await runKoboSync();
    assert.deepEqual(result.assets.map((a) => a.pages), [2, 2]);
    assert.equal(calls.filter((c) => c.url.includes("page=2")).length, 2);
    assert.ok(calls.some((c) => String(new Headers(c.init?.headers).get("Prefer")).includes("merge-duplicates")));
    assert.ok(calls.every((c) => !JSON.stringify(c.init?.body ?? "").includes("server-only-test-token")));
    assert.ok(calls.every((c) => !c.url.includes("readiness_decisions")), "source synchronization must never overwrite DEC's human readiness record");
  } finally {
    global.fetch = originalFetch;
    process.env = originalEnv;
  }
});
