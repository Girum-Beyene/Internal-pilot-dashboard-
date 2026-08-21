import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { currentFinalReviews, possibleBlockerSummary } from "../src/lib/analytics";
import { SAMPLE_FINDINGS, SAMPLE_QUICK_FINDINGS, SAMPLE_REVIEWS } from "../src/lib/fixtures";
import { signToken, testerClaimsFromToken, verifySignedToken } from "../src/lib/server/auth";
import { buildFinalReviewUrl, findingsForTester, formatTesterSubmittedAt } from "../src/lib/tester-findings";
import { POST as ingest } from "../src/app/api/kobo/rest/[form]/route";
import { GET as attachment } from "../src/app/api/attachments/[sourceId]/route";
import { GET as evidence } from "../src/app/api/evidence/route";

test("signed tester identity rejects tampering and expired tokens", () => {
  const secret = "test-secret-with-sufficient-entropy";
  const token = signToken({ aud: "dec-tester", tester_id: "T-A", courses: ["hrba"] }, secret);
  assert.equal(verifySignedToken(token, secret, "dec-tester")?.tester_id, "T-A");
  const [header, payload, signature] = token.split(".");
  const tampered = `${header}.${payload}.${signature[0] === "A" ? "B" : "A"}${signature.slice(1)}`;
  assert.equal(verifySignedToken(tampered, secret, "dec-tester"), null);
  const expired = signToken({ aud: "dec-tester", tester_id: "T-A", exp: Math.floor(Date.now() / 1000) - 1 }, secret);
  assert.equal(verifySignedToken(expired, secret, "dec-tester"), null);
});

test("public real dashboard receives a zero-evidence envelope without dec_pilot records", async () => {
  const response = await evidence(new NextRequest("https://app.example/api/evidence"));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { reviews: [], quick: [], findings: [], sample: false, archivedReviewVersions: 0, lastSync: null, access: "Internal DEC access required for pilot evidence." });
});

test("four-tester finding separation keeps repeated observations independent", () => {
  const controlled = ["T-A", "T-B", "T-C", "T-D"].flatMap((testerId, testerIndex) => [0, 1].map((observationIndex) => ({ ...SAMPLE_QUICK_FINDINGS[0], id: `${testerId}-${observationIndex}`, sourceId: `${testerIndex}${observationIndex}`, testerId, course: observationIndex ? "pm" as const : "hrba" as const })));
  for (const testerId of ["T-A", "T-B", "T-C", "T-D"]) {
    const own = findingsForTester(controlled, testerId);
    assert.equal(own.length, 2);
    assert.ok(own.every((item) => item.testerId === testerId));
    assert.equal(new Set(own.map((item) => item.sourceId)).size, 2);
  }
});

test("tester finding dates render deterministically in the pilot time zone", () => {
  assert.equal(formatTesterSubmittedAt("2026-08-18T12:00:00.000Z"), "18 Aug 2026, 15:00 EAT");
  assert.equal(formatTesterSubmittedAt("not-a-date"), "Date unavailable");
});

test("Final Review links use Kobo data-entry URLs and the deployed sec_a prefill paths", () => {
  const result = buildFinalReviewUrl("https://ee-eu.kobotoolbox.org/x/61nQdMoN?lang=en", "CONTROLLED_TESTER_001", "pm", "https://dashboard.example/my-findings");
  const url = new URL(result!);
  assert.equal(url.pathname, "/61nQdMoN");
  assert.equal(url.searchParams.get("lang"), "en");
  assert.equal(url.searchParams.get("d[sec_a/tester_id]"), "CONTROLLED_TESTER_001");
  assert.equal(url.searchParams.get("d[sec_a/course]"), "pm");
  assert.equal(url.searchParams.get("return_url"), "https://dashboard.example/my-findings");
  assert.equal(url.searchParams.has("d[tester_id]"), false);
});

test("current Final Review uses the latest version per tester and course without collapsing courses", () => {
  const base = SAMPLE_REVIEWS[0];
  const reviews = [base, { ...base, id: "new-source", sourceId: "new-source", submittedAt: "2026-08-19T10:00:00Z", completion: "Edited current review" }, { ...base, id: "pm-source", sourceId: "pm-source", course: "pm" as const }];
  const current = currentFinalReviews(reviews);
  assert.equal(current.length, 2);
  assert.equal(current.find((item) => item.course === "hrba")?.sourceId, "new-source");
  assert.equal(current.find((item) => item.course === "pm")?.sourceId, "pm-source");
});

test("possible blocker headline excludes closed historical reports", () => {
  const reviews = [{ ...SAMPLE_REVIEWS[0], id: "closed-source", sourceId: "closed-source", possibleBlocker: "yes" as const }, { ...SAMPLE_REVIEWS[1], id: "open-source", sourceId: "open-source", possibleBlocker: "not_sure" as const }];
  const closed = { ...SAMPLE_FINDINGS[0], sourceRecordIds: ["closed-source"], status: "Verified Closed" as const };
  const summary = possibleBlockerSummary(reviews, [closed]);
  assert.equal(summary.historical.length, 2);
  assert.equal(summary.unresolved.length, 1);
  assert.equal(summary.closedCount, 1);
});

test("REST Service ingestion is Basic-authenticated and idempotent by Kobo source id", async () => {
  const originalFetch = global.fetch;
  const originalEnv = { ...process.env };
  const calls: { url: string; init?: RequestInit }[] = [];
  process.env.KOBO_REST_USERNAME = "kobo-rest";
  process.env.KOBO_REST_PASSWORD = "not-logged";
  process.env.KOBO_QUICK_FINDING_FORM_UID = "QUICK";
  process.env.SUPABASE_URL = "https://db.example";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
  global.fetch = async (input, init) => { calls.push({ url: String(input), init }); return new Response("[]", { status: 201, headers: { "Content-Type": "application/json" } }); };
  const payload = { _id: 7001, _uuid: "uuid-create", tester_id: "T-A", observation_location: "hrba", stable_id: "M1/A2", what_happened: "Observed", recommendation: "Keep" };
  try {
    const auth = `Basic ${Buffer.from("kobo-rest:not-logged").toString("base64")}`;
    for (let index = 0; index < 2; index++) {
      const request = new NextRequest("https://app.example/api/kobo/rest/quick", { method: "POST", headers: { Authorization: auth, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      assert.equal((await ingest(request, { params: Promise.resolve({ form: "quick" }) })).status, 202);
    }
    assert.ok(calls.every((call) => call.url.includes("on_conflict=source_asset_uid%2Csource_submission_id")));
    assert.ok(calls.every((call) => !String(call.init?.body).includes("not-logged")));
  } finally {
    global.fetch = originalFetch;
    process.env = originalEnv;
  }
});

test("attachment endpoint applies the same tester boundary", async () => {
  const originalFetch = global.fetch;
  const originalEnv = { ...process.env };
  process.env.TESTER_SESSION_SECRET = "tester-session-secret";
  process.env.SUPABASE_URL = "https://db.example";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
  const token = signToken({ aud: "dec-tester", tester_id: "T-A" }, process.env.TESTER_SESSION_SECRET);
  assert.equal(testerClaimsFromToken(token)?.tester_id, "T-A");
  global.fetch = async () => Response.json([{ source_asset_uid: "QUICK", source_submission_id: "7001", tester_id: "T-B", screenshot_ref: "shot.jpg" }]);
  try {
    const request = new NextRequest("https://app.example/api/attachments/7001", { headers: { Cookie: `dec_tester_session=${token}` } });
    assert.equal((await attachment(request, { params: Promise.resolve({ sourceId: "7001" }) })).status, 403);
  } finally {
    global.fetch = originalFetch;
    process.env = originalEnv;
  }
});
