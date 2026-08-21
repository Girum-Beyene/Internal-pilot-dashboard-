import { createHash } from "node:crypto";
import { normalizedRows, KoboPayload } from "./normalize";
import { insertRow, upsertRows } from "./supabase-rest";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function koboFetch(url: string, token: string, attempts = 3): Promise<Response> {
  let last: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetch(url, { headers: { Authorization: `Token ${token}`, Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(25_000) });
      if (response.ok) return response;
      if (response.status < 500 && response.status !== 429) throw new Error(`Kobo request failed (${response.status})`);
      last = new Error(`Kobo temporarily unavailable (${response.status})`);
    } catch (error) { last = error; }
    await sleep(350 * 2 ** attempt);
  }
  throw last;
}

async function syncAsset(sourceForm: "quick" | "review", assetUid: string, baseUrl: string, token: string) {
  const assetResponse = await koboFetch(`${baseUrl}/api/v2/assets/${assetUid}/`, token);
  const asset = await assetResponse.json();
  const formHash = asset.version__content_hash ?? null;
  let next: string | null = `${baseUrl}/api/v2/assets/${assetUid}/data/?limit=1000`;
  let pages = 0; let submissions = 0;
  while (next) {
    const response = await koboFetch(next, token);
    const page: { results: KoboPayload[]; next: string | null } = await response.json();
    pages++; submissions += page.results.length;
    for (const payload of page.results) {
      await persistKoboSubmission(sourceForm, assetUid, payload, formHash);
    }
    next = page.next;
  }
  return { sourceForm, assetUid, formHash, pages, submissions };
}

export async function persistKoboSubmission(sourceForm: "quick" | "review", assetUid: string, payload: KoboPayload, formHash: string | null = null) {
  const sourceSubmissionId = String(payload._id ?? payload._uuid ?? "");
  if (!sourceSubmissionId) throw new Error("Kobo submission is missing both _id and _uuid.");
  const raw = {
    source_form: sourceForm,
    source_asset_uid: assetUid,
    source_submission_id: sourceSubmissionId,
    source_uuid: String(payload._uuid ?? payload._root_uuid ?? sourceSubmissionId),
    source_submitted_at: payload._submission_time ?? null,
    source_edited_at: payload._last_edited ?? payload._submission_time ?? null,
    form_version_hash: formHash,
    payload_hash: createHash("sha256").update(JSON.stringify(payload)).digest("hex"),
    payload,
    synced_at: new Date().toISOString(),
  };
  await upsertRows("raw_kobo_submissions", [raw], "source_asset_uid,source_submission_id");
  const rows = normalizedRows(sourceForm, assetUid, payload);
  await upsertRows(rows.parent.table, [rows.parent.row], rows.parent.conflict);
  if (sourceForm === "review") {
    await upsertRows("practical_checks", rows.practical, "source_asset_uid,source_submission_id,xml_name");
    await upsertRows("quality_ratings", rows.quality, "source_asset_uid,source_submission_id,xml_name");
    await upsertRows("qualitative_evidence", rows.qualitative, "source_asset_uid,source_submission_id,source_field");
  }
  return { sourceForm, assetUid, sourceSubmissionId };
}

export async function runKoboSync() {
  const baseUrl = (process.env.KOBO_BASE_URL ?? "").replace(/\/$/, "");
  const token = process.env.KOBO_API_TOKEN;
  const reviewUid = process.env.KOBO_REVIEW_FORM_UID;
  const quickUid = process.env.KOBO_QUICK_FINDING_FORM_UID ?? process.env.KOBO_QUICK_FORM_UID;
  if (!baseUrl || !token || !reviewUid || !quickUid) throw new Error("Kobo credentials and both form UIDs must be configured server-side.");
  const startedAt = new Date().toISOString();
  try {
    const assets = [];
    // Sequential sync avoids unnecessary concurrent pressure on the Kobo account.
    assets.push(await syncAsset("quick", quickUid, baseUrl, token));
    assets.push(await syncAsset("review", reviewUid, baseUrl, token));
    await insertRow("sync_runs", { started_at: startedAt, completed_at: new Date().toISOString(), status: "success", assets, submission_count: assets.reduce((sum, a) => sum + a.submissions, 0) });
    return { status: "success", startedAt, completedAt: new Date().toISOString(), assets };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sync error";
    try { await insertRow("sync_runs", { started_at: startedAt, completed_at: new Date().toISOString(), status: "failed", error_message: message }); } catch { /* primary error is more useful */ }
    throw error;
  }
}
